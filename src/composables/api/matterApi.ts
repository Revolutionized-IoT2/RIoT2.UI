import { Constants } from '@/models/constants';
import { useHttpClient, withCallback } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type MatterStatus from '@/models/matter/matterStatus';
import type MatterConfiguration from '@/models/matter/matterConfiguration';

export function useMatterApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  function getStatus(callback:(data: MatterStatus | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetMatterStatus;
    return withCallback(httpClient.get<MatterStatus>(url), callback, completed);
  }

  function getConfiguration(callback:(data: MatterConfiguration | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlGetMatterConfiguration;
    return withCallback(httpClient.get<MatterConfiguration>(url), callback, completed);
  }

  function saveConfiguration(configuration: MatterConfiguration, callback:(data: MatterStatus | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlSaveMatterConfiguration;
    return withCallback(httpClient.post<MatterConfiguration, MatterStatus>(url, configuration), callback, completed);
  }

  /**
   * The QR is served as a PNG, so it is bound straight to an img element rather than fetched.
   * The token busts the browser cache: the payload changes when the bridge is reset or reconfigured.
   */
  function getQrCodeUrl(token: number): string {

    return orchestratorStore.baseUrl + Constants.urlGetMatterQr + '?t=' + token;
  }

  function openCommissioning(callback:(data: MatterStatus | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlOpenMatterCommissioning;
    return withCallback(httpClient.get<MatterStatus>(url), callback, completed);
  }

  function refreshDevices(callback:(data: MatterStatus | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlRefreshMatterDevices;
    return withCallback(httpClient.get<MatterStatus>(url), callback, completed);
  }

  function reset(callback:(data: MatterStatus | null) => void, completed?:()=> void): Promise<void> {

    let url = orchestratorStore.baseUrl + Constants.urlResetMatter;
    return withCallback(httpClient.get<MatterStatus>(url), callback, completed);
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
