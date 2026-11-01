import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { BackupSummary, RestoreResult } from '@/models/backup';

/** The file name the orchestrator gives a backup: riot2-backup-20261101T030000Z.zip. */
export function backupFileName(date: Date): string {
  return 'riot2-backup-' + date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z') + '.zip';
}

/** Configuration backup and restore (design 7.4). */
export function useBackupApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getSummary(): Promise<BackupSummary | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetBackups;
    return httpClient.get<BackupSummary>(url);
  }

  /** Makes a backup of the current configuration and resolves to the zip. */
  function createBackup(): Promise<Blob | null> {
    const url = orchestratorStore.baseUrl + Constants.urlCreateBackup;
    return httpClient.post<null, Blob>(url, null, { responseType: 'blob' });
  }

  /** Restores a backup file; the replaced configuration is saved on the orchestrator first. */
  function restore(file: Blob): Promise<RestoreResult | null> {
    const url = orchestratorStore.baseUrl + Constants.urlRestoreBackup;
    return httpClient.post<Blob, RestoreResult>(url, file, { headers: { 'Content-Type': 'application/zip' } });
  }

  /** Restores a backup from the orchestrator's Backups/ folder. */
  function restoreSaved(name: string): Promise<RestoreResult | null> {
    const url = orchestratorStore.baseUrl + Constants.urlRestoreSavedBackup.replace('{name}', encodeURIComponent(name));
    return httpClient.post<null, RestoreResult>(url, null);
  }

  /** A saved backup is bound straight to a download link rather than fetched. */
  function getDownloadUrl(name: string): string {
    return orchestratorStore.baseUrl + Constants.urlDownloadBackup.replace('{name}', encodeURIComponent(name));
  }

  return {
    getSummary,
    createBackup,
    restore,
    restoreSaved,
    getDownloadUrl
  };
}
