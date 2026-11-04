import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const assert = cjs('node:assert/strict');
const { loadSource } = cjs('./source-loader.cjs');

// "Connect to <provider>" (Core 2.4.0): the device's sign-in through the orchestrator's callback page.
const source = loadSource('src/composables/deviceAuthorization.ts');
const { apiOrigin, callbackUri, webLink, authorizationLook, readAuthorizationMessage, startErrorMessage,
  takeDeviceAuthorizations, useDeviceAuthorization, authorizationMessageType } = source;
const plain = value => JSON.parse(JSON.stringify(value));
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

test('the redirect URI is the API origin\'s callback page: the page\'s own origin behind the /api proxy', () => {
  assert.equal(apiOrigin('', 'https://ui.example'), 'https://ui.example');
  assert.equal(apiOrigin(null, 'https://ui.example'), 'https://ui.example');
  assert.equal(apiOrigin('http://orchestrator:5000', 'https://ui.example'), 'http://orchestrator:5000');
  assert.equal(apiOrigin('http://orchestrator:5000/', 'https://ui.example'), 'http://orchestrator:5000');
  assert.equal(apiOrigin('javascript:alert(1)', 'https://ui.example'), 'https://ui.example');
  assert.equal(callbackUri('http://orchestrator:5000'), 'http://orchestrator:5000/api/oauth/callback');
});

test('only http and https links are followed', () => {
  assert.equal(webLink('https://dev.netatmo.com/apps'), 'https://dev.netatmo.com/apps');
  assert.equal(webLink('javascript:alert(1)'), null);
  assert.equal(webLink('data:text/html,x'), null);
  assert.equal(webLink('not a url'), null);
  assert.equal(webLink(''), null);
  assert.equal(webLink(null), null);
});

test('the status chip says how the device is signed in', () => {
  assert.equal(authorizationLook(false, { state: 2, account: 'me@example.com' }).text, 'Save the device first');
  assert.equal(authorizationLook(true, { state: 2, account: 'me@example.com' }).text, 'Connected as me@example.com');
  assert.equal(authorizationLook(true, { state: 2 }).text, 'Connected');
  assert.equal(authorizationLook(true, { state: 2 }).color, 'success');
  assert.equal(authorizationLook(true, { state: 1 }).text, 'Not connected');
  assert.equal(authorizationLook(true, { state: 3, message: 'Token revoked' }).text, 'Expired: Token revoked');
  assert.equal(authorizationLook(true, { state: 3 }).text, 'Expired');
  assert.equal(authorizationLook(true, { state: 0 }).text, 'Not configured');
  assert.equal(authorizationLook(true, { state: 0, message: 'Set the client id' }).text, 'Not configured: Set the client id');
  assert.equal(authorizationLook(true, null).text, 'Status unknown');
});

test('only the callback page\'s message for this node and device, from the API origin, is read', () => {
  const data = { type: authorizationMessageType, nodeId: 'node-1', deviceId: 'netatmo', success: true, message: null };
  const read = (event) => readAuthorizationMessage(event, 'http://orchestrator:5000', 'node-1', 'netatmo');
  assert.deepEqual(plain(read({ origin: 'http://orchestrator:5000', data })), { success: true, message: 'Connected.' });
  assert.equal(read({ origin: 'https://evil.example', data }), null);
  assert.equal(read({ origin: 'http://orchestrator:5000', data: { ...data, type: 'other' } }), null);
  assert.equal(read({ origin: 'http://orchestrator:5000', data: { ...data, deviceId: 'other' } }), null);
  assert.equal(read({ origin: 'http://orchestrator:5000', data: { ...data, nodeId: 'other' } }), null);
  assert.equal(read({ origin: 'http://orchestrator:5000', data: 'riot2-device-authorization' }), null);
  assert.deepEqual(plain(read({ origin: 'http://orchestrator:5000', data: { ...data, success: false, message: 'access_denied' } })),
    { success: false, message: 'access_denied' });
  assert.deepEqual(plain(read({ origin: 'http://orchestrator:5000', data: { ...data, success: 'true' } })),
    { success: false, message: 'The sign-in failed.' });
});

test('a refused start shows the node\'s reason', () => {
  assert.equal(startErrorMessage({ status: 409, detail: 'Set the client id and secret first.' }, 'Netatmo'), 'Set the client id and secret first.');
  assert.match(startErrorMessage({ status: 409, detail: null }, 'Netatmo'), /ready to connect to Netatmo/);
  assert.match(startErrorMessage({ status: 404, detail: null }, 'Netatmo'), /isn't running this device/);
  assert.match(startErrorMessage({ status: 429 }, 'Netatmo'), /Too many sign-ins/);
  assert.equal(startErrorMessage({ status: 502, detail: 'timeout' }, 'Netatmo'), 'The node didn\'t answer: timeout');
  assert.match(startErrorMessage({ status: 403 }, 'Netatmo'), /administrator/);
  assert.equal(startErrorMessage({ status: 0, detail: null, message: 'Network Error' }, 'Netatmo'), 'Network Error');
});

test('template authorization descriptors move into the map, so devices added from a template are saved without them', () => {
  const map = {};
  const templates = [
    { classFullName: 'Plugins.Netatmo', authorization: { provider: 'Netatmo', setupUrl: 'https://dev.netatmo.com' } },
    { classFullName: 'Plugins.Plain', authorization: null },
  ];
  takeDeviceAuthorizations(templates, map);
  assert.deepEqual(plain(Object.keys(map)), ['Plugins.Netatmo']);
  assert.equal(map['Plugins.Netatmo'].provider, 'Netatmo');
  assert.ok(templates.every(t => !('authorization' in t)));
});

test('the start request goes to the orchestrator with the node and device ids escaped', async () => {
  const calls = [];
  const { useNodeApi } = loadSource('src/composables/api/nodeApi.ts', {
    mocks: {
      '@/composables/httpClientService': { useHttpClient: () => ({ post: async (url, data) => { calls.push({ url, data }); return { authorizeUrl: 'https://p' }; } }) },
      '@/stores/orchestratorStore': { useOrchestratorStore: () => ({ baseUrl: 'http://orchestrator:5000' }) },
    },
  });
  const result = await useNodeApi().startDeviceAuthorization('node 1', 'net/atmo', { redirectUri: 'r', origin: 'o' });
  assert.deepEqual(plain(calls), [{ url: 'http://orchestrator:5000/api/nodes/node%201/devices/net%2Fatmo/authorization', data: { redirectUri: 'r', origin: 'o' } }]);
  assert.equal(result.authorizeUrl, 'https://p');
});

// A browser stand-in: the popup, the message listeners and the timers, run by hand.
function fakeEnvironment({ blocked = false } = {}) {
  const popup = { closed: false, location: { href: 'about:blank' }, close() { this.closed = true; } };
  const listeners = new Set();
  const timers = new Set();
  const opened = [];
  function timer(kind, milliseconds, callback) {
    const entry = { kind, milliseconds, callback };
    timers.add(entry);
    return () => timers.delete(entry);
  }
  return {
    popup, listeners, timers, opened,
    environment: {
      pageOrigin: 'https://ui.example',
      openPopup() { opened.push(true); return blocked ? null : popup; },
      listen(handler) { listeners.add(handler); return () => listeners.delete(handler); },
      every: (ms, callback) => timer('every', ms, callback),
      after: (ms, callback) => timer('after', ms, callback),
    },
    post(event) { for (const listener of [...listeners]) listener({ source: popup, ...event }); },
    tick(kind) { for (const entry of [...timers]) if (entry.kind === kind) entry.callback(); },
    find(kind, ms) { return [...timers].find(t => t.kind === kind && t.milliseconds === ms); },
  };
}

function setup(fake, { start, baseUrl = 'http://orchestrator:5000' } = {}) {
  const calls = { start: [], refresh: 0 };
  const authorization = useDeviceAuthorization({
    nodeId: () => 'node-1',
    deviceId: () => 'netatmo',
    provider: () => 'Netatmo',
    apiBaseUrl: () => baseUrl,
    start: async (nodeId, deviceId, request) => {
      calls.start.push({ nodeId, deviceId, request: plain(request), popupOpened: fake.opened.length });
      return start ? start() : 'https://api.netatmo.com/oauth2/authorize?state=x';
    },
    refresh: async () => { calls.refresh++; },
    environment: fake.environment,
  });
  return { authorization, calls };
}

test('connect opens the window first, starts the sign-in, then sends the window to the provider', async () => {
  const fake = fakeEnvironment();
  const { authorization, calls } = setup(fake);
  assert.equal(authorization.redirectUri.value, 'http://orchestrator:5000/api/oauth/callback');

  await authorization.connect();

  assert.deepEqual(calls.start, [{ nodeId: 'node-1', deviceId: 'netatmo', popupOpened: 1,
    request: { redirectUri: 'http://orchestrator:5000/api/oauth/callback', origin: 'https://ui.example' } }]);
  assert.equal(fake.popup.location.href, 'https://api.netatmo.com/oauth2/authorize?state=x');
  assert.equal(authorization.connecting.value, true);
  assert.ok(fake.find('every', 3000), 'polls every 3 s');
  assert.ok(fake.find('after', 5 * 60 * 1000), 'gives up after 5 minutes');

  fake.tick('every');
  assert.equal(calls.refresh, 1);

  // A message from another origin or about another device changes nothing.
  fake.post({ origin: 'https://evil.example', data: { type: authorizationMessageType, nodeId: 'node-1', deviceId: 'netatmo', success: true } });
  fake.post({ origin: 'http://orchestrator:5000', data: { type: authorizationMessageType, nodeId: 'node-1', deviceId: 'other', success: true } });
  fake.post({ origin: 'http://orchestrator:5000', source: {}, data: { type: authorizationMessageType, nodeId: 'node-1', deviceId: 'netatmo', success: true } });
  assert.equal(authorization.connecting.value, true);
  assert.equal(authorization.result.value, null);

  fake.post({ origin: 'http://orchestrator:5000', data: { type: authorizationMessageType, nodeId: 'node-1', deviceId: 'netatmo', success: true, message: 'Connected as me@example.com' } });
  await flush();
  assert.deepEqual(plain(authorization.result.value), { success: true, message: 'Connected as me@example.com' });
  assert.equal(authorization.connecting.value, false);
  assert.equal(calls.refresh, 2, 'refreshes the statuses at once');
  assert.equal(fake.listeners.size, 0);
  assert.equal(fake.find('every', 3000), undefined, 'stops polling');
  fake.tick('after');
  assert.equal(calls.refresh, 3, 'and once more after the node restarted the device');
});

test('the poll stops when the window closes', async () => {
  const fake = fakeEnvironment();
  const { authorization, calls } = setup(fake);
  await authorization.connect();
  fake.popup.closed = true;
  fake.tick('every');
  assert.equal(calls.refresh, 1, 'a last refresh');
  assert.equal(authorization.connecting.value, false);
  assert.equal(fake.timers.size, 0);
  assert.equal(fake.listeners.size, 0);
});

test('the poll stops after the timeout', async () => {
  const fake = fakeEnvironment();
  const { authorization } = setup(fake);
  await authorization.connect();
  fake.find('after', 5 * 60 * 1000).callback();
  assert.equal(authorization.connecting.value, false);
  assert.equal(fake.timers.size, 0);
});

test('a refused start closes the window and shows the node\'s message', async () => {
  const fake = fakeEnvironment();
  const { authorization } = setup(fake, { start: () => { throw { status: 409, detail: 'Set the client id and secret first.' }; } });
  await authorization.connect();
  assert.equal(fake.popup.closed, true);
  assert.deepEqual(plain(authorization.result.value), { success: false, message: 'Set the client id and secret first.' });
  assert.equal(authorization.connecting.value, false);
  assert.equal(fake.listeners.size, 0);
});

test('a sign-in address that isn\'t http or https is never opened', async () => {
  const fake = fakeEnvironment();
  const { authorization } = setup(fake, { start: () => 'javascript:alert(1)' });
  await authorization.connect();
  assert.equal(fake.popup.location.href, 'about:blank');
  assert.equal(fake.popup.closed, true);
  assert.equal(authorization.result.value.success, false);
});

test('a blocked window is reported without starting the sign-in', async () => {
  const fake = fakeEnvironment({ blocked: true });
  const { authorization, calls } = setup(fake);
  await authorization.connect();
  assert.equal(calls.start.length, 0);
  assert.match(authorization.result.value.message, /blocked/);
});

test('behind the /api proxy the messages come from the page\'s own origin', async () => {
  const fake = fakeEnvironment();
  const { authorization } = setup(fake, { baseUrl: '' });
  assert.equal(authorization.redirectUri.value, 'https://ui.example/api/oauth/callback');
  await authorization.connect();
  fake.post({ origin: 'https://ui.example', data: { type: authorizationMessageType, nodeId: 'node-1', deviceId: 'netatmo', success: false, message: 'access_denied' } });
  assert.deepEqual(plain(authorization.result.value), { success: false, message: 'access_denied' });
});

test('stop removes the listener and the timers (the editor closed)', async () => {
  const fake = fakeEnvironment();
  const { authorization } = setup(fake);
  await authorization.connect();
  authorization.stop();
  assert.equal(fake.listeners.size, 0);
  assert.equal(fake.timers.size, 0);
  assert.equal(authorization.connecting.value, false);
});
