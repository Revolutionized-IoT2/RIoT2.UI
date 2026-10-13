// Contract tests (I05, plan M7 steps 2-3). They read files from the sibling repositories, as in
// the local workspace; CI clones RIoT2.Core and RIoT2.Net.Orchestrator next to this repository.
//   - Every orchestrator URL in src/models/constants.ts exists in the orchestrator's OpenAPI
//     document (RIoT2.Net.Orchestrator/openapi/riot2-orchestrator.json) with the HTTP method the
//     UI uses.
//   - The golden MQTT messages (RIoT2.Core/contracts/golden) go through the UI's real handler.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadSource } = require('./source-loader.cjs');

const workspace = path.join(__dirname, '..', '..');
const openApiPath = path.join(workspace, 'RIoT2.Net.Orchestrator', 'openapi', 'riot2-orchestrator.json');
const goldenPath = path.join(workspace, 'RIoT2.Core', 'contracts', 'golden');

function requireSibling(file, repository) {
  if (!fs.existsSync(file))
    throw new Error(`${file} is missing. Clone ${repository} next to RIoT2.UI.`);
  return file;
}

const segments = route => route.split('?')[0].toLowerCase().split('/').filter(Boolean);
const isParameter = segment => /^\{[^}]+\}$/.test(segment);

function loadOpenApiRoutes() {
  const document = JSON.parse(fs.readFileSync(requireSibling(openApiPath, 'RIoT2.Net.Orchestrator'), 'utf8'));
  return Object.entries(document.paths).map(([route, operations]) => ({
    route,
    segments: segments(route),
    methods: new Set(Object.keys(operations).map(m => m.toLowerCase())),
  }));
}

// A UI placeholder stands for any value, so the document must have a parameter there. A literal
// segment matches the same literal or a parameter.
function findRoute(routes, url, method) {
  const wanted = segments(url);
  return routes.find(r => r.methods.has(method) && r.segments.length === wanted.length &&
    r.segments.every((s, i) => isParameter(wanted[i]) ? isParameter(s) : isParameter(s) || s === wanted[i]));
}

// How the UI calls each constant: the httpClient method after it, and literal placeholder values
// (for example urlGetReportOrCommandState with {type} = "report" or "command").
function collectUsages() {
  const usages = new Map();
  const apiFolder = path.join(__dirname, '..', 'src', 'composables', 'api');
  for (const file of fs.readdirSync(apiFolder).filter(f => f.endsWith('.ts'))) {
    const source = fs.readFileSync(path.join(apiFolder, file), 'utf8');
    const matches = [...source.matchAll(/Constants\.(url\w+)/g)];
    matches.forEach((match, i) => {
      const window = source.slice(match.index, matches[i + 1]?.index ?? source.length);
      const method = window.match(/httpClient\.(get|post|put|delete|patch)\b/)?.[1] ?? 'get';
      const usage = usages.get(match[1]) ?? { methods: new Set(), values: {} };
      usage.methods.add(method);
      for (const [, name, value] of window.matchAll(/\.replace\(\s*['"]\{(\w+)\}['"]\s*,\s*['"]([^'"]+)['"]\s*\)/g))
        (usage.values[name] ??= new Set()).add(value);
      usages.set(match[1], usage);
    });
  }
  return usages;
}

function expand(url, values) {
  let urls = [url];
  for (const [name, options] of Object.entries(values))
    urls = urls.flatMap(u => [...options].map(o => u.replace(`{${name}}`, o)));
  return urls;
}

test('every orchestrator URL the UI calls exists in the OpenAPI document with the same method', () => {
  const routes = loadOpenApiRoutes();
  const { Constants } = loadSource('src/models/constants.ts');
  const usages = collectUsages();
  const urls = Object.entries(Constants).filter(([name, value]) => name.startsWith('url') && typeof value === 'string');
  assert.ok(urls.length > 20, 'constants.ts should define the orchestrator URLs');

  const missing = [];
  for (const [name, url] of urls) {
    const usage = usages.get(name) ?? { methods: new Set(['get']), values: {} };
    for (const method of usage.methods)
      for (const concrete of expand(url, usage.values))
        if (!findRoute(routes, concrete, method))
          missing.push(`${method.toUpperCase()} ${concrete} (Constants.${name})`);
  }
  assert.deepEqual(missing, [], 'The orchestrator has no such endpoint. Fix the URL or add the endpoint.');
});

test('the route check rejects a route or method the orchestrator does not have', () => {
  const routes = loadOpenApiRoutes();
  assert.ok(findRoute(routes, '/api/variable/{id}/value', 'get'));
  assert.equal(findRoute(routes, '/api/variable/{id}/missing', 'get'), undefined);
  assert.equal(findRoute(routes, '/api/command/execute', 'get'), undefined);
  assert.equal(findRoute(routes, '/api/nodes/report/templates/extra', 'get'), undefined);
});

function loadApp(store, reports) {
  const app = loadSource('src/App.vue', {
    expose: ['mqttMessageReceived', 'configureDashboardTopic', 'emitter'],
    mocks: {
      mitt: { default: require('mitt').default ?? require('mitt') },
      uuid: { v4: () => 'ui-test' },
      '@/composables/mqttService': { useMqtt: () => ({ connect() {}, subscribe() {}, sendMessage() {}, disConnect() {}, status: {} }) },
      './composables/orchestratorService': {
        useOrchestrator: () => ({ getReportTemplates() {}, getCommandTemplates() {}, getVariableTemplates() {} }),
      },
      './stores/orchestratorStore': { useOrchestratorStore: () => store },
      './stores/errorStore': { useErrorStore: () => ({ setError: error => { throw new Error(error.message); } }) },
    },
  });
  app.state.emitter.on('mqttReportReceived', report => reports.push(report));
  return app;
}

test('the UI reads every golden report message', t => {
  const folder = path.join(requireSibling(goldenPath, 'RIoT2.Core'), 'messages');
  const files = fs.readdirSync(folder).filter(f => /^report-.*\.json$/.test(f));
  assert.equal(files.length, 5, 'one golden report per ValueType');
  const reports = [];
  const app = loadApp({}, reports);
  t.after(app.dispose);

  for (const file of files) {
    const golden = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8'));
    app.state.mqttMessageReceived('riot2/node/golden/report', JSON.stringify(golden));
    const report = reports.at(-1);
    assert.equal(report.id, golden.id, file);
    assert.equal(report.timeStamp, golden.timeStamp, file);
    assert.deepEqual(JSON.parse(JSON.stringify(report.value)), golden.value, file);
  }
  assert.equal(reports.length, files.length);
});

test('the UI takes the orchestrator URL from the golden configuration command', t => {
  const golden = fs.readFileSync(path.join(requireSibling(goldenPath, 'RIoT2.Core'), 'messages', 'configuration-command.json'), 'utf8');
  const store = {};
  const app = loadApp(store, []);
  t.after(app.dispose);

  app.state.mqttMessageReceived(app.state.configureDashboardTopic, golden);

  assert.equal(store.baseUrl, JSON.parse(golden).apiBaseUrl);
});
