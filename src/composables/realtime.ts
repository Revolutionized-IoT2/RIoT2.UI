import { useMqtt, type IMqttService } from '@/composables/mqttService';
import { useGateway } from '@/composables/gatewayTransport';

/**
 * How the UI receives live state and announces itself (design 7.5): MQTT over WebSocket today, the
 * orchestrator's /realtime hub when the security feature `realtime` is on (phase S2). Both have
 * the shape of the MQTT service: topics and messages are the same.
 */
export type RealtimeTransport = IMqttService;

/** The transport `/api/security/info` asks for: `gateway`, or MQTT for anything else. */
export function createRealtimeTransport(kind: string | null | undefined, id: string): RealtimeTransport {
  return kind === 'gateway' ? useGateway(id) : useMqtt(id);
}
