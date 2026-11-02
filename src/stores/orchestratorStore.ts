import { defineStore } from 'pinia'
import { computed, ref } from 'vue';

/**
 * Where the UI calls the orchestrator's API. The views wait until its configuration command has
 * arrived. `baseUrl` is the URL in that command, or "" when the UI image proxies /api to the
 * orchestrator (`sameOrigin`, design 7.5), so the API is called on the UI's own origin.
 */
export const useOrchestratorStore = defineStore('orchestrator', () => {
  const baseUrl = ref("");
  const sameOrigin = ref(false);
  const configured = ref(false);

  const isInitialized = computed(() => configured.value)

  return { baseUrl, sameOrigin, configured, isInitialized }
})
