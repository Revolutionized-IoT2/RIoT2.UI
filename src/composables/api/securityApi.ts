import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import type { SecurityInfo } from '@/models/generated/contracts';

/** The orchestrator's security description (design 7.5), read from the UI's own origin. */
export function useSecurityApi() {

  const httpClient = useHttpClient();

  /**
   * GET /api/security/info relative to the page, so it reaches the orchestrator only through the UI
   * image's /api proxy. Without the proxy the request fails, or nginx answers with the UI's page.
   */
  function getInfo(): Promise<SecurityInfo | null> {
    return httpClient.get<SecurityInfo>(Constants.urlSecurityInfo, { timeout: 5000, headers: { Accept: 'application/json' } });
  }

  return { getInfo };
}
