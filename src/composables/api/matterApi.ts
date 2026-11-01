import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type MatterStatus from '@/models/matter/matterStatus';
import type MatterConfiguration from '@/models/matter/matterConfiguration';

/** The Matter bridge: status, configuration and commissioning. */
export function useMatterApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getStatus(): Promise<MatterStatus | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetMatterStatus;
    return httpClient.get<MatterStatus>(url);
  }

  function getConfiguration(): Promise<MatterConfiguration | null> {
    const url = orchestratorStore.baseUrl + Constants.urlGetMatterConfiguration;
    return httpClient.get<MatterConfiguration>(url);
  }

  function saveConfiguration(configuration: MatterConfiguration): Promise<MatterStatus | null> {
    const url = orchestratorStore.baseUrl + Constants.urlSaveMatterConfiguration;
    return httpClient.post<MatterConfiguration, MatterStatus>(url, configuration);
  }

  /**
   * The QR is served as a PNG, so it is bound straight to an img element rather than fetched.
   * The token busts the browser cache: the payload changes when the bridge is reset or reconfigured.
   */
  function getQrCodeUrl(token: number): string {
    return orchestratorStore.baseUrl + Constants.urlGetMatterQr + '?t=' + token;
  }

  function openCommissioning(): Promise<MatterStatus | null> {
    const url = orchestratorStore.baseUrl + Constants.urlOpenMatterCommissioning;
    return httpClient.post<null, MatterStatus>(url, null);
  }

  function refreshDevices(): Promise<MatterStatus | null> {
    const url = orchestratorStore.baseUrl + Constants.urlRefreshMatterDevices;
    return httpClient.post<null, MatterStatus>(url, null);
  }

  function reset(): Promise<MatterStatus | null> {
    const url = orchestratorStore.baseUrl + Constants.urlResetMatter;
    return httpClient.post<null, MatterStatus>(url, null);
  }

  return {
    getStatus,
    getConfiguration,
    saveConfiguration,
    getQrCodeUrl,
    openCommissioning,
    refreshDevices,
    reset
  };
}
