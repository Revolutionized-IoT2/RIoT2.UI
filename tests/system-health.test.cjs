// The system health page and the connection banner (I46): the connection state the banner shows, the helpers
// of the System page, and how the HTTP client records whether the orchestrator's API answers.
const test = require('node:test');
const assert = require('node:assert/strict');
const realAxios = require('axios');
const { AxiosError } = realAxios;
const { loadSource } = require('./source-loader.cjs');

const state = () => ({ mqttConnected: false, mqttDownSince: null, mqttEverConnected: false, apiReachable: true, apiDownSince: null, apiError: null, apiLastSeen: null });

test('the banner waits for the first connection and for the grace period', () => {
  const c = loadSource('src/composables/connectionState.ts');
  const s = state();

  c.setMqttConnected(false, 1000, s);
  assert.equal(c.bannerText(s, 60000), null, 'still connecting: App.vue shows "Connecting..."');

  c.setMqttConnected(true, 2000, s);
  c.setMqttConnected(false, 10000, s);
  c.setMqttConnected(false, 12000, s);
  assert.equal(s.mqttDownSince, 10000, 'a repeated state keeps the time it began');
  assert.equal(c.bannerText(s, 10000 + c.bannerGraceMs - 1), null);
  assert.match(c.bannerText(s, 10000 + 30000), /realtime connection was lost 30 s ago/);

  c.setMqttConnected(true, 50000, s);
  assert.equal(c.bannerText(s, 60000), null);
});

test('the banner shows an API that stopped answering, with the error', () => {
  const c = loadSource('src/composables/connectionState.ts');
  const s = state();

  c.apiResult(false, 'Network Error', 1000, s);
  c.apiResult(false, 'timeout of 5000ms exceeded', 3000, s);
  assert.equal(s.apiDownSince, 1000);
  assert.match(c.bannerText(s, 181000), /API doesn't answer \(3 min\): timeout of 5000ms exceeded/);

  c.apiResult(true, null, 182000, s);
  assert.equal(c.bannerText(s, 190000), null);
  assert.equal(s.apiLastSeen, 182000);
  assert.deepEqual([0, 502, 503, 504, 404, 500].map(c.isUnreachable), [true, true, true, true, false, false]);
});

test('the HTTP client records every answer as reachable and no answer as unreachable', async () => {
  const results = [];
  const responses = [];
  const axios = {
    isAxiosError: realAxios.isAxiosError,
    get: async () => {
      const next = responses.shift();
      if (next instanceof Error)
        throw next;
      return { data: next };
    },
  };
  const { useHttpClient } = loadSource('src/composables/httpClientService.ts', {
    mocks: {
      axios: { __esModule: true, default: axios },
      '@/composables/connectionState': {
        isUnreachable: status => status === 0 || status === 502 || status === 503 || status === 504,
        apiResult: (reachable, error) => results.push([reachable, error ?? null]),
      },
    },
  });
  const client = useHttpClient();
  const http = (status, data) => new AxiosError('Request failed with status code ' + status, 'ERR', {}, {}, { status, data, headers: {}, config: {}, statusText: '' });

  responses.push({ ok: true }, http(404, 'Not found'), new AxiosError('Network Error'), http(503, ''));
  assert.deepEqual(await client.get('/a'), { ok: true });
  await assert.rejects(client.get('/b'));
  await assert.rejects(client.get('/c'));
  await assert.rejects(client.get('/d'));

  assert.deepEqual(results.map(r => r[0]), [true, true, false, false]);
  assert.equal(results[2][1], 'Network Error');
});

const look = () => loadSource('src/composables/systemHealthLook.ts');

const node = (overrides = {}) => ({
  id: 'n', name: 'Garage', nodeType: 1, configured: true, isOnline: true, since: null, history: [], devices: [], devicesUnavailable: false, ...overrides,
});

test('durations read naturally', () => {
  const { formatDuration } = look();
  assert.deepEqual([45e3, 12 * 60e3, 3 * 3600e3, 3 * 3600e3 + 5 * 60e3, 2 * 86400e3 + 4 * 3600e3].map(formatDuration),
    ['45 s', '12 min', '3 h', '3 h 5 min', '2 d 4 h']);
});

test('presence says for how long, or that the node was not seen', () => {
  const { presenceLook } = look();
  const started = '2026-11-03T08:00:00Z';
  const now = Date.parse('2026-11-03T09:00:00Z');

  assert.deepEqual(JSON.parse(JSON.stringify(presenceLook(node({ isOnline: false }), started, now))).detail, ['Not seen since the orchestrator started']);
  assert.match(presenceLook(node(), started, now).detail[0], /before the orchestrator started \(1 h ago\)/);
  const flapping = node({
    since: '2026-11-03T08:50:00Z',
    history: [{ at: '2026-11-03T08:01:00Z', isOnline: true }, { at: '2026-11-03T08:40:00Z', isOnline: false }, { at: '2026-11-03T08:50:00Z', isOnline: true }],
  });
  assert.deepEqual(JSON.parse(JSON.stringify(presenceLook(flapping, started, now).detail)), ['For 10 min', '3 changes since the orchestrator started']);
});

test('nodes that need attention are counted', () => {
  const { needsAttention, healthSummary, deviceLook, nodeSyncLook } = look();
  const failing = node({ id: 'a', devices: [{ id: 'hue', state: 4, message: 'Bridge unreachable' }, { id: 't', state: 3 }] });
  const offline = node({ id: 'b', isOnline: false });
  const connector = node({ id: 'c', nodeType: 4, configured: false, devices: null });

  assert.deepEqual([failing, offline, connector, node({ syncState: 'failed' })].map(needsAttention), [true, true, false, true]);
  assert.deepEqual(JSON.parse(JSON.stringify(healthSummary({ nodes: [failing, offline, connector] }))), { online: 2, nodes: 3, deviceErrors: 1, attention: 2 });
  assert.equal(deviceLook({ id: 'x', state: null }).label, 'no answer');
  assert.equal(deviceLook({ id: 'x', state: 4, message: 'm' }).color, 'red');
  assert.equal(nodeSyncLook(connector), null);
  assert.equal(nodeSyncLook(node({ syncState: 'inSync' })).label, 'in sync');
});

test('the System store polls quietly: a failure keeps the last report', async () => {
  const { createPinia, setActivePinia } = require('pinia');
  setActivePinia(createPinia());
  let fail = false;
  const { useSystemStore } = loadSource('src/stores/systemStore.ts', {
    mocks: {
      '@/composables/api/systemApi': {
        useSystemApi: () => ({
          getHealth: async () => { if (fail) throw new Error('Network Error'); return { nodes: [] }; },
          ping: async () => { throw new Error('Network Error'); },
        }),
      },
    },
  });
  const store = useSystemStore();

  await store.load();
  fail = true;
  await store.load();
  await store.ping();

  assert.deepEqual(JSON.parse(JSON.stringify(store.health)), { nodes: [] });
  assert.equal(store.error, 'Network Error');
  assert.equal(store.loading, false);
});
