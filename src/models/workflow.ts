import type { JsonObject, JsonValue } from './generated/contracts';

// The workflow designer's API (ADR 0016), served by the orchestrator in both workflow modes. A workflow is Elsa's
// definition model (the format of an Elsa export and of RIoT2.Elsa's templates/), which the designer edits as JSON.

export type WorkflowModel = JsonObject;

export interface WorkflowSummary {
  definitionId: string;
  name: string | null;
  description: string | null;
  latestVersion: number;
  publishedVersion: number | null;
  isReadonly: boolean;
  updatedAt: string;
}

export interface WorkflowVersion {
  id: string;
  version: number;
  isLatest: boolean;
  isPublished: boolean;
  createdAt: string;
}

export interface WorkflowDetails {
  definitionId: string;
  id: string;
  name: string | null;
  description: string | null;
  version: number;
  isLatest: boolean;
  isPublished: boolean;
  publishedVersion: number | null;
  isReadonly: boolean;
  createdAt: string;
  model: WorkflowModel;
}

export interface WorkflowSaveResult {
  succeeded: boolean;
  workflow: WorkflowDetails | null;
  errors: string[];
}

export interface WorkflowExport {
  fileName: string;
  model: WorkflowModel;
}

export interface WorkflowEngineStatus {
  mode: 'embedded' | 'remote';
  available: boolean;
  engine: string;
  host: string | null;
}

export interface WorkflowRunSummary {
  id: string;
  definitionId: string;
  version: number;
  name: string | null;
  /** Elsa's status: Running or Finished. */
  status: string;
  /** Elsa's sub-status: Executing, Suspended, Finished, Cancelled or Faulted. */
  subStatus: string;
  incidentCount: number;
  createdAt: string;
  updatedAt: string | null;
  finishedAt: string | null;
}

export interface WorkflowRunsPage {
  items: WorkflowRunSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface WorkflowRunActivity {
  activityId: string;
  activityType: string;
  activityName: string | null;
  status: string;
  startedAt: string;
  completedAt: string | null;
  hasBookmarks: boolean;
  outcomes: string[];
  error: string | null;
}

export interface WorkflowRunDetails {
  run: WorkflowRunSummary;
  activities: WorkflowRunActivity[];
  incidents: string[];
}

/** RIoT2.Elsa's TemplateType. */
export enum TemplateType {
  Unknown = 0,
  Command = 1,
  Report = 2,
  Variable = 3
}

/** A report, command or variable a RIoT selector offers. */
export interface WorkflowTemplateItem {
  id: string;
  name: string;
  /** The ValueType. */
  type: number;
  node: string | null;
  device: string | null;
  model: JsonValue;
  templateType: TemplateType;
  /** The report's value is a forecast series (Orchestrator 1.23.0). */
  forecast?: boolean | null;
}

// ---------------------------------------------------------------- the activity catalog

export type WorkflowActivityKind = 'Trigger' | 'Action';

export interface WorkflowCatalog {
  engine: string;
  languages: string[];
  activities: WorkflowActivityDefinition[];
}

export interface WorkflowActivityDefinition {
  type: string;
  version: number;
  category: string;
  displayName: string;
  description: string | null;
  kind: WorkflowActivityKind;
  isTerminal: boolean;
  isStart: boolean;
  outcomes: string[];
  slots: { key: string; displayName: string }[];
  inputs: WorkflowInputDefinition[];
  outputs: { key: string; displayName: string; typeName: string }[];
}

export interface WorkflowInputDefinition {
  key: string;
  displayName: string | null;
  description: string | null;
  category: string | null;
  typeName: string;
  uiHint: string | null;
  isWrapped: boolean;
  defaultSyntax: string | null;
  defaultValue: JsonValue;
  isReadOnly: boolean | null;
  /** Elsa's UI specifications, such as {"dropdown":{"items":[…]}} or {"riot-output-selector":{…}}. */
  options: JsonValue;
}

// ---------------------------------------------------------------- the Elsa model, as the designer reads it

export interface WorkflowPosition {
  x: number;
  y: number;
}

/** An input's value in the model: its type and an expression (Literal, JavaScript, Liquid, Object, Variable…). */
export interface WorkflowInputValue {
  typeName: string;
  expression: { type: string; value: JsonValue };
}

/** One RIoT selector choice, stored as JSON text in the input's literal, as Studio stored it. */
export interface RIoTTemplateSelection {
  Id: string | null;
  Name: string;
  Type: number;
  Node: string | null;
  Device: string | null;
  Value: string | null;
  Model: JsonValue;
  TemplateType: TemplateType;
}

// ---------------------------------------------------------------- LLM (Run LLM step)

export const LlmProviders = ['OpenAI', 'AzureOpenAI', 'Anthropic', 'OpenAICompatible'] as const;
export type LlmProvider = typeof LlmProviders[number];

export interface LlmConnection {
  id: string;
  name: string;
  description: string | null;
  provider: LlmProvider;
  endpoint: string | null;
  model: string;
  apiVersion: string | null;
  hasApiKey: boolean;
  temperature: number | null;
  maxOutputTokens: number | null;
  enabled: boolean;
}

/** A new or changed connection; apiKey null keeps the stored key, "" removes it. */
export interface LlmConnectionSave {
  name: string;
  description: string | null;
  provider: LlmProvider;
  endpoint: string | null;
  model: string;
  apiVersion: string | null;
  apiKey: string | null;
  temperature: number | null;
  maxOutputTokens: number | null;
  enabled: boolean;
}

export interface LlmRunResult {
  succeeded: boolean;
  text: string | null;
  json: JsonValue;
  toolCalls: number;
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  errorCode: string | null;
  error: string | null;
}

export interface LlmUsageTotal {
  key: string;
  connection: string;
  runs: number;
  failures: number;
  inputTokens: number;
  outputTokens: number;
}

export interface LlmUsageRecord {
  at: string;
  connection: string;
  provider: string;
  model: string;
  workflowDefinitionId: string | null;
  workflowInstanceId: string | null;
  activityId: string | null;
  succeeded: boolean;
  errorCode: string | null;
  inputTokens: number;
  outputTokens: number;
  toolCalls: number;
  commands: number;
  durationMs: number;
}

export interface LlmUsageSummary {
  from: string;
  connections: LlmUsageTotal[];
  days: LlmUsageTotal[];
  recent: LlmUsageRecord[];
}
