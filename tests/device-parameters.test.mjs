import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const vue = cjs('vue');
const { loadSource } = cjs('./source-loader.cjs');

// Typed device parameters (I30): the node's parameterDefinitions drive the editors; without them, free text.
const { DeviceParameterType } = loadSource('src/models/enums.ts');
const { parameterFields, takeParameterDefinitions, parameterError } = loadSource('src/composables/deviceParameters.ts');
const plain = value => JSON.parse(JSON.stringify(value));
const definition = (key, type = DeviceParameterType.text, extra = {}) => ({ key, type, required: false, secret: false, ...extra });

test('defined parameters come first in the plugin order, keeping the stored spelling, then the rest', () => {
  const fields = parameterFields({ extra: '1', smtp_server: 'mail', smtp_Port: '25' },
    [definition('smtp_Server'), definition('smtp_Port', DeviceParameterType.integer), definition('smtp_Password')]);
  assert.deepEqual(plain(fields.map(f => [f.key, f.definition?.key ?? null])), [
    ['smtp_server', 'smtp_Server'], ['smtp_Port', 'smtp_Port'], ['smtp_Password', 'smtp_Password'], ['extra', null]]);
  assert.deepEqual(plain(parameterFields(null, null)), []);
  assert.deepEqual(plain(parameterFields({ a: 'b' }, undefined).map(f => f.definition)), [null]);
});

test('template definitions move into the map, so devices added from a template are saved without them', () => {
  const map = {};
  const templates = [
    { classFullName: 'Plugins.Mail', parameterDefinitions: [definition('smtp_Server')] },
    { classFullName: 'Plugins.Plain', parameterDefinitions: null },
  ];
  takeParameterDefinitions(templates, map);
  assert.deepEqual(plain(Object.keys(map)), ['Plugins.Mail']);
  assert.equal(map['Plugins.Mail'][0].key, 'smtp_Server');
  assert.ok(templates.every(t => !('parameterDefinitions' in t)));
});

test('values are checked as the node binds them', () => {
  const port = definition('port', DeviceParameterType.integer, { required: true });
  assert.equal(parameterError(port, ''), 'Required');
  assert.equal(parameterError({ ...port, default: '21' }, ' '), null, 'a default fills an empty value');
  assert.equal(parameterError(port, '2.5'), 'A whole number');
  assert.equal(parameterError(port, ' 21 '), null);
  assert.equal(parameterError(definition('t', DeviceParameterType.number), '1,5'), 'A number, with a dot for decimals');
  assert.equal(parameterError(definition('t', DeviceParameterType.number), '-1.5e3'), null);
  assert.equal(parameterError(definition('b', DeviceParameterType.boolean), 'TRUE'), null);
  assert.equal(parameterError(definition('b', DeviceParameterType.boolean), 'yes'), 'true or false');
  assert.equal(parameterError(null, 'anything'), null);
});

test('a secret is masked until revealed, numbers get a number input, and a switch shows the default', async t => {
  const secret = loadSource('src/components/devices/DeviceParameterField.vue', {
    props: { name: 'password', definition: definition('password', DeviceParameterType.text, { secret: true, required: true }) },
    model: vue.ref('hunter2'), expose: ['label', 'inputType', 'revealed'] });
  t.after(secret.dispose);
  assert.equal(secret.state.label.value, 'password *');
  assert.equal(secret.state.inputType.value, 'password');
  secret.state.revealed.value = true;
  assert.equal(secret.state.inputType.value, 'text');

  const port = loadSource('src/components/devices/DeviceParameterField.vue', {
    props: { name: 'port', definition: definition('port', DeviceParameterType.integer) },
    model: vue.ref('x'), expose: ['inputType', 'error'] });
  t.after(port.dispose);
  assert.equal(port.state.inputType.value, 'number');
  assert.equal(port.state.error.value, 'A whole number');

  const model = vue.ref(undefined);
  const flag = loadSource('src/components/devices/DeviceParameterField.vue', {
    props: { name: 'useSsl', definition: definition('useSsl', DeviceParameterType.boolean, { default: 'true' }) },
    model, expose: ['flag'] });
  t.after(flag.dispose);
  assert.equal(flag.state.flag.value, true);
  flag.state.flag.value = false;
  assert.equal(model.value, 'false');

  const free = loadSource('src/components/devices/DeviceParameterField.vue', {
    props: { name: 'custom', definition: null }, model: vue.ref('v'), expose: ['label', 'inputType', 'error'] });
  t.after(free.dispose);
  assert.deepEqual([free.state.label.value, free.state.inputType.value, free.state.error.value], ['custom', 'text', null]);
});

test('the parameter form uses the definitions of the device class and writes edits into deviceParameters', t => {
  const definitions = vue.ref({ 'Plugins.Mail': [definition('smtp_Server', DeviceParameterType.text, { required: true })] });
  const model = vue.ref({ id: 'd', name: 'Mail', classFullName: 'Plugins.Mail', deviceParameters: null, refreshSchedule: '' });
  const form = loadSource('src/components/devices/DeviceParametersForm.vue', {
    model, expose: ['fields', 'setParameter'],
    mocks: {
      vue: { ...vue, inject: () => definitions, onMounted() {} },
      '@/stores/nodesStore': { useNodesStore: () => ({ validateCron: async () => null }) },
    } });
  t.after(form.dispose);
  assert.deepEqual(plain(form.state.fields.value.map(f => f.key)), ['smtp_Server'], 'a defined parameter shows before it has a value');
  form.state.setParameter('smtp_Server', 'mail.example.com');
  assert.deepEqual(plain(model.value.deviceParameters), { smtp_Server: 'mail.example.com' });

  model.value.classFullName = 'Plugins.Other';
  assert.deepEqual(plain(form.state.fields.value.map(f => [f.key, f.definition])), [['smtp_Server', null]], 'another class falls back to free text');
});

test('the reused node editor never applies another node\'s definitions, even from a late response', async t => {
  const pending = {};
  const nodes = { getDeviceTemplates: id => new Promise(resolve => { pending[id] = resolve; }) };
  const open = vue.ref(false);
  const configuration = vue.ref({ id: '', name: '', deviceConfigurations: [] });
  const dialog = loadSource('src/components/nodes/NodeEditorDialog.vue', {
    models: { open, configuration }, expose: ['parameterDefinitions'],
    mocks: {
      vue: { ...vue, provide() {}, onMounted() {} },
      '@/stores/nodesStore': { useNodesStore: () => nodes },
    } });
  t.after(dialog.dispose);
  const { parameterDefinitions } = dialog.state;
  const templates = () => [{ classFullName: 'Plugins.Mail', parameterDefinitions: [definition('smtp_Server')] }];

  configuration.value = { id: 'A', name: 'A', deviceConfigurations: [] };
  open.value = true;
  await vue.nextTick();
  pending.A(templates());
  await new Promise(setImmediate);
  assert.deepEqual(plain(Object.keys(parameterDefinitions.value)), ['Plugins.Mail']);

  configuration.value = { id: 'B', name: 'B', deviceConfigurations: [] };
  await vue.nextTick();
  assert.deepEqual(plain(parameterDefinitions.value), {}, 'node B starts with free text');
  pending.B([]);
  await new Promise(setImmediate);
  assert.deepEqual(plain(parameterDefinitions.value), {}, 'an offline node keeps free text');

  configuration.value = { id: 'C', name: 'C', deviceConfigurations: [] };
  await vue.nextTick();
  configuration.value = { id: 'D', name: 'D', deviceConfigurations: [] };
  await vue.nextTick();
  pending.C(templates());
  await new Promise(setImmediate);
  assert.deepEqual(plain(parameterDefinitions.value), {}, 'a response for a node no longer edited is ignored');
});
