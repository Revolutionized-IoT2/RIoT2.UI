import { ref } from 'vue';
import type { Ref } from 'vue';
import AppError from '@/models/appError';
import { useErrorStore } from '@/stores/errorStore';
import type { IMqttService } from '@/composables/mqttService';

/**
 * The `gateway` realtime transport: live state from the orchestrator's /realtime hub instead of
 * MQTT (design 7.5, feature `realtime`). The hub arrives with security phase S2 (I50); until then
 * the orchestrator never asks for it, and this transport only reports that it isn't available.
 */
export function useGateway(id: string): IMqttService {
  const status: Ref<boolean> = ref(false);

  // Takes no handlers: nothing ever arrives.
  function connect() {
    useErrorStore().setError(new AppError(
      `The realtime gateway is not available in this UI version (client ${id}). Set the security feature realtime off.`));
  }

  return {
    connect,
    subscribe() {},
    sendMessage() {},
    disConnect() { status.value = false; },
    status,
  };
}
