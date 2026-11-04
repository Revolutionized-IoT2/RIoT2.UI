import { computed, getCurrentScope, onScopeDispose, ref, type InjectionKey, type Ref } from 'vue';
import { DeviceAuthorizationState } from '@/models/enums';
import type DeviceConfiguration from '@/models/deviceConfiguration';
import type { DeviceAuthorizationRequest } from '@/models/deviceAuthorizationRequest';
import type { DeviceAuthorization, DeviceAuthorizationStatus } from '@/models/generated/contracts';

/** The `type` of the message the orchestrator's callback page posts to the UI. */
export const authorizationMessageType = 'riot2-device-authorization';
/** Where the provider returns the browser: the orchestrator's callback page (`Constants.ApiOAuthCallbackPath` in Core). */
export const oauthCallbackPath = '/api/oauth/callback';

/** The providers a node's devices sign in to, by device class (`classFullName`). */
export type DeviceAuthorizationMap = Record<string, DeviceAuthorization>;

/** Provided by the node editor from the node's device templates, read by every device's account section. */
export const deviceAuthorizationsKey: InjectionKey<Ref<DeviceAuthorizationMap>> = Symbol('deviceAuthorizations');

/** The node whose device statuses the editor shows, and a quiet reload of them. Provided by the node editor. */
export interface DeviceStatusContext {
  nodeId: Ref<string | null>;
  refresh: () => Promise<void>;
}

export const deviceStatusContextKey: InjectionKey<DeviceStatusContext> = Symbol('deviceStatusContext');

/**
 * Moves the authorization descriptors of a node's device templates into `into`, by class. The templates lose them,
 * so a device added from a template is saved without them.
 */
export function takeDeviceAuthorizations(templates: DeviceConfiguration[], into: DeviceAuthorizationMap): void {
  for (const template of templates) {
    if (template.authorization?.provider && template.classFullName)
      into[template.classFullName] = template.authorization;
    delete template.authorization;
  }
}

/** The origin the UI calls the orchestrator's API on: the page's own when it proxies /api (`baseUrl` ""). */
export function apiOrigin(baseUrl: string | null | undefined, pageOrigin: string): string {
  if (baseUrl == null || baseUrl.trim() === '')
    return pageOrigin;
  const link = webLink(baseUrl, pageOrigin);
  return link == null ? pageOrigin : new URL(link).origin;
}

/** The redirect URI to register with the provider, and to send with the start request. */
export function callbackUri(origin: string): string {
  return origin + oauthCallbackPath;
}

/** An http or https address as an absolute URL, or null for anything else (a `javascript:` URL, garbage). */
export function webLink(url: string | null | undefined, base?: string): string | null {
  if (url == null || url.trim() === '')
    return null;
  try {
    const parsed = base == null ? new URL(url) : new URL(url, base);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? parsed.href : null;
  } catch {
    return null;
  }
}

/** How a device's sign-in is shown: a chip's text, Vuetify color and icon. */
export interface AuthorizationLook {
  text: string;
  color: string;
  icon: string;
}

/** The look of a device's sign-in; `onNode` is false while the node doesn't report the device (not saved yet). */
export function authorizationLook(onNode: boolean, status: DeviceAuthorizationStatus | null | undefined): AuthorizationLook {
  if (!onNode)
    return { text: 'Save the device first', color: 'grey', icon: 'mdi-content-save-alert-outline' };
  const message = status?.message?.trim() || null;
  switch (status?.state) {
    case DeviceAuthorizationState.connected:
      return { text: status.account?.trim() ? `Connected as ${status.account.trim()}` : 'Connected', color: 'success', icon: 'mdi-check-circle' };
    case DeviceAuthorizationState.expired:
      return { text: message == null ? 'Expired' : `Expired: ${message}`, color: 'error', icon: 'mdi-alert-circle' };
    case DeviceAuthorizationState.notConnected:
      return { text: 'Not connected', color: 'warning', icon: 'mdi-link-variant-off' };
    case DeviceAuthorizationState.notConfigured:
      return { text: message == null ? 'Not configured' : `Not configured: ${message}`, color: 'grey', icon: 'mdi-cog-outline' };
    default:
      return { text: 'Status unknown', color: 'grey', icon: 'mdi-help-circle' };
  }
}

/** How a sign-in ended, as the callback page or a failed start reports it. */
export interface AuthorizationResult {
  success: boolean;
  message: string;
}

/** The parts of a `MessageEvent` the UI reads. */
export interface AuthorizationMessageEvent {
  origin: string;
  data: unknown;
  source?: unknown;
}

/**
 * The result in a message from the orchestrator's callback page for this node and device, or null for any other
 * message: one from another origin than the API's, of another type, or for another device.
 */
export function readAuthorizationMessage(event: AuthorizationMessageEvent, expectedOrigin: string, nodeId: string, deviceId: string): AuthorizationResult | null {
  if (event.origin !== expectedOrigin || event.data == null || typeof event.data !== 'object')
    return null;
  const data = event.data as Record<string, unknown>;
  if (data.type !== authorizationMessageType || data.nodeId !== nodeId || data.deviceId !== deviceId)
    return null;
  const success = data.success === true;
  const message = typeof data.message === 'string' && data.message.trim() !== '' ? data.message : null;
  return { success, message: message ?? (success ? 'Connected.' : 'The sign-in failed.') };
}

/** Why the orchestrator refused to start a sign-in, from the `ApiError` (status and the node's message). */
export function startErrorMessage(failure: unknown, provider: string): string {
  const { status, detail, message } = (failure ?? {}) as { status?: unknown; detail?: unknown; message?: unknown };
  const reason = typeof detail === 'string' && detail.trim() !== '' ? detail : null;
  switch (status) {
    case 401:
    case 403:
      return 'Only an administrator can connect accounts.';
    case 404:
      return reason ?? 'The node isn\'t running this device. Save the configuration and wait until the node has started the device.';
    case 409:
      return reason ?? `The device isn't ready to connect to ${provider}. Check its settings and save them.`;
    case 429:
      return 'Too many sign-ins are in progress. Try again in a few minutes.';
    case 502:
      return reason == null ? 'The node didn\'t answer.' : `The node didn't answer: ${reason}`;
  }
  return reason ?? (typeof message === 'string' ? message : String(failure));
}

/** The sign-in window: a `Window` in the browser. */
export interface AuthorizationPopup {
  readonly closed: boolean;
  close(): void;
  location: { href: string };
}

/** What the sign-in needs from the browser; tests pass their own. */
export interface AuthorizationEnvironment {
  pageOrigin: string;
  openPopup(): AuthorizationPopup | null;
  listen(handler: (event: AuthorizationMessageEvent) => void): () => void;
  every(milliseconds: number, callback: () => void): () => void;
  after(milliseconds: number, callback: () => void): () => void;
}

export function browserEnvironment(): AuthorizationEnvironment {
  return {
    pageOrigin: window.location.origin,
    openPopup: () => window.open('', 'riot2-device-authorization', 'popup,width=520,height=720'),
    listen(handler) {
      const listener = (event: MessageEvent) => handler(event);
      window.addEventListener('message', listener);
      return () => window.removeEventListener('message', listener);
    },
    every(milliseconds, callback) {
      const handle = window.setInterval(callback, milliseconds);
      return () => window.clearInterval(handle);
    },
    after(milliseconds, callback) {
      const handle = window.setTimeout(callback, milliseconds);
      return () => window.clearTimeout(handle);
    },
  };
}

export interface DeviceAuthorizationOptions {
  /** The node the device runs on; null while the device isn't on a node. */
  nodeId: () => string | null;
  deviceId: () => string;
  provider: () => string;
  /** `orchestratorStore.baseUrl`: "" when the UI proxies /api. */
  apiBaseUrl: () => string;
  /** Starts the sign-in and resolves to the provider's sign-in address. */
  start: (nodeId: string, deviceId: string, request: DeviceAuthorizationRequest) => Promise<string>;
  /** Reloads the device statuses; must not reject. */
  refresh: () => Promise<void>;
  environment?: AuthorizationEnvironment;
  pollInterval?: number;
  timeout?: number;
}

/**
 * "Connect to <provider>": opens the sign-in window, starts the sign-in at the orchestrator and sends the window
 * to the provider. The orchestrator's callback page posts the result back; while the window is open the device
 * statuses are also polled, in case that message never arrives. Everything stops when the scope is disposed.
 */
export function useDeviceAuthorization(options: DeviceAuthorizationOptions) {
  const environment = options.environment ?? browserEnvironment();
  const pollInterval = options.pollInterval ?? 3000;
  const timeout = options.timeout ?? 5 * 60 * 1000;

  const connecting = ref(false);
  const result = ref<AuthorizationResult | null>(null);
  const origin = computed(() => apiOrigin(options.apiBaseUrl(), environment.pageOrigin));
  const redirectUri = computed(() => callbackUri(origin.value));

  const cleanups: (() => void)[] = [];
  let attempt = 0;

  function stop(): void {
    for (const cleanup of cleanups.splice(0))
      cleanup();
    connecting.value = false;
  }

  function refresh(): void {
    options.refresh().catch(() => { /* the statuses stay as they were */ });
  }

  function fail(message: string): void {
    stop();
    result.value = { success: false, message };
  }

  async function connect(): Promise<void> {
    const nodeId = options.nodeId();
    const deviceId = options.deviceId();
    if (nodeId == null || nodeId === '' || deviceId === '')
      return;
    stop();
    result.value = null;

    // Before any await: a browser blocks a window that isn't opened in the click itself.
    const popup = environment.openPopup();
    if (popup == null) {
      fail('The browser blocked the sign-in window. Allow pop-ups for this page and try again.');
      return;
    }
    const current = ++attempt;
    connecting.value = true;
    const expectedOrigin = origin.value;

    cleanups.push(environment.listen(event => {
      if (event.source !== popup)
        return;
      const message = readAuthorizationMessage(event, expectedOrigin, nodeId, deviceId);
      if (message == null)
        return;
      stop();
      result.value = message;
      refresh();
      // The node restarts the device after the sign-in: read its status again once it has.
      cleanups.push(environment.after(pollInterval, refresh));
    }));

    let address: string | null;
    try {
      address = webLink(await options.start(nodeId, deviceId, { redirectUri: redirectUri.value, origin: environment.pageOrigin }));
    } catch (failure) {
      if (current !== attempt)
        return;
      popup.close();
      if (connecting.value)
        fail(startErrorMessage(failure, options.provider()));
      return;
    }
    if (current !== attempt)
      return;
    if (!connecting.value || popup.closed) {
      // Stopped meanwhile (the editor closed), or the user closed the empty window.
      popup.close();
      stop();
      return;
    }
    if (address == null) {
      popup.close();
      fail('The node returned no valid sign-in address.');
      return;
    }

    popup.location.href = address;
    cleanups.push(environment.every(pollInterval, () => {
      if (popup.closed)
        stop();
      refresh();
    }));
    cleanups.push(environment.after(timeout, stop));
  }

  if (getCurrentScope())
    onScopeDispose(stop);

  return { connecting, result, apiOrigin: origin, redirectUri, connect, stop };
}
