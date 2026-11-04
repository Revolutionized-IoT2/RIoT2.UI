/**
 * The body of `POST /api/nodes/{nodeId}/devices/{deviceId}/authorization` (an orchestrator-only shape): where the
 * provider returns (the orchestrator's `/api/oauth/callback`), and the UI's origin, which the callback page
 * posts the result to.
 */
export interface DeviceAuthorizationRequest {
  redirectUri: string;
  origin: string;
}
