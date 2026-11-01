import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useMatterApi } from '@/composables/api/matterApi';
import { useRequests } from './requests';
import MatterStatus from '@/models/matter/matterStatus';
import MatterConfiguration from '@/models/matter/matterConfiguration';

/** The Matter bridge's status and configuration. */
export const useMatterStore = defineStore('matter', () => {
  const api = useMatterApi();
  const { loading, error, run } = useRequests();

  const status = ref<MatterStatus>(new MatterStatus());
  const configuration = ref<MatterConfiguration>(new MatterConfiguration());

  // Busts the browser cache on the QR image: the payload changes on reset and on reconfiguration,
  // but the URL does not.
  const qrToken = ref(0);

  async function applyStatus(request: () => Promise<MatterStatus | null>): Promise<void> {
    const data = await run(request);
    if (data != null) {
      status.value = data;
      qrToken.value++;
    }
  }

  const loadStatus = () => applyStatus(() => api.getStatus());

  async function loadConfiguration(): Promise<void> {
    const data = await run(() => api.getConfiguration());
    if (data != null)
      configuration.value = data;
  }

  const saveConfiguration = () => applyStatus(() => api.saveConfiguration(configuration.value));
  const openCommissioning = () => applyStatus(() => api.openCommissioning());
  const refreshDevices = () => applyStatus(() => api.refreshDevices());

  /** Resets the bridge; the passcode is regenerated, so the configuration is re-read too. */
  async function reset(): Promise<void> {
    await applyStatus(() => api.reset());
    await loadConfiguration();
  }

  const qrCodeUrl = () => api.getQrCodeUrl(qrToken.value);

  return {
    status, configuration, qrToken, loading, error,
    loadStatus, loadConfiguration, saveConfiguration, openCommissioning, refreshDevices, reset, qrCodeUrl
  };
});
