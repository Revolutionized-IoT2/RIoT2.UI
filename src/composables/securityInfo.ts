import type { SecurityInfo } from '@/models/generated/contracts';

/** What the UI assumes without an answer: the mode off, live state over MQTT (design 7.5). */
export const offSecurityInfo: SecurityInfo = { mode: 'off', features: [], loginRequired: false, realtime: 'mqtt' };

/**
 * The security description, and whether it came through the UI's own origin. When it did, the UI
 * image proxies /api to the orchestrator, and the UI calls the API there instead of at the URL in
 * the configuration command.
 */
export interface SecurityState {
  info: SecurityInfo;
  sameOrigin: boolean;
}

/** A valid security description, or null for anything else (an HTML page, an error body). */
export function parseSecurityInfo(data: unknown): SecurityInfo | null {
  if (data == null || typeof data !== 'object')
    return null;
  const info = data as Partial<SecurityInfo>;
  if (typeof info.mode !== 'string' || typeof info.realtime !== 'string')
    return null;
  return {
    mode: info.mode,
    features: Array.isArray(info.features) ? info.features.filter(f => typeof f === 'string') : [],
    loginRequired: info.loginRequired === true,
    realtime: info.realtime,
  };
}

/** Asks `load` for the description; any failure means no proxy and the mode off. */
export async function loadSecurityState(load: () => Promise<unknown>): Promise<SecurityState> {
  try {
    const info = parseSecurityInfo(await load());
    if (info != null)
      return { info, sameOrigin: true };
  } catch {
    // No proxy, or an orchestrator without the endpoint: the UI works as before.
  }
  return { info: offSecurityInfo, sameOrigin: false };
}
