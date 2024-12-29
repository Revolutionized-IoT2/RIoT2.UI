
import type Dashboard from '@/models/dashboard';
import { defineStore } from 'pinia'
import { computed, ref } from 'vue';

export const useOrchestratorStore = defineStore('orchestrator', () => {
  const baseUrl = ref("");
  //const dashboard = ref<Dashboard | null>(null);

  const isInitialized = computed(() => baseUrl.value != "")
  
  /*
  function increment() {
    count.value++
  }*/

  return { baseUrl, isInitialized }
})