/** One backup in the orchestrator's Backups/ folder. */
export class BackupInfo {
    name: string = "";
    sizeBytes: number = 0;
    createdAt: string = "";
}

/** The last scheduled backup: the file it wrote, or why it failed. */
export class BackupRun {
    at: string = "";
    name: string | null = null;
    error: string | null = null;
}

/** GET /api/v2/backups: the schedule and the saved backups, newest first. */
export class BackupSummary {
    /** RIOT2_BACKUP_SCHEDULE, a Quartz cron expression; null when scheduled backups are off. */
    schedule: string | null = null;
    retention: number = 0;
    nextRunAt: string | null = null;
    lastRun: BackupRun | null = null;
    backups: BackupInfo[] = [];
}

/** The answer to a restore. */
export class RestoreResult {
    createdAt: string = "";
    kind: string = "";
    orchestratorId: string = "";
    versions: Record<string, string> = {};
    files: number = 0;
    nodes: number = 0;
    variables: number = 0;
    matterCredentials: number = 0;
    /** The backup of the replaced configuration, to undo the restore. */
    safetyBackup: string = "";
}
