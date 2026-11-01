import { computed, ref } from 'vue';
import { useErrorStore } from './errorStore';
import { errorMessage } from '@/composables/errors';

/**
 * Loading and error state for a store's requests. `run` awaits a request, keeps `loading` true
 * while any request is pending, and on failure sets `error`, shows the snackbar and resolves to
 * undefined, so a caller can tell a failure from an empty answer (null).
 */
export function useRequests() {
  const pending = ref(0);
  const error = ref<string | null>(null);
  const errors = useErrorStore();

  const loading = computed(() => pending.value > 0);

  async function run<T>(request: () => Promise<T>): Promise<T | undefined> {
    pending.value++;
    error.value = null;
    try {
      return await request();
    } catch (failure) {
      error.value = errorMessage(failure);
      errors.report(failure);
      return undefined;
    } finally {
      pending.value--;
    }
  }

  return { loading, error, run };
}
