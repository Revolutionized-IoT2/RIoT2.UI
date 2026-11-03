import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const fs = cjs('node:fs');
const path = cjs('node:path');
const vue = cjs('vue');
const { compile, baseParse } = cjs('@vue/compiler-dom');
const { loadSource } = cjs('./source-loader.cjs');

const { ValueType } = loadSource('src/models/enums.ts');

const plain = value => JSON.parse(JSON.stringify(value));

test('report history switch writes both true and false to the saved model', () => {
  const source = fs.readFileSync(path.join(testsDirectory, '..', 'src/components/ReportTemplateEditor.vue'), 'utf8');
  const template = source.slice(source.indexOf('<template>') + 10, source.lastIndexOf('</template>'));
  function findSwitch(node) {
    if (node.tag === 'v-switch') return node;
    for (const child of node.children ?? []) { const found = findSwitch(child); if (found) return found; }
  }
  const control = findSwitch(baseParse(template));
  const { code } = compile(control.loc.source, { mode: 'function' });
  const render = new Function('Vue', code)({ ...vue, resolveComponent: name => name });
  const model = { maintainHistory: false };
  const vnode = render({ model }, []);
  const update = vnode.props['onUpdate:modelValue'];
  assert.equal(typeof update, 'function');
  update(true);
  assert.equal(plain(model).maintainHistory, true);
  update(false);
  assert.equal(plain(model).maintainHistory, false);
});

test('datamodel classifies arrays before generic objects', t => {
  const widget = loadSource('src/components/DatamodelComponent.vue', { expose: ['getValueType'] });
  t.after(widget.dispose);
  assert.equal(widget.state.getValueType(['a', 'b']), ValueType.TextArray);
  assert.equal(widget.state.getValueType({ a: 1 }), ValueType.Entity);
});

function mqttFixture(t) {
  const handlers = {};
  const errors = [];
  const client = {
    connected: false, ends: 0, options: {}, forced: false,
    on(event, handler) { handlers[event] = handler; },
    end(force, callback) { this.ends++; this.forced = force; callback?.(); },
  };
  const module = loadSource('src/composables/mqttService.ts', { mocks: {
    mqtt: { __esModule: true, default: { connect: (_, options) => { client.options = options; return client; } } },
    '@/app.config': { mqttServer: 'unused.invalid', mqttUser: '', mqttPassword: '' },
    '@/stores/errorStore': { useErrorStore: () => ({ setError: error => errors.push(error) }) },
  } });
  t.after(module.dispose);
  const service = module.useMqtt('test-client');
  service.connect(() => {});
  return { service, client, handlers, errors };
}

test('MQTT resets its backoff after each successful connection', t => {
  const { service, client, handlers } = mqttFixture(t);
  for (let outage = 0; outage < 10; outage++) {
    handlers.reconnect();
    client.connected = true;
    handlers.connect();
    assert.equal(client.options.reconnectPeriod, 4000);
    assert.equal(service.status.value, true);
    handlers.close();
    assert.equal(service.status.value, false);
  }
  assert.equal(client.ends, 0);
});

test('MQTT keeps retrying with a capped backoff until explicitly disconnected', t => {
  const { service, client, handlers, errors } = mqttFixture(t);
  assert.equal(client.options.reconnectPeriod, 4000);
  handlers.reconnect();
  assert.equal(client.options.reconnectPeriod, 8000);
  handlers.reconnect();
  assert.equal(client.options.reconnectPeriod, 16000);
  for (let retry = 0; retry < 100; retry++) handlers.reconnect();
  assert.equal(client.options.reconnectPeriod, 30000);
  assert.equal(client.ends, 0);
  assert.equal(service.status.value, false);
  assert.equal(errors.length, 0);
  client.connected = true;
  handlers.connect();
  assert.equal(service.status.value, true);
  assert.equal(client.options.reconnectPeriod, 4000);
  client.connected = false;
  handlers.close();
  service.disConnect();
  assert.equal(client.ends, 1);
  assert.equal(client.forced, true);
  handlers.connect();
  handlers.reconnect();
  assert.equal(service.status.value, false);
  assert.equal(client.options.reconnectPeriod, 4000);
});
