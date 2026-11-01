import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
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

  function getSummary(callback:(data: BackupSummary | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetBackups;
    return withCallback(httpClient.get<BackupSummary>(url), callback, completed);
  }

  /** Makes a backup of the current configuration; the callback gets the zip. */
  function createBackup(callback:(data: Blob | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlCreateBackup;
    return withCallback(httpClient.post<null, Blob>(url, null, { responseType: 'blob' }), callback, completed);
  }

  /** Restores a backup file; the replaced configuration is saved on the orchestrator first. */
  function restore(file: Blob, callback:(data: RestoreResult | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRestoreBackup;
    return withCallback(httpClient.post<Blob, RestoreResult>(url, file, { headers: { 'Content-Type': 'application/zip' } }), callback, completed);
  }

  /** Restores a backup from the orchestrator's Backups/ folder. */
  function restoreSaved(name: string, callback:(data: RestoreResult | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRestoreSavedBackup.replace('{name}', encodeURIComponent(name));
    return withCallback(httpClient.post<null, RestoreResult>(url, null), callback, completed);
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
