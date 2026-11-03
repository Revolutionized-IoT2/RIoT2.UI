import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useSystemApi } from '@/composables/api/systemApi';
import { errorMessage } from '@/composables/errors';
import type { SystemHealth } from '@/models/systemHealth';

/**
 * The System page (I46): the health report and the connection banner's API probe. Both are quiet polls:
 * a failure keeps the last report and sets `error` without the snackbar, because the banner already says
 * when the API is unreachable.
 */
export const useSystemStore = defineStore('system', () => {
  const api = useSystemApi();

  const health = ref<SystemHealth | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function load(): Promise<void> {
    if (loading.value)
      return;
    loading.value = true;
    try {
      health.value = await api.getHealth();
      error.value = null;
    } catch (failure) {
      error.value = errorMessage(failure);
    } finally {
      loading.value = false;
    }
  }

  /** Asks the API whether it answers; httpClientService records the result for the banner. */
  async function ping(): Promise<void> {
    try {
      await api.ping();
    } catch {
      // Recorded by httpClientService.
    }
  }

  return { health, loading, error, load, ping };
});
