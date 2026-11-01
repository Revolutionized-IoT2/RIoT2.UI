import { defineStore } from 'pinia'
import { computed, ref } from 'vue';

/** The orchestrator's API URL, from its configuration command. The views wait for it. */
export const useOrchestratorStore = defineStore('orchestrator', () => {
  const baseUrl = ref("");

  const isInitialized = computed(() => baseUrl.value != "")

  return { baseUrl, isInitialized }
})
