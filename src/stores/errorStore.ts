
import type AppError from '@/models/appError';
import type Dashboard from '@/models/dashboard';
import { defineStore } from 'pinia'
import { computed, ref, type Ref } from 'vue';

export const useErrorStore = defineStore('errors', () => {

  const error: Ref<AppError | null> = ref(null);
  const showSnackbar: Ref<boolean> = ref(false);

  function setError(err: AppError): void {
    //console.dir(err);
    error.value = err; 
    showSnackbar.value = true;
  }

  return { setError, showSnackbar, error }
})