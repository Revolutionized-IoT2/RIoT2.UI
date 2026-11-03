// Sync and command status in the UI (I36; design 7.1 phase 4 and 7.2 phase 6): how a node's sync and a
// command's delivery are shown, the commands store following a delivery until it is final, and the
// nodes store polling the sync state and re-applying a configuration.
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

test('a node shows applying, in sync, failed, offline, restarting or legacy', t => {
  const module = loadSource('src/composables/statusLook.ts');
  t.after(module.dispose);
  const { syncLook } = module;
  const plugin = { name: 'Devices plugin', version: '1.6.0', coreVersion: '1.17.0' };

  const applying = syncLook({ id: 'n', isOnline: true, syncState: 'pending', configurationState: 'applying', desiredRevision: 2, appliedRevision: 1 });
  assert.deepEqual([applying.label, applying.color], ['applying', 'blue']);
  assert.deepEqual(plain(applying.detail), ['Revision 1 of 2']);

  const inSync = syncLook({ id: 'n', isOnline: true, syncState: 'inSync', desiredRevision: 2, appliedRevision: 2, pluginManifest: plugin });
  assert.deepEqual([inSync.label, inSync.color], ['in sync', 'green']);
  assert.deepEqual(plain(inSync.detail), ['Revision 2 of 2', 'Plugin Devices plugin 1.6.0, RIoT2.Core 1.17.0']);

  const devices = syncLook({ id: 'n', isOnline: true, syncState: 'inSync', failedDevices: [{ id: 'plc', message: 'unreachable' }] });
  assert.equal(devices.color, 'orange');
  assert.ok(devices.detail.includes('plc: unreachable'));

  const failed = syncLook({ id: 'n', isOnline: true, syncState: 'failed', lastError: 'HTTP 404' });
  assert.deepEqual([failed.label, failed.color, failed.detail[0]], ['failed', 'red', 'HTTP 404']);

  assert.equal(syncLook({ id: 'n', isOnline: false, syncState: 'pending' }).label, 'offline');
  assert.equal(syncLook({ id: 'n', isOnline: true, syncState: 'pending', configurationState: 'pendingRestart' }).label, 'restarting');
  assert.equal(syncLook({ id: 'n', isOnline: true, syncState: 'legacy' }).label, 'legacy');
  assert.equal(syncLook({ id: 'n', isOnline: true }).label, 'unknown', 'an orchestrator before 1.5.0 reports no sync state');
});

test('a command shows sending, done, sent or why it failed', t => {
  const module = loadSource('src/composables/statusLook.ts');
  t.after(module.dispose);
  const { commandLook, isCommandFailure } = module;
  const delivery = (status, extra = {}) => ({ correlationId: 'c', nodeId: 'n', status, isFinal: status != 'pending', attempts: 0, ...extra });

  assert.equal(commandLook(delivery('pending')).label, 'sending');
  assert.equal(commandLook(delivery('executed')).color, 'green');
  assert.equal(commandLook(delivery('duplicate')).label, 'done');
  assert.equal(commandLook(delivery('sent')).label, 'sent');
  const failed = commandLook(delivery('failed', { error: 'Port COM3 not found' }));
  assert.deepEqual([failed.label, failed.color, plain(failed.detail)], ['failed', 'red', ['Port COM3 not found']]);
  assert.equal(commandLook(delivery('expired')).label, 'expired');
  assert.equal(commandLook(delivery('unknownCommand')).label, 'unknown command');
  assert.deepEqual(['failed', 'unknownCommand', 'expired', 'executed', 'sent', 'pending'].map(isCommandFailure), [true, true, true, false, false, false]);
});

function loadCommands(t, api) {
  setActivePinia(createPinia());
  const reported = [];
  const shown = [];
  const module = loadSource('src/stores/commandsStore.ts', {
    mocks: {
      './errorStore': { useErrorStore: () => ({ report: error => reported.push(error), setError: error => shown.push(error) }) },
      '@/composables/api/commandApi': { useCommandApi: () => api },
      './variablesStore': { useVariablesStore: () => ({}) },
    },
  });
  t.after(module.dispose);
  return { store: module.useCommandsStore(), reported, shown };
}

test('a command is followed from pending to failed, and the failure reaches the snackbar', async t => {
  const expires = new Date(Date.now() + 30000).toISOString();
  const answers = [
    { correlationId: 'c1', commandId: 'lamp', nodeId: 'n', status: 'pending', isFinal: false, attempts: 1, expires },
    { correlationId: 'c1', commandId: 'lamp', nodeId: 'n', status: 'failed', isFinal: true, attempts: 1, error: 'Port COM3 not found', expires },
  ];
  const asked = [];
  const { store, shown } = loadCommands(t, {
    sendCommand: async command => ({ correlationId: 'c1', commandId: command.id, nodeId: 'n', status: 'pending', isFinal: false, attempts: 0, expires }),
    getDelivery: async id => { asked.push(id); return answers.shift(); },
  });

  assert.equal(await store.execute({ id: 'lamp', value: true }), true);
  assert.equal(store.deliveries.lamp.status, 'pending');
  await store.settled('lamp');

  assert.deepEqual(asked, ['c1', 'c1']);
  assert.equal(store.deliveries.lamp.status, 'failed');
  assert.equal(shown.length, 1);
  assert.equal(shown[0].text, 'Command lamp failed');
  assert.equal(shown[0].message, 'Port COM3 not found');
});

test('a delivery that is final at once is not asked for, and a refused command is not followed', async t => {
  let asked = 0;
  let refuse = false;
  const { store, shown, reported } = loadCommands(t, {
    sendCommand: async () => { if (refuse) throw new Error('404'); return { correlationId: 'c', nodeId: 'n', status: 'sent', isFinal: true, attempts: 0, expires: new Date().toISOString() }; },
    getDelivery: async () => { asked++; return null; },
  });

  assert.equal(await store.execute({ id: 'lamp', value: 1 }), true);
  await store.settled('lamp');
  assert.equal(asked, 0);
  assert.equal(store.deliveries.lamp.status, 'sent');
  assert.equal(shown.length, 0);

  refuse = true;
  assert.equal(await store.execute({ id: 'heater', value: 1 }), false);
  assert.equal(store.deliveries.heater, undefined);
  assert.equal(reported.length, 1);
});

test('a newer command for the same control takes over, even while the older one is being asked for', async t => {
  const expires = new Date(Date.now() + 30000).toISOString();
  const pending = id => ({ correlationId: id, commandId: 'switch', nodeId: 'n', status: 'pending', isFinal: false, attempts: 0, expires });
  let sent = 0;
  let releaseA;
  const answers = { b: [{ ...pending('b'), status: 'failed', isFinal: true, error: 'relay stuck' }] };
  let store;
  ({ store } = loadCommands(t, {
    sendCommand: async () => pending(++sent == 1 ? 'a' : 'b'),
    getDelivery: async id => {
      if (id == 'a')
        return new Promise(resolve => { releaseA = () => resolve({ ...pending('a'), status: 'executed', isFinal: true }); });
      return answers.b.shift() ?? pending('b');
    },
  }));

  await store.execute({ id: 'switch', value: true });
  const first = store.settled('switch');
  while (releaseA == null)
    await new Promise(resolve => setTimeout(resolve, 20));
  // A's answer is on its way when B is sent.
  await store.execute({ id: 'switch', value: false });
  releaseA();
  await first;
  assert.equal(store.deliveries.switch.correlationId, 'b', "A's late answer must not replace B");
  await store.settled('switch');
  assert.deepEqual([store.deliveries.switch.correlationId, store.deliveries.switch.status], ['b', 'failed']);
});

test('the outbox summary is loaded for the delivery queue', async t => {
  const { store } = loadCommands(t, {
    getOutboxSummary: async () => ({ counts: { pending: 1, delivered: 3 }, lastErrors: [] }),
  });
  assert.equal(await store.loadOutbox(), true);
  assert.deepEqual(plain(store.outbox.counts), { pending: 1, delivered: 3 });
});

function loadNodes(t, api) {
  setActivePinia(createPinia());
  const reported = [];
  const module = loadSource('src/stores/nodesStore.ts', {
    mocks: {
      './errorStore': { useErrorStore: () => ({ report: error => reported.push(error) }) },
      '@/composables/api/nodeApi': { useNodeApi: () => api },
      './templatesStore': { useTemplatesStore: () => ({ load: async () => {} }) },
    },
  });
  t.after(module.dispose);
  return { store: module.useNodesStore(), reported };
}

test('polling the sync state updates the nodes quietly, and re-apply refreshes it', async t => {
  let sync = [{ id: 'n1', isOnline: true, syncState: 'pending', configurationState: 'applying', desiredRevision: 2, appliedRevision: 1 }];
  let failSync = false;
  const applied = [];
  const { store, reported } = loadNodes(t, {
    getNodes: async () => [{ id: 'n1', name: 'Node', isOnline: true, syncState: 'inSync', desiredRevision: 1, appliedRevision: 1, pluginManifest: { name: 'p' } }],
    getOnlineNodes: async () => [],
    getSync: async () => { if (failSync) throw new Error('offline'); return sync; },
    applyConfiguration: async id => { applied.push(id); if (id == 'gone') throw new Error('409'); return null; },
    getNodeDevicesStatus: async () => [{ id: 'd', state: 3 }],
  });
  await store.load();

  await store.refreshSync();
  assert.deepEqual([store.nodes[0].syncState, store.nodes[0].configurationState, store.nodes[0].appliedRevision], ['pending', 'applying', 1]);
  assert.equal(store.nodes[0].pluginManifest.name, 'p', 'a sync entry without a manifest keeps the one the node list had');
  assert.equal(store.loading, false);

  sync = [{ id: 'n1', isOnline: true, syncState: 'inSync', configurationState: 'applied', desiredRevision: 2, appliedRevision: 2 }];
  failSync = true;
  await store.refreshSync();
  assert.equal(store.nodes[0].syncState, 'pending', 'a failed poll keeps the last state');
  assert.equal(reported.length, 0, 'and shows no snackbar');

  failSync = false;
  store.nodes[0].deviceStatuses = [{ id: 'd', state: 2 }];
  sync = [{ id: 'n1', isOnline: false, syncState: 'pending', desiredRevision: 2, appliedRevision: 1 }];
  await store.refreshSync();
  assert.deepEqual([store.nodes[0].isOnline, plain(store.nodes[0].deviceStatuses)], [false, []], 'an offline node has no known device states');
  sync = [{ id: 'n1', isOnline: true, syncState: 'inSync', configurationState: 'applied', desiredRevision: 2, appliedRevision: 2 }];
  failSync = false;
  assert.equal(await store.reapply('n1'), true);
  assert.deepEqual([store.nodes[0].syncState, store.nodes[0].appliedRevision], ['inSync', 2]);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(plain(store.nodes[0].deviceStatuses), [{ id: 'd', state: 3 }], 'a node back online reports its device states again');
  assert.equal(await store.reapply('gone'), false);
  assert.deepEqual(applied, ['n1', 'gone']);
  assert.equal(reported.length, 1, 'a refused re-apply (offline node) reaches the snackbar');
});
