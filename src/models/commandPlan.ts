import type { JsonValue } from './generated/contracts';

/** The orchestrator's command plans (ADR 0019): a command's values at future times. Orchestrator-only shapes. */
export type CommandPlanStatus = 'active' | 'completed' | 'cancelled' | 'replaced';

export type CommandPlanStepStatus =
  | 'pending' | 'delivering' | 'executed' | 'sent' | 'failed' | 'expired' | 'unknownCommand' | 'skipped' | 'missed' | 'cancelled';

export interface CommandPlanStep {
  at: string;
  value: JsonValue;
  status: CommandPlanStepStatus;
  correlationId?: string | null;
  sentAt?: string | null;
  error?: string | null;
}

export interface CommandPlan {
  id: string;
  commandId: string;
  name?: string | null;
  source?: string | null;
  catchUp: 'latest' | 'none';
  status: CommandPlanStatus;
  createdAt: string;
  updatedAt: string;
  next?: string | null;
  steps: CommandPlanStep[];
}

/** A report with a forecast series, as `GET /api/v2/forecasts` lists it. */
export interface ForecastInfo {
  id: string;
  name?: string | null;
  node?: string | null;
  device?: string | null;
  kind: string;
  unit?: string | null;
  issuedAt: string;
  receivedAt: string;
  points: number;
  from?: string | null;
  to?: string | null;
}
