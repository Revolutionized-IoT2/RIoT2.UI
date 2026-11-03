import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { SystemHealth } from '@/models/systemHealth';
import type { SecurityInfo } from '@/models/generated/contracts';

/** The System page (I46): the health report, and the cheap request the connection banner probes the API with. */
export function useSystemApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getHealth(): Promise<SystemHealth | null> {
    return httpClient.get<SystemHealth>(orchestratorStore.baseUrl + Constants.urlSystemHealth, { timeout: 20000 });
  }

  /** GET /api/security/info on the orchestrator: anonymous and answered without any work. */
  function ping(): Promise<SecurityInfo | null> {
    return httpClient.get<SecurityInfo>(orchestratorStore.baseUrl + Constants.urlSecurityInfo, { timeout: 5000, headers: { Accept: 'application/json' } });
  }

  return { getHealth, ping };
}
