const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vue = require('vue');
const { compile, baseParse } = require('@vue/compiler-dom');
const { loadSource } = require('./source-loader.cjs');

const { ValueType, ChartType } = loadSource('src/models/enums.ts');
const { ComponentElement } = loadSource('src/models/componentElement.ts');
const report = value => ({ id: 'report', value, timeStamp: 1700000000 });
const element = (type, values, properties = {}) => new ComponentElement({
  id: 'element', name: 'Reading', properties, numberOfPreviousReports: 4,
  reportTemplate: { type }, previousReports: values.map(report),
});
const plain = value => JSON.parse(JSON.stringify(value));

test('numeric entity histories use the configured property for current and previous values', async t => {
  const props = vue.reactive({ data: { elements: [element(ValueType.Entity,
    [{ temperature: 21, precision: 1, unit: 'C' }, { temperature: 20.5, precision: 1, unit: 'C' }],
    { value: '{temperature}', digits: '{precision}', unit: '{unit}' })] } });
  const widget = loadSource('src/components/dashboardComponents/NumericValueComponent.vue',
    { props, expose: ['numValue'] });
  t.after(widget.dispose);
  assert.equal(widget.state.numValue.value.value, '21.0');
  assert.equal(widget.state.numValue.value.prevValue, '20.5');
  props.data.elements = [element(ValueType.Number, [5, 4], { digits: 2 })];
  await vue.nextTick();
  assert.equal(widget.state.numValue.value.prevValue, '4.00');
});

test('numeric missing or nonnumeric history remains a placeholder rather than throwing', async t => {
  const props = vue.reactive({ data: { elements: [element(ValueType.Entity,
    [{ temperature: 3 }, {}], { value: '{temperature}' })] } });
  const widget = loadSource('src/components/dashboardComponents/NumericValueComponent.vue',
    { props, expose: ['numValue'] });
  t.after(widget.dispose);
  assert.equal(widget.state.numValue.value.prevValue, '-');
  props.data.elements = [element(ValueType.Number, [8], { digits: 200 })];
  await vue.nextTick();
  assert.equal(widget.state.numValue.value.prevValue, '-');
  assert.equal(widget.state.numValue.value.value.length, 102);
});

test('charts render existing history immediately, replace history, and handle empty elements', async t => {
  const props = vue.reactive({ type: ChartType.line, data: { elements: [element(ValueType.Number, [3, 2])] } });
  const chart = loadSource('src/components/dashboardComponents/ChartComponent.vue',
    { props, expose: ['chartdata'] });
  t.after(chart.dispose);
  assert.deepEqual(plain(chart.state.chartdata.value.datasets[0].data), [2, 3]);
  assert.equal(chart.state.chartdata.value.labels.length, 2);
  props.data.elements[0].previousReports = [report(7), report(6)];
  await vue.nextTick();
  assert.deepEqual(plain(chart.state.chartdata.value.datasets[0].data), [6, 7]);
  props.data.elements = [element(ValueType.Number, [10, 9])];
  await vue.nextTick();
  assert.deepEqual(plain(chart.state.chartdata.value.datasets[0].data), [9, 10]);
  props.data.elements[0].report = report(11);
  await vue.nextTick();
  assert.deepEqual(plain(chart.state.chartdata.value.datasets[0].data), [9, 10, 11]);
  props.data.elements = [];
  await vue.nextTick();
  assert.deepEqual(plain(chart.state.chartdata.value.datasets), []);
});

test('page and component IDs stay unique and stable after delete/add/edit and JSON round trip', t => {
  const screen = loadSource('src/views/DashboardView.vue', { expose: [
    'dashboardConfiguration', 'selectedPage', 'editPage', 'editComponent',
    'savePage', 'deletePage', 'saveComponent', 'deleteComponent',
  ] });
  t.after(screen.dispose);
  const s = screen.state;
  s.dashboardConfiguration.value = {
    pages: ['1', '2', '3'].map(id => ({ id, name: id, components: [] })),
  };
  s.selectedPage.value = 1;
  s.deletePage();
  s.editPage.value = { id: '', name: 'new', components: [] };
  s.savePage();
  const pages = s.dashboardConfiguration.value.pages;
  assert.equal(new Set(pages.map(p => p.id)).size, 3);
  const pageId = pages[2].id;
  s.editPage.value = { id: pageId, name: 'edited', components: [] };
  s.savePage();
  assert.equal(pages[1].name, '3');
  assert.equal(pages[2].id, pageId);
  assert.equal(pages[2].name, 'edited');
  pages[2].components = ['1', '2', '3'].map(id => ({ id, name: id, elements: [] }));
  s.deleteComponent({ id: '2' });
  s.editComponent.value = { id: '', name: 'new', elements: [] };
  s.saveComponent();
  const components = pages[2].components;
  assert.equal(new Set(components.map(c => c.id)).size, 3);
  const componentId = components[2].id;
  s.editComponent.value = { ...components[2], name: 'edited' };
  s.saveComponent();
  assert.equal(components[1].name, '3');
  assert.equal(components[2].id, componentId);
  assert.equal(plain(s.dashboardConfiguration.value).pages[2].components[2].id, componentId);
});

test('element IDs stay unique after delete/add and target the correct item on edit/delete', t => {
  const props = vue.reactive({ data: { elements: ['1', '2', '3'].map(id => ({ id, name: id })) } });
  const editor = loadSource('src/components/dashboardComponents/EditModeComponent.vue',
    { props, expose: ['selectedEditElement', 'saveElement', 'deleteElement'] });
  t.after(editor.dispose);
  const s = editor.state;
  s.selectedEditElement.value = { id: '2' };
  s.deleteElement();
  s.selectedEditElement.value = { id: '', name: 'new' };
  s.saveElement();
  assert.equal(new Set(props.data.elements.map(e => e.id)).size, 3);
  const id = props.data.elements[2].id;
  s.selectedEditElement.value = { id, name: 'edited' };
  s.saveElement();
  assert.equal(props.data.elements[1].name, '3');
  assert.equal(props.data.elements[2].name, 'edited');
  assert.equal(plain(props.data).elements[2].id, id);
  s.deleteElement();
  assert.deepEqual(props.data.elements.map(e => e.id), ['1', '3']);
});

test('report history switch writes both true and false to the saved model', () => {
  const source = fs.readFileSync(path.join(__dirname, '..', 'src/components/ReportTemplateEditor.vue'), 'utf8');
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

function mqttFixture(t) {
  const handlers = {};
  const errors = [];
  const client = {
    connected: false, ends: 0, options: {}, forced: false,
    on(event, handler) { handlers[event] = handler; },
    end(force, callback) { this.ends++; this.forced = force; callback?.(); },
  };
  const module = loadSource('src/composables/mqttService.ts', { mocks: {
    'mqtt/dist/mqtt.min': { default: { connect: (_, options) => { client.options = options; return client; } } },
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
