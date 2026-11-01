import AppError from '@/models/appError';
import { ApiError } from '@/composables/httpClientService';
import { errorMessage } from '@/composables/errors';
import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';

/** The error the snackbar in App.vue shows. */
export const useErrorStore = defineStore('errors', () => {

  const error: Ref<AppError | null> = ref(null);
  const showSnackbar: Ref<boolean> = ref(false);

  function setError(err: AppError): void {
    error.value = err;
    showSnackbar.value = true;
  }

  /** Shows a failed request or any other exception. */
  function report(failure: unknown, text = 'Error in HTTP Client'): void {
    if (failure instanceof AppError) {
      setError(failure);
      return;
    }
    const stack = (failure as { stack?: string } | null)?.stack ?? '';
    setError(new AppError(text, errorMessage(failure), stack, failure instanceof ApiError ? failure.url : ''));
  }

  return { setError, report, showSnackbar, error };
});
