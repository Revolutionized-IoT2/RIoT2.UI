import MatterEndpointStatus from "./matterEndpointStatus";
import MatterFabricStatus from "./matterFabricStatus";

/**
 * The Matter bridge's state as presented by GET /api/matter/status: whether it runs, the onboarding
 * codes a user scans in Google Home, the fabrics it is commissioned into and the endpoints it exposes.
 */
export default class MatterStatus {
    enabled: boolean = false;
    running: boolean = false;
    /** The reason the bridge is not running, when it failed to start. */
    error: string | null = null;
    nodeLabel: string = "";
    vendorId: number = 0;
    productId: number = 0;
    discriminator: number = 0;
    /** The MT: onboarding payload; the orchestrator renders it as a PNG on /api/matter/qr. */
    qrCode: string | null = null;
    /** The 11-digit manual pairing code, without separators. */
    manualCode: string | null = null;
    /** The manual pairing code grouped as XXXX-XXX-XXXX for display. */
    formattedManualCode: string | null = null;
    /** WindowNotOpen, BasicWindowOpen or EnhancedWindowOpen. */
    commissioningWindow: string = "";
    fabrics: MatterFabricStatus[] = [];
    endpoints: MatterEndpointStatus[] = [];
}
