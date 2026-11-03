import type { JsonObject, JsonValue } from '@/models/generated/contracts';
import { isJsonObject } from '@/composables/jsonValue';
import {
  TemplateType, type RIoTTemplateSelection, type WorkflowActivityDefinition, type WorkflowCatalog, type WorkflowInputDefinition,
  type WorkflowInputValue, type WorkflowModel, type WorkflowPosition
} from '@/models/workflow';

// The designer's view of a workflow (ported from Dls, ADR 0016): Elsa's definition model (root flowchart activities and
// connections) as Vue Flow nodes and edges, and back. Activities stay the model's JSON objects, so inputs, custom
// properties and metadata the designer doesn't know survive a save.

export type ActivityModel = JsonObject;

export interface WorkflowNodeData {
  activity: ActivityModel;
  definition: WorkflowActivityDefinition | null;
  outcomes: string[];
}

export interface WorkflowFlowNode {
  id: string;
  type: 'workflowActivity';
  position: WorkflowPosition;
  data: WorkflowNodeData;
}

export interface WorkflowFlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export const SelectorHint = 'riot-output-selector';
/** The drag data type of an activity dragged from the palette. */
export const ActivityDragType = 'application/x-riot2-workflow-activity';
const nodeSize = { width: 232, height: 64 };

export function text(value: JsonValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

/** The model's root flowchart; one is made when the model has none. */
export function rootOf(model: WorkflowModel): JsonObject {
  return isJsonObject(model.root) ? model.root : { id: 'flowchart', type: 'Elsa.Flowchart', version: 1, activities: [], connections: [] };
}

export function activitiesOf(model: WorkflowModel): ActivityModel[] {
  const activities = rootOf(model).activities;
  return Array.isArray(activities) ? activities.filter(isJsonObject) : [];
}

export function positionOf(activity: ActivityModel, index = 0): WorkflowPosition {
  const position = isJsonObject(activity.metadata) && isJsonObject(activity.metadata.designer) ? activity.metadata.designer.position : undefined;
  if (isJsonObject(position) && typeof position.x === 'number' && typeof position.y === 'number')
    return { x: position.x, y: position.y };
  return { x: 80 + index * 280, y: 120 };
}

export function activityDefinition(catalog: WorkflowCatalog | null, type: string): WorkflowActivityDefinition | null {
  return catalog?.activities.find(x => x.type === type) ?? null;
}

export function isTrigger(definition: WorkflowActivityDefinition | null): boolean {
  return definition?.kind === 'Trigger';
}

/** The outcomes a node has handles for: the catalog's, or those its inputs define (switch cases, fork branches…). */
export function activityOutputs(catalog: WorkflowCatalog | null, activity: ActivityModel): string[] {
  const definition = activityDefinition(catalog, text(activity.type));
  if (!definition)
    return ['Done'];
  if (activity.type === 'Elsa.FlowSwitch') {
    const cases = Array.isArray(activity.cases) ? activity.cases : [];
    return [...new Set([...cases.filter(isJsonObject).map(x => text(x.label)).filter(Boolean), 'Default'])];
  }
  if (activity.type === 'Elsa.FlowFork' || activity.type === 'Elsa.RunJavaScript') {
    const key = activity.type === 'Elsa.FlowFork' ? 'branches' : 'possibleOutcomes';
    const listed = stringList(inputValue(activity, key));
    if (listed.length)
      return listed;
  }
  return definition.outcomes;
}

export function modelToFlow(catalog: WorkflowCatalog | null, model: WorkflowModel): { nodes: WorkflowFlowNode[]; edges: WorkflowFlowEdge[] } {
  const nodes = activitiesOf(model).map((activity, index) => nodeOf(catalog, activity, positionOf(activity, index)));
  const connections = rootOf(model).connections;
  const edges = (Array.isArray(connections) ? connections : []).filter(isJsonObject).flatMap((connection, index) => {
    const source = isJsonObject(connection.source) ? connection.source : {};
    const target = isJsonObject(connection.target) ? connection.target : {};
    if (!text(source.activity) || !text(target.activity))
      return [];
    return [{
      id: `${text(source.activity)}:${text(source.port) || 'Done'}->${text(target.activity)}:${index}`,
      source: text(source.activity),
      target: text(target.activity),
      sourceHandle: text(source.port) || 'Done',
      targetHandle: text(target.port) || 'In'
    }];
  });
  return { nodes, edges };
}

export function nodeOf(catalog: WorkflowCatalog | null, activity: ActivityModel, position: WorkflowPosition): WorkflowFlowNode {
  return {
    id: text(activity.id),
    type: 'workflowActivity',
    position,
    data: { activity, definition: activityDefinition(catalog, text(activity.type)), outcomes: activityOutputs(catalog, activity) }
  };
}

/** The model with the canvas's activities, positions and connections, and the given name and description. */
export function flowToModel(model: WorkflowModel, nodes: WorkflowFlowNode[], edges: WorkflowFlowEdge[], name: string, description: string): WorkflowModel {
  const root = rootOf(model);
  const activities = nodes.map(node => {
    const metadata = isJsonObject(node.data.activity.metadata) ? node.data.activity.metadata : {};
    const designer = isJsonObject(metadata.designer) ? metadata.designer : {};
    return {
      ...node.data.activity,
      id: node.id,
      metadata: { ...metadata, designer: { ...designer, position: { x: Math.round(node.position.x), y: Math.round(node.position.y) }, size: { ...nodeSize } } }
    };
  });
  const connections = edges.map(edge => ({
    source: { activity: edge.source, port: edge.sourceHandle || 'Done' },
    target: { activity: edge.target, port: edge.targetHandle || 'In' },
    vertices: []
  }));
  return { ...model, name, description, root: { ...root, activities, connections } };
}

/** A new activity of the definition at the position, with an id unlike the existing ones. Triggers start the workflow. */
export function createActivity(definition: WorkflowActivityDefinition, position: WorkflowPosition, existingIds: Iterable<string>): ActivityModel {
  const id = nextActivityId(definition.displayName, existingIds);
  return {
    id,
    type: definition.type,
    version: definition.version,
    name: id,
    customProperties: definition.kind === 'Trigger' ? { canStartWorkflow: true } : {},
    metadata: { designer: { position: { x: position.x, y: position.y }, size: { ...nodeSize } } }
  };
}

export function sanitizeId(label: string): string {
  const words = label.replace(/[^A-Za-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  const id = words.map((word, index) => index === 0 ? word.charAt(0).toLowerCase() + word.slice(1) : word.charAt(0).toUpperCase() + word.slice(1)).join('');
  return id || 'activity';
}

export function nextActivityId(label: string, existingIds: Iterable<string>): string {
  const taken = new Set(existingIds);
  const base = sanitizeId(label);
  if (!taken.has(base))
    return base;
  let index = 2;
  while (taken.has(`${base}${index}`))
    index++;
  return `${base}${index}`;
}

// ---------------------------------------------------------------- inputs

export function inputValue(activity: ActivityModel, key: string): WorkflowInputValue | null {
  const value = activity[key];
  if (!isJsonObject(value) || !isJsonObject(value.expression) || typeof value.expression.type !== 'string')
    return null;
  return { typeName: text(value.typeName), expression: { type: value.expression.type, value: value.expression.value ?? null } };
}

export function inputLanguage(activity: ActivityModel, input: WorkflowInputDefinition): string {
  return inputValue(activity, input.key)?.expression.type ?? input.defaultSyntax ?? 'Literal';
}

/** The input's value as text for an editor: the expression, or the definition's default. */
export function inputText(activity: ActivityModel, input: WorkflowInputDefinition): string {
  const value = inputValue(activity, input.key)?.expression.value ?? input.defaultValue ?? '';
  return typeof value === 'string' ? value : JSON.stringify(value);
}

/** The activity with the input set (an empty value clears it). */
export function withInput(activity: ActivityModel, input: WorkflowInputDefinition, language: string, value: JsonValue): ActivityModel {
  const next = { ...activity };
  if (value === '' || value === null || (Array.isArray(value) && value.length === 0))
    next[input.key] = null;
  else
    next[input.key] = { typeName: inputTypeName(input), expression: { type: language, value } };
  return next;
}

// The model names Elsa's simple types by alias (String, Int32…); the catalog does too.
function inputTypeName(input: WorkflowInputDefinition): string {
  return input.typeName || 'Object';
}

export function stringList(input: WorkflowInputValue | null): string[] {
  const value = input?.expression.value;
  if (Array.isArray(value))
    return value.filter((x): x is string => typeof x === 'string');
  if (typeof value === 'string' && value.trim().startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** A comma- or line-separated list, as the Run LLM step's list inputs hold it. */
export function splitList(value: string): string[] {
  return [...new Set(value.split(/[,;\r\n]+/).map(x => x.trim()).filter(Boolean))];
}

// ---------------------------------------------------------------- the RIoT selector

/** The selector's settings from the catalog: the kinds of templates and whether the value editor shows. */
export function selectorSettings(input: WorkflowInputDefinition): { types: TemplateType[]; hideEditor: boolean } {
  const settings = isJsonObject(input.options) ? input.options[SelectorHint] : undefined;
  const names = isJsonObject(settings) && Array.isArray(settings.templateTypes) ? settings.templateTypes : [];
  const types = names.map(x => TemplateType[x as keyof typeof TemplateType]).filter((x): x is TemplateType => typeof x === 'number' && x !== TemplateType.Unknown);
  return {
    types: types.length ? types : [TemplateType.Report, TemplateType.Command, TemplateType.Variable],
    hideEditor: isJsonObject(settings) && settings.hideEditor === true
  };
}

/** The selection stored in the input's literal, or null. */
export function parseSelection(value: string): RIoTTemplateSelection | null {
  if (!value.trim())
    return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const record = parsed as Partial<RIoTTemplateSelection>;
      return {
        Id: record.Id ?? null, Name: record.Name ?? '', Type: record.Type ?? 0, Node: record.Node ?? null, Device: record.Device ?? null,
        Value: record.Value ?? null, Model: record.Model ?? null, TemplateType: record.TemplateType ?? TemplateType.Unknown
      };
    }
  } catch {
    // Not a selection.
  }
  return null;
}

/** The literal a selection is stored as: the keys and their order as Studio wrote them. */
export function selectionText(selection: RIoTTemplateSelection): string {
  const { Id, Name, Type, Node, Device, Value, Model, TemplateType: kind } = selection;
  return JSON.stringify({ Id, Name, Type, Node, Device, Value, Model, TemplateType: kind });
}

/** A command's starting JavaScript: its default value, returned (as Studio's selector wrote it). */
export function defaultCommandScript(name: string, valueType: number, model: JsonValue): string {
  const variable = sanitizeId(name);
  const value = model ?? [false, '', 0, {}, []][valueType] ?? null;
  const literal = valueType === 1 ? `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
    : typeof value === 'object' ? JSON.stringify(value) : String(value).toLowerCase();
  return `let ${variable} = ${literal};\nreturn ${variable};`;
}

// ---------------------------------------------------------------- checks

/** What would stop the workflow from working, for the designer's warnings. */
export function validateFlow(nodes: WorkflowFlowNode[], edges: WorkflowFlowEdge[]): string[] {
  const messages: string[] = [];
  const triggers = nodes.filter(node => isTrigger(node.data.definition));
  if (!triggers.length)
    messages.push('Add a trigger: nothing starts this workflow.');
  for (const trigger of triggers) {
    const custom = isJsonObject(trigger.data.activity.customProperties) ? trigger.data.activity.customProperties : {};
    if (custom.canStartWorkflow !== true)
      messages.push(`${trigger.id} doesn't start the workflow: switch "Starts the workflow" on.`);
  }
  for (const node of nodes) {
    if (!node.data.definition) {
      messages.push(`${node.id} is an unknown activity (${text(node.data.activity.type)}).`);
      continue;
    }
    for (const input of node.data.definition.inputs.filter(x => x.uiHint === SelectorHint)) {
      const value = inputValue(node.data.activity, input.key);
      // An expression chooses at run time; a literal must name a template.
      const missing = !value || (value.expression.type === 'Literal' && !parseSelection(text(value.expression.value))?.Id);
      if (missing)
        messages.push(`${node.id}: choose the ${input.displayName ?? input.key}.`);
    }
    if (node.data.definition.type === 'RIoT2.RIoTRunLlm' && !text(inputValue(node.data.activity, 'connection')?.expression.value))
      messages.push(`${node.id}: choose a model connection.`);
    if (!isTrigger(node.data.definition) && !edges.some(edge => edge.target === node.id))
      messages.push(`${node.id} is not connected: nothing leads to it.`);
  }
  return messages;
}
