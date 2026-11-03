// Connectors in the UI (I39; design 7.3 phase 3): how a connector's health is shown, and the nodes store
// polling GET /api/v2/connectors quietly.
import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const { createPinia, setActivePinia } = cjs('pinia');
const { loadSource } = cjs('./source-loader.cjs');

const plain = value => JSON.parse(JSON.stringify(value));
const health = (status, extra = {}) => ({
  status, mqtt: true, sink: true, queue: 0,
  spool: { enabled: true, messages: 0, bytes: 0, maxBytes: 100 * 1024 * 1024 }, ...extra
});

test('a connector shows ok, degraded, unhealthy, unreachable or online without a URL', t => {
  const module = loadSource('src/composables/statusLook.ts');
  t.after(module.dispose);
  const { connectorLook, spoolLine } = module;
  const url = 'http://influxdb-connector:8080';

  const ok = connectorLook({ id: 'c', name: 'InfluxDB', nodeBaseUrl: url, health: health('ok') });
  assert.deepEqual([ok.label, ok.color, plain(ok.detail)], ['ok', 'green', []]);

  const spooling = { id: 'c', name: 'InfluxDB', nodeBaseUrl: url, health: health('degraded', { sink: false, spool: { enabled: true, messages: 12, bytes: 3 * 1024 * 1024, maxBytes: 100 * 1024 * 1024 } }) };
  const degraded = connectorLook(spooling);
  assert.deepEqual([degraded.label, degraded.color], ['degraded', 'orange']);
  assert.deepEqual(plain(degraded.detail), ["The connector's target doesn't answer.", '12 message(s) wait in the spool (3.0 MB of 100.0 MB)']);
  assert.equal(spoolLine(spooling), '12 message(s) wait in the spool (3.0 MB of 100.0 MB)');

  const unhealthy = connectorLook({ id: 'c', name: 'c', nodeBaseUrl: url, health: health('unhealthy', { mqtt: false }) });
  assert.deepEqual([unhealthy.label, unhealthy.color, plain(unhealthy.detail)], ['unhealthy', 'red', ['Not connected to MQTT.']]);

  const unreachable = connectorLook({ id: 'c', name: 'c', nodeBaseUrl: url, health: null, healthError: 'No answer within 5 s' });
  assert.deepEqual([unreachable.label, unreachable.detail[0]], ['unreachable', 'No answer within 5 s']);

  const noUrl = connectorLook({ id: 'c', name: 'c', nodeBaseUrl: null });
  assert.deepEqual([noUrl.label, noUrl.color], ['online', 'green']);
  assert.equal(spoolLine({ id: 'c', name: 'c', health: health('ok', { spool: { enabled: false, messages: 0, bytes: 0, maxBytes: 0 } }) }), null);
});

test('polling the connectors keeps the last list when the orchestrator fails', async t => {
  setActivePinia(createPinia());
  const reported = [];
  let answer = [{ id: 'influx', name: 'InfluxDB', nodeBaseUrl: null }];
  let fail = false;
  const module = loadSource('src/stores/nodesStore.ts', {
    mocks: {
      './errorStore': { useErrorStore: () => ({ report: error => reported.push(error) }) },
      '@/composables/api/nodeApi': { useNodeApi: () => ({ getConnectors: async () => { if (fail) throw new Error('404'); return answer; } }) },
      './templatesStore': { useTemplatesStore: () => ({ load: async () => {} }) },
    },
  });
  t.after(module.dispose);
  const store = module.useNodesStore();

  await store.loadConnectors();
  assert.deepEqual(store.connectors.map(c => c.id), ['influx']);

  fail = true;
  await store.loadConnectors();
  assert.deepEqual(store.connectors.map(c => c.id), ['influx'], 'an orchestrator before 1.17.0 answers 404; the list stays');
  assert.equal(reported.length, 0, 'and no snackbar is shown');
  assert.equal(store.loading, false);

  fail = false;
  answer = null;
  await store.loadConnectors();
  assert.deepEqual(plain(store.connectors), []);
});
