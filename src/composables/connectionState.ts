import { reactive } from 'vue';

/**
 * The UI's own connections (I46): the realtime transport (MQTT or the gateway) and the orchestrator's
 * API. The banner in App.vue shows when either is down, and the System page shows both.
 */
export interface ConnectionState {
  mqttConnected: boolean;
  /** When the realtime connection was lost; null while connected or before it first connected. */
  mqttDownSince: number | null;
  /** Whether the realtime connection was ever up: before that the UI is still connecting. */
  mqttEverConnected: boolean;
  apiReachable: boolean;
  /** When the API stopped answering; null while it answers. */
  apiDownSince: number | null;
  apiError: string | null;
  /** When the API last answered. */
  apiLastSeen: number | null;
}

/** How long a connection may be down before the banner shows it: a reconnect usually takes less. */
export const bannerGraceMs = 5000;

export const connection: ConnectionState = reactive({
  mqttConnected: false,
  mqttDownSince: null,
  mqttEverConnected: false,
  apiReachable: true,
  apiDownSince: null,
  apiError: null,
  apiLastSeen: null,
});

/** Whether a failed request means the API can't be reached (no answer, or a proxy that has no orchestrator). */
export function isUnreachable(status: number): boolean {
  return status === 0 || status === 502 || status === 503 || status === 504;
}

export function setMqttConnected(connected: boolean, now = Date.now(), state: ConnectionState = connection): void {
  if (connected) {
    state.mqttConnected = true;
    state.mqttEverConnected = true;
    state.mqttDownSince = null;
  } else if (state.mqttConnected || state.mqttDownSince == null) {
    state.mqttConnected = false;
    state.mqttDownSince = state.mqttEverConnected ? (state.mqttDownSince ?? now) : null;
  }
}

/** Records the outcome of a request: any answer means the API is reachable. */
export function apiResult(reachable: boolean, error: string | null = null, now = Date.now(), state: ConnectionState = connection): void {
  if (reachable) {
    state.apiReachable = true;
    state.apiDownSince = null;
    state.apiError = null;
    state.apiLastSeen = now;
  } else {
    if (state.apiReachable)
      state.apiDownSince = now;
    state.apiReachable = false;
    state.apiError = error;
  }
}

function seconds(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 120 ? `${s} s` : `${Math.round(s / 60)} min`;
}

/**
 * The banner's text, or null when there is nothing to show: a connection counts as lost only after
 * {@link bannerGraceMs}, so a quick reconnect doesn't flash it.
 */
export function bannerText(state: ConnectionState, now = Date.now()): string | null {
  const parts: string[] = [];
  if (!state.mqttConnected && state.mqttDownSince != null && now - state.mqttDownSince >= bannerGraceMs)
    parts.push(`No live updates: the realtime connection was lost ${seconds(now - state.mqttDownSince)} ago. Reconnecting…`);
  if (!state.apiReachable && state.apiDownSince != null && now - state.apiDownSince >= bannerGraceMs)
    parts.push(`The orchestrator's API doesn't answer (${seconds(now - state.apiDownSince)})${state.apiError ? ': ' + state.apiError : ''}.`);
  return parts.length == 0 ? null : parts.join(' ');
}
