// The integrated workflow designer (ADR 0016): Elsa's definition model as Vue Flow nodes and edges and back, the RIoT
// selector's literal (as Elsa Studio wrote it, so existing workflows keep working) and the designer's warnings.
import { test } from './support/node-test.mjs';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// CommonJS, like tests/source-loader.cjs: the code under test and the test share one Vue and one Pinia.
const cjs = createRequire(import.meta.url);
const testsDirectory = dirname(fileURLToPath(import.meta.url));
const assert = cjs('node:assert/strict');
const { loadSource } = cjs('./source-loader.cjs');

const plain = value => JSON.parse(JSON.stringify(value));
const selectorInput = { key: 'report', displayName: 'Report', typeName: 'RIoT2.RIoTTemplateItem', uiHint: 'riot-output-selector', options: { 'riot-output-selector': { templateTypes: ['Report'], hideEditor: true } } };
const catalog = {
  activities: [
    { type: 'RIoT2.RIoTReportTrigger', version: 1, displayName: 'Report trigger', kind: 'Trigger', outcomes: ['Done'], inputs: [selectorInput] },
    { type: 'Elsa.FlowSwitch', version: 1, displayName: 'Switch', kind: 'Action', outcomes: ['Default'], inputs: [] },
    { type: 'RIoT2.RIoTRunLlm', version: 1, displayName: 'Run LLM', kind: 'Action', outcomes: ['Done', 'Failed'], inputs: [{ key: 'connection', typeName: 'String' }] }
  ]
};
const model = {
  id: 'w1', definitionId: 'd1', name: 'Old', description: '', version: 1, isPublished: false,
  root: {
    id: 'flowchart', type: 'Elsa.Flowchart', version: 1, unknownProperty: 'kept',
    activities: [
      { id: 'trigger', type: 'RIoT2.RIoTReportTrigger', version: 1, customProperties: { canStartWorkflow: true }, report: { typeName: 'RIoT2.RIoTTemplateItem', expression: { type: 'Literal', value: '{"Id":"r1"}' } }, metadata: { designer: { position: { x: 10, y: 20 } }, custom: 1 } },
      { id: 'switch', type: 'Elsa.FlowSwitch', version: 1, cases: [{ label: 'High' }, { label: 'Low' }, { label: 'High' }] }
    ],
    connections: [{ source: { activity: 'trigger', port: 'Done' }, target: { activity: 'switch', port: 'In' }, vertices: [] }]
  }
};

test('a model becomes nodes and edges and back, keeping what the designer does not know', t => {
  const module = loadSource('src/composables/workflowGraph.ts');
  t.after(module.dispose);
  const { modelToFlow, flowToModel } = module;

  const { nodes, edges } = modelToFlow(catalog, model);
  assert.deepEqual(plain(nodes.map(x => [x.id, x.position])), [['trigger', { x: 10, y: 20 }], ['switch', { x: 360, y: 120 }]]);
  assert.deepEqual(plain(nodes[1].data.outcomes), ['High', 'Low', 'Default']);
  assert.deepEqual(plain(edges.map(x => [x.source, x.sourceHandle, x.target, x.targetHandle])), [['trigger', 'Done', 'switch', 'In']]);

  nodes[1].position = { x: 400.6, y: 99.4 };
  const saved = plain(flowToModel(model, nodes, edges, 'New', 'Described'));
  assert.equal(saved.name, 'New');
  assert.equal(saved.description, 'Described');
  assert.equal(saved.root.unknownProperty, 'kept');
  assert.equal(saved.root.activities[0].metadata.custom, 1);
  assert.deepEqual(saved.root.activities[1].metadata.designer.position, { x: 401, y: 99 });
  assert.deepEqual(saved.root.activities[0].report, model.root.activities[0].report);
  assert.deepEqual(saved.root.connections, model.root.connections);
});

test('new activities get readable ids unlike the others, and triggers start the workflow', t => {
  const module = loadSource('src/composables/workflowGraph.ts');
  t.after(module.dispose);
  const { createActivity, nextActivityId, sanitizeId } = module;

  assert.equal(sanitizeId('Run LLM'), 'runLLM');
  assert.equal(sanitizeId('***'), 'activity');
  assert.equal(nextActivityId('Run LLM', ['runLLM', 'runLLM2']), 'runLLM3');
  const trigger = plain(createActivity(catalog.activities[0], { x: 5, y: 6 }, ['reportTrigger']));
  assert.equal(trigger.id, 'reportTrigger2');
  assert.deepEqual(trigger.customProperties, { canStartWorkflow: true });
  assert.deepEqual(trigger.metadata.designer.position, { x: 5, y: 6 });
  assert.deepEqual(plain(createActivity(catalog.activities[2], { x: 0, y: 0 }, []).customProperties), {});
});

test('inputs are set as expressions, and an empty value clears them', t => {
  const module = loadSource('src/composables/workflowGraph.ts');
  t.after(module.dispose);
  const { withInput, inputValue, inputText, inputLanguage, splitList } = module;
  const input = { key: 'connection', typeName: 'String', defaultValue: 'none' };

  const set = withInput({ id: 'a' }, input, 'Literal', 'openai');
  assert.deepEqual(plain(inputValue(set, 'connection')), { typeName: 'String', expression: { type: 'Literal', value: 'openai' } });
  assert.equal(inputText(set, input), 'openai');
  assert.equal(inputText({ id: 'a' }, input), 'none');
  assert.equal(inputLanguage({ id: 'a' }, { key: 'x', defaultSyntax: 'JavaScript' }), 'JavaScript');
  assert.equal(withInput(set, input, 'Literal', '').connection, null);
  assert.deepEqual(plain(splitList('a, b\nc;a')), ['a', 'b', 'c']);
});

test('the RIoT selector reads and writes the literal as Studio did', t => {
  const module = loadSource('src/composables/workflowGraph.ts');
  t.after(module.dispose);
  const { parseSelection, selectionText, selectorSettings, defaultCommandScript } = module;

  const text = '{"Id":"c1","Name":"Lamp","Type":0,"Node":"n1","Device":"d1","Value":null,"Model":true,"TemplateType":1}';
  assert.equal(selectionText(parseSelection(text)), text);
  assert.equal(parseSelection('not json'), null);
  assert.equal(parseSelection(' '), null);
  assert.deepEqual(plain(selectorSettings(selectorInput)), { types: [2], hideEditor: true });
  assert.deepEqual(plain(selectorSettings({ key: 'x' })), { types: [2, 1, 3], hideEditor: false });

  assert.equal(defaultCommandScript('Living room lamp', 0, true), 'let livingRoomLamp = true;\nreturn livingRoomLamp;');
  assert.equal(defaultCommandScript('Text', 1, "it's"), "let text = 'it\\'s';\nreturn text;");
  assert.equal(defaultCommandScript('Level', 2, null), 'let level = 0;\nreturn level;');
  assert.equal(defaultCommandScript('Object', 3, { a: 1 }), 'let object = {"a":1};\nreturn object;');
});

test('the designer warns about what stops a workflow from working', t => {
  const module = loadSource('src/composables/workflowGraph.ts');
  t.after(module.dispose);
  const { modelToFlow, validateFlow, createActivity, nodeOf } = module;

  const { nodes, edges } = modelToFlow(catalog, model);
  assert.deepEqual(plain(validateFlow(nodes, edges)), []);

  const llm = nodeOf(catalog, createActivity(catalog.activities[2], { x: 0, y: 0 }, []), { x: 0, y: 0 });
  const unknown = nodeOf(catalog, { id: 'old', type: 'Gone.Activity' }, { x: 0, y: 0 });
  nodes[0].data.activity = { ...nodes[0].data.activity, customProperties: {}, report: { typeName: 'RIoT2.RIoTTemplateItem', expression: { type: 'Literal', value: '' } } };
  assert.deepEqual(plain(validateFlow([...nodes, llm, unknown], edges)), [
    'trigger doesn\'t start the workflow: switch "Starts the workflow" on.',
    'trigger: choose the Report.',
    'runLLM: choose a model connection.',
    'runLLM is not connected: nothing leads to it.',
    'old is an unknown activity (Gone.Activity).'
  ]);
  assert.deepEqual(plain(validateFlow([], [])), ['Add a trigger: nothing starts this workflow.']);
});
