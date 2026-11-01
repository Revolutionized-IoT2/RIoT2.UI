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

function loadApp(t) {
  const published = [];
  const subscribed = [];
  let connected;
  const app = loadSource('src/App.vue', {
    expose: ['mqttMessageReceived'],
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
      './stores/orchestratorStore': { useOrchestratorStore: () => ({}) },
      './stores/errorStore': { useErrorStore: () => ({ setError: error => { throw new Error(error.text); } }) },
      './stores/templatesStore': { useTemplatesStore: () => ({ load() {} }) },
      './stores/dashboardStore': { useDashboardStore: () => ({ applyReport() {} }) },
      './stores/variablesStore': { useVariablesStore: () => ({ applyReport() {} }) },
    },
  });
  t.after(app.dispose);
  return { app, published, subscribed, connect: () => connected() };
}

test('the UI announces itself on every connection and when the orchestrator restarts', t => {
  const { app, published, subscribed, connect } = loadApp(t);
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
