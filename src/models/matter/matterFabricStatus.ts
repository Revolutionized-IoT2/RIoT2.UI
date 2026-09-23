/** One fabric the bridge has been commissioned into; one per controller ecosystem. */
export default class MatterFabricStatus {
    fabricIndex: number = 0;
    /** The label the commissioning administrator assigned. */
    label: string = "";
    /** The vendor id of the administrator that commissioned the fabric (Google is 0x6006). */
    vendorId: number = 0;
    /** The bridge's own operational node id on the fabric. */
    nodeId: string = "";
}
