// The Pinia stores (I24, plan M3 step 2): requests resolve to data, failures set the store's error and
// reach the snackbar, and saves reload what they change.
import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const { AxiosError } = cjs('axios');
const { createPinia, setActivePinia } = cjs('pinia');
const { loadSource } = cjs('./source-loader.cjs');

// Objects made in the loaded source belong to another VM context.
const plain = value => JSON.parse(JSON.stringify(value));

function errorRecorder() {
  const reported = [];
  return { reported, mock: { './errorStore': { useErrorStore: () => ({ report: error => reported.push(error) }) } } };
}

test('a failed request sets the store error, reaches the snackbar and resolves to undefined', async t => {
  setActivePinia(createPinia());
  const errors = errorRecorder();
  const module = loadSource('src/stores/requests.ts', { mocks: errors.mock });
  t.after(module.dispose);
  const requests = module.useRequests();

  let release;
  const pending = requests.run(() => new Promise(resolve => { release = resolve; }));
  assert.equal(requests.loading.value, true);
  release(null);
  assert.equal(await pending, null, 'an empty answer is null, not a failure');
  assert.equal(requests.loading.value, false);

  assert.equal(await requests.run(async () => { throw new Error('offline'); }), undefined);
  assert.equal(requests.error.value, 'offline');
  assert.equal(errors.reported.length, 1);

  await requests.run(async () => 1);
  assert.equal(requests.error.value, null, 'the next request clears the error');
});

test('the HTTP client turns a failed request into an ApiError with the status and the reason', () => {
  const { toApiError, ApiError } = loadSource('src/composables/httpClientService.ts');
  const failed = new AxiosError('Request failed with status code 400', 'ERR_BAD_REQUEST', undefined, undefined,
    { status: 400, data: { detail: 'The cron expression is invalid.' } });

  const error = toApiError(failed, 'http://orchestrator/api/x');

  assert.ok(error instanceof ApiError);
  assert.equal(error.status, 400);
  assert.equal(error.url, 'http://orchestrator/api/x');
  assert.equal(error.detail, 'The cron expression is invalid.');
  assert.equal(error.message, 'Request failed with status code 400: The cron expression is invalid.');
  assert.equal(toApiError(new Error('Network Error'), 'u').status, 0);
});

function loadNodes(t, api) {
  setActivePinia(createPinia());
  const errors = errorRecorder();
  const templateLoads = [];
  const module = loadSource('src/stores/nodesStore.ts', {
    mocks: {
      ...errors.mock,
      '@/composables/api/nodeApi': { useNodeApi: () => api },
      './templatesStore': { useTemplatesStore: () => ({ load: async () => { templateLoads.push(1); } }) },
    },
  });
  t.after(module.dispose);
  return { store: module.useNodesStore(), errors, templateLoads };
}

test('saving a node reloads the nodes and the templates; a failed save changes nothing', async t => {
  let nodeLoads = 0;
  let fail = false;
  const { store, errors, templateLoads } = loadNodes(t, {
    getNodes: async () => { nodeLoads++; return [{ id: 'n1', name: 'Node' }]; },
    getOnlineNodes: async () => [{ id: 'elsa', nodeType: 3, nodeBaseUrl: 'http://elsa', name: 'Elsa' }],
    saveNodeConfiguration: async () => { if (fail) throw new Error('400'); return 'n1'; },
  });

  assert.equal(await store.saveConfiguration({ id: 'n1' }), true);
  assert.deepEqual(plain(store.nodes), [{ id: 'n1', name: 'Node' }]);
  assert.equal(store.workflowNode.nodeBaseUrl, 'http://elsa');
  assert.equal(templateLoads.length, 1);

  fail = true;
  assert.equal(await store.saveConfiguration({ id: 'n1' }), false);
  assert.equal(nodeLoads, 1);
  assert.equal(templateLoads.length, 1);
  assert.equal(store.error, '400');
  assert.equal(errors.reported.length, 1);
});

test('the node editor helpers fall back to empty answers', async t => {
  const { store } = loadNodes(t, {
    getDeviceTemplates: async () => null,
    getNodeDevicesStatus: async () => { throw new Error('offline'); },
    checkPlugin: async plugin => ({ ...plugin, name: 'plugin.zip' }),
    validateCron: async cron => ({ ...cron, isValid: true }),
  });

  assert.deepEqual(plain(await store.getDeviceTemplates('n1')), []);
  assert.deepEqual(plain(await store.getDeviceStatuses('n1')), []);
  assert.equal((await store.checkPlugin('http://x/plugin.zip')).name, 'plugin.zip');
  assert.equal((await store.validateCron('0 0 * ? * * *')).expression, '0 0 * ? * * *');
});

function loadVariables(t, httpCalls) {
  setActivePinia(createPinia());
  const module = loadSource('src/stores/variablesStore.ts', {
    mocks: {
      './templatesStore': { useTemplatesStore: () => ({ load: async () => {} }) },
      '@/stores/orchestratorStore': { useOrchestratorStore: () => ({ baseUrl: 'https://api.example' }) },
      '@/composables/httpClientService': {
        useHttpClient: () => ({
          async get(url) { httpCalls.push(['get', url]); return [{ id: 'var-1', name: 'Variable', description: 'd', isPersistant: true, value: false }]; },
          async post(url, data) { httpCalls.push(['post', url, data]); return null; },
          async delete(url) { httpCalls.push(['delete', url]); return null; },
        }),
      },
    },
  });
  t.after(module.dispose);
  return module.useVariablesStore();
}

test('a dashboard command sets a variable through the existing endpoints and keeps its metadata', async t => {
  const calls = [];
  const store = loadVariables(t, calls);

  assert.equal(await store.setValue({ id: 'var-1', value: true }), true);
  assert.deepEqual(calls[0], ['get', 'https://api.example/api/nodes/variables']);
  assert.equal(calls[1][1], 'https://api.example/api/nodes/variable/save');
  assert.deepEqual(plain(calls[1][2]), { id: 'var-1', name: 'Variable', description: 'd', isPersistant: true, value: true });
  assert.equal(await store.setValue({ id: 'missing', value: 1 }), false);
});

test('variables follow their reports, and delete uses the v2 route', async t => {
  const calls = [];
  const store = loadVariables(t, calls);
  await store.load();

  store.applyReport({ id: 'var-1', value: true, timeStamp: 1 });
  store.applyReport({ id: 'other', value: 5, timeStamp: 1 });
  assert.equal(store.variables[0].value, true);

  assert.equal(await store.remove('var 1'), true);
  assert.ok(calls.some(c => c[0] === 'delete' && c[1] === 'https://api.example/api/v2/variables/var%201'));
});

test('a dashboard control sets a variable for a variable template and commands a device otherwise', async t => {
  setActivePinia(createPinia());
  const sent = [];
  const module = loadSource('src/stores/commandsStore.ts', {
    mocks: {
      '@/composables/api/commandApi': { useCommandApi: () => ({ sendCommand: async command => { sent.push(['device', command]); return { correlationId: 'c', status: 'executed', isFinal: true }; } }) },
      './variablesStore': { useVariablesStore: () => ({ setValue: async command => { sent.push(['variable', command]); return true; } }) },
    },
  });
  t.after(module.dispose);
  const commands = module.useCommandsStore();

  assert.equal(await commands.send({ id: 'v', address: 'Variable' }, 3), true);
  assert.equal(await commands.send({ id: 'light', address: '1' }, true), true);
  assert.deepEqual(plain(sent), [['variable', { id: 'v', value: 3 }], ['device', { id: 'light', value: true }]]);
});

test('the dashboard editors list variables with the report and command templates', async t => {
  setActivePinia(createPinia());
  const module = loadSource('src/stores/templatesStore.ts', {
    mocks: {
      '@/composables/api/templateApi': {
        useTemplateApi: () => ({
          getReportTemplates: async () => [{ id: 'r' }],
          getCommandTemplates: async () => [{ id: 'c' }],
          getVariableTemplates: async () => null,
        }),
      },
    },
  });
  t.after(module.dispose);
  const store = module.useTemplatesStore();
  await store.load();
  assert.deepEqual(plain(store.writableTemplates), [{ id: 'c' }]);

  store.variableTemplates = [{ id: 'v' }];
  assert.deepEqual(plain(store.readableTemplates), [{ id: 'r' }, { id: 'v' }]);
  assert.deepEqual(plain(store.writableTemplates), [{ id: 'c' }, { id: 'v' }]);
});

test('the plans store lists plans and forecasts, and an ended plan leaves the active list', async t => {
  setActivePinia(createPinia());
  const errors = errorRecorder();
  const asked = [];
  const api = {
    getPlans: async active => { asked.push(active); return [{ id: 'p1', status: 'active' }, { id: 'p2', status: 'active' }]; },
    getForecasts: async () => [{ id: 'prices', points: 48 }],
    cancelPlan: async id => (id === 'p1' ? { id: 'p1', status: 'cancelled' } : null),
  };
  const module = loadSource('src/stores/plansStore.ts', { mocks: { ...errors.mock, '@/composables/api/planApi': { usePlanApi: () => api } } });
  t.after(module.dispose);
  const store = module.usePlansStore();

  await store.load();
  assert.deepEqual(asked, [true], 'active plans by default');
  assert.equal(store.plans.length, 2);
  assert.equal(store.forecasts[0].id, 'prices');

  assert.equal(await store.cancel('p1'), true);
  assert.deepEqual(plain(store.plans.map(x => x.id)), ['p2']);
  assert.equal(await store.cancel('p2'), false, 'no answer is no change');
  assert.equal(store.plans.length, 1);

  store.activeOnly = false;
  await store.load();
  assert.equal(await store.cancel('p1'), true);
  assert.equal(store.plans.find(x => x.id === 'p1').status, 'cancelled', 'with every plan listed, the ended plan stays');
  assert.equal(errors.reported.length, 0);
});
