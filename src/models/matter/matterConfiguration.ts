/**
 * The operator-editable settings of the RIoT Control Bridge, as returned by
 * GET /api/matter/configuration and posted back by the Matter view.
 *
 * FabricStoreKey is deliberately round-tripped untouched: the orchestrator re-imposes the
 * stored value on save, so a UI edit can never orphan the commissioned fabrics.
 */
export default class MatterConfiguration {
    enabled: boolean = false;
    nodeLabel: string = "RIoT2 Control Bridge";
    /** The CSA test vendor id, 0xFFF1. */
    vendorId: number = 65521;
    productId: number = 32768;
    discriminator: number = 3840;
    attestationPath: string | null = null;
    credentialsDirectory: string = "MatterCredentials";
    fabricStoreKey: string | null = null;
}
