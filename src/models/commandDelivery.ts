/** The status of a command delivery (design 7.1). */
export type CommandDeliveryStatus = 'pending' | 'sent' | 'executed' | 'failed' | 'unknownCommand' | 'duplicate' | 'expired';

/** A command delivery: POST /api/v2/commands and GET /api/v2/commands/{correlationId}. */
export interface CommandDelivery {
    correlationId: string;
    commandId?: string | null;
    nodeId: string;
    status: CommandDeliveryStatus;
    isFinal: boolean;
    error?: string | null;
    attempts: number;
    created: string;
    expires: string;
    updated: string;
}

/** One outbox message in the summary. */
export interface OutboxEntry {
    id: string;
    kind: string;
    target: string;
    subject?: string | null;
    status: string;
    attempts: number;
    created: string;
    expires: string;
    updated: string;
    ageSeconds: number;
    lastError?: string | null;
}

/** GET /api/v2/outbox/summary: messages per status, the oldest pending one and the last ten errors. */
export interface OutboxSummary {
    counts: Record<string, number>;
    oldestPending?: OutboxEntry | null;
    lastErrors: OutboxEntry[];
}
