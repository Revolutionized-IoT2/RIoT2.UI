// The UI's presence (I24, backlog item 21 and divergence D3), and the helpers split out of the
// nodes view.
const test = require('node:test');
const assert = require('node:assert/strict');
const { loadSource } = require('./source-loader.cjs');

const plain = value => JSON.parse(JSON.stringify(value));

test('the presence and the last will are camelCase', () => {
  const { presenceMessage, offlineMessage } = loadSource('src/composables/presence.ts');

  assert.deepEqual(JSON.parse(presenceMessage('Dashboard')), { isOnline: true, name: 'Dashboard', nodeType: 2 });
  assert.deepEqual(JSON.parse(offlineMessage), { isOnline: false });
});

test('only a live orchestrator online message asks for a new announcement', () => {
  const { orchestratorCameOnline } = loadSource('src/composables/presence.ts');

  assert.equal(orchestratorCameOnline('{"isOnline":true}', false), true);
  assert.equal(orchestratorCameOnline('{"isOnline":true}', true), false, 'retained: the connect announcement covered it');
  assert.equal(orchestratorCameOnline('{"isOnline":false}', false), false);
  assert.equal(orchestratorCameOnline('not json', false), false);
});

async function loadApp(t, securityInfo = null) {
  const published = [];
  const subscribed = [];
  const store = {};
  let connected;
  const app = loadSource('src/App.vue', {
    expose: ['mqttMessageReceived', 'configureDashboardTopic'],
    mocks: {
      vue: { ...require('vue'), onMounted: callback => callback(), onUnmounted() {} },
      uuid: { v4: () => 'ui-test' },
      '@/composables/mqttService': {
        useMqtt: () => ({
          connect(_, onConnected) { connected = onConnected; },
          subscribe: topic => subscribed.push(topic),
          sendMessage: (topic, message) => published.push([topic, JSON.parse(message)]),
          disConnect() {},
        }),
      },
      '@/composables/api/securityApi': { useSecurityApi: () => ({ getInfo: async () => securityInfo }) },
      './stores/orchestratorStore': { useOrchestratorStore: () => store },
      './stores/errorStore': { useErrorStore: () => ({ setError: error => { throw new Error(error.text); } }) },
      './stores/templatesStore': { useTemplatesStore: () => ({ load() {} }) },
      './stores/dashboardStore': { useDashboardStore: () => ({ applyReport() {} }) },
      './stores/variablesStore': { useVariablesStore: () => ({ applyReport() {} }) },
    },
  });
  t.after(app.dispose);
  // onMounted reads /api/security/info first.
  await new Promise(resolve => setImmediate(resolve));
  return { app, store, published, subscribed, connect: () => connected() };
}

test('the UI announces itself on every connection and when the orchestrator restarts', async t => {
  const { app, published, subscribed, connect } = await loadApp(t);
  const presence = ['riot2/node/ui-test/online', { isOnline: true, name: 'Dashboard', nodeType: 2 }];
  assert.ok(subscribed.includes('riot2/orchestrator/online'));
  assert.deepEqual(published, [], 'nothing before the broker accepts the connection');

  connect();
  connect();
  assert.deepEqual(plain(published), [presence, presence]);

  app.state.mqttMessageReceived('riot2/orchestrator/online', '{"isOnline":true}', true);
  assert.equal(published.length, 2);
  app.state.mqttMessageReceived('riot2/orchestrator/online', '{"isOnline":false}', false);
  assert.equal(published.length, 2);
  app.state.mqttMessageReceived('riot2/orchestrator/online', '{"isOnline":true}', false);
  assert.deepEqual(plain(published[2]), presence);
});

test('MQTT runs the connected callback after every connection and passes the retain flag', t => {
  const handlers = {};
  const client = { connected: true, options: {}, on(event, handler) { handlers[event] = handler; }, end() {} };
  const module = loadSource('src/composables/mqttService.ts', { mocks: {
    'mqtt/dist/mqtt.min': { default: { connect: (_, options) => { client.options = options; return client; } } },
    '@/app.config': { mqttServer: 'unused.invalid', mqttUser: '', mqttPassword: '' },
    '@/stores/errorStore': { useErrorStore: () => ({ setError() {} }) },
  } });
  t.after(module.dispose);
  const messages = [];
  let connections = 0;

  module.useMqtt('ui').connect((topic, message, retained) => messages.push([topic, message, retained]), () => connections++);
  handlers.connect();
  handlers.reconnect();
  handlers.connect();
  handlers.message('riot2/orchestrator/online', Buffer.from('{"isOnline":true}'), { retain: true });

  assert.equal(connections, 2);
  assert.deepEqual(messages, [['riot2/orchestrator/online', '{"isOnline":true}', true]]);
  assert.equal(client.options.will.payload, '{"isOnline":false}');
});

test('a node shows the state of its first device that is not running', () => {
  const { nodeStateLook, deviceStateLook } = loadSource('src/composables/deviceState.ts');
  const { DeviceState } = loadSource('src/models/enums.ts');
  const node = (...states) => ({ deviceStatuses: states.map(state => ({ state })) });

  assert.deepEqual(plain(nodeStateLook(node())), { color: 'yellow', icon: 'help' });
  assert.deepEqual(plain(nodeStateLook(node(DeviceState.running, DeviceState.running))), { color: 'green', icon: 'check_circle' });
  assert.deepEqual(plain(nodeStateLook(node(DeviceState.running, DeviceState.error, DeviceState.stopped))), { color: 'red', icon: 'error' });
  assert.deepEqual(plain(deviceStateLook(DeviceState.stopped)), { color: 'blue', icon: 'cancel' });
});

test('loading templates adds only those whose address the device lacks', () => {
  const { mergeDeviceTemplates, blankDevice } = loadSource('src/composables/deviceTemplates.ts');
  const device = { reportTemplates: [{ id: 'kept', address: 'a', name: 'Mine' }], commandTemplates: null };

  mergeDeviceTemplates(device, {
    reportTemplates: [{ id: 'x', address: 'a', name: 'Theirs' }, { id: 'y', address: 'b' }],
    commandTemplates: [{ id: 'z', address: 'c' }],
  });
  mergeDeviceTemplates(device, null);

  assert.deepEqual(plain(device.reportTemplates.map(t => t.id)), ['kept', 'y']);
  assert.equal(device.reportTemplates[0].name, 'Mine');
  assert.deepEqual(plain(device.commandTemplates.map(t => t.id)), ['z']);
  assert.equal(blankDevice().classFullName, 'RIoT2.Net.Devices.NEWDEVICE');
});

test('without the /api proxy the UI calls the API at the URL in the configuration command', async t => {
  const { app, store } = await loadApp(t);

  app.state.mqttMessageReceived(app.state.configureDashboardTopic, '{"apiBaseUrl":"http://orchestrator.lan:8080"}');

  assert.equal(store.sameOrigin, false);
  assert.equal(store.baseUrl, 'http://orchestrator.lan:8080');
  assert.equal(store.configured, true);
});

test('behind the /api proxy the UI calls the API on its own origin', async t => {
  const { app, store, subscribed } = await loadApp(t, { mode: 'off', features: [], loginRequired: false, realtime: 'mqtt' });
  assert.ok(subscribed.includes('riot2/orchestrator/online'), 'mqtt is the realtime transport');

  app.state.mqttMessageReceived(app.state.configureDashboardTopic, '{"apiBaseUrl":"http://orchestrator.lan:8080"}');

  assert.equal(store.sameOrigin, true);
  assert.equal(store.baseUrl, '');
  assert.equal(store.configured, true);
});

test('the security description is read defensively', async () => {
  const { parseSecurityInfo, loadSecurityState, offSecurityInfo } = loadSource('src/composables/securityInfo.ts');

  assert.equal(parseSecurityInfo('<!doctype html><html></html>'), null, 'nginx without the proxy answers with the UI page');
  assert.equal(parseSecurityInfo({ status: 'ok' }), null);
  assert.deepEqual(plain(parseSecurityInfo({ mode: 'off', realtime: 'mqtt', features: ['api', 3] })),
    { mode: 'off', features: ['api'], loginRequired: false, realtime: 'mqtt' });
  assert.deepEqual(plain(await loadSecurityState(async () => { throw new Error('404'); })), { info: plain(offSecurityInfo), sameOrigin: false });
  assert.equal((await loadSecurityState(async () => ({ mode: 'off', realtime: 'mqtt' }))).sameOrigin, true);
});

test('the realtime transport is MQTT unless the orchestrator asks for the gateway', () => {
  const errors = [];
  const { createRealtimeTransport } = loadSource('src/composables/realtime.ts', { mocks: {
    '@/composables/mqttService': { useMqtt: id => ({ kind: 'mqtt', id }) },
    '@/stores/errorStore': { useErrorStore: () => ({ setError: error => errors.push(error.text) }) },
  } });

  assert.equal(createRealtimeTransport('mqtt', 'ui').kind, 'mqtt');
  assert.equal(createRealtimeTransport(null, 'ui').kind, 'mqtt');
  const gateway = createRealtimeTransport('gateway', 'ui');
  gateway.connect(() => {});
  assert.equal(gateway.status.value, false);
  assert.equal(errors.length, 1);
});
