import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useBackupApi } from '@/composables/api/backupApi';
import { useRequests } from './requests';
import { BackupSummary, type RestoreResult } from '@/models/backup';

/** Configuration backups: the saved ones, making one and restoring one (design 7.4). */
export const useBackupStore = defineStore('backup', () => {
  const api = useBackupApi();
  const { loading, error, run } = useRequests();

  const summary = ref<BackupSummary>(new BackupSummary());

  async function load(): Promise<void> {
    const data = await run(() => api.getSummary());
    if (data != null)
      summary.value = data;
  }

  /** Makes a backup and resolves to the zip; null on failure. */
  async function create(): Promise<Blob | null> {
    return await run(() => api.createBackup()) ?? null;
  }

  /**
   * Restores a chosen file or a saved backup by name, then reloads the list. Resolves to the
   * restore's summary; null on failure.
   */
  async function restore(source: Blob | string): Promise<RestoreResult | null> {
    const result = await run(() => typeof source === 'string' ? api.restoreSaved(source) : api.restore(source));
    await load();
    return result ?? null;
  }

  const downloadUrl = (name: string) => api.getDownloadUrl(name);

  return { summary, loading, error, load, create, restore, downloadUrl };
});
