/** One bridged endpoint, as declared by a RIoT device and exposed to a Matter controller. */
export default class MatterEndpointStatus {
    /** The Matter endpoint id the controller addresses; pinned across restarts. */
    endpointId: number = 0;
    /** The declared endpoint id from the device's MatterEndpointTemplate. */
    templateId: string = "";
    name: string = "";
    /** The Matter device type name, e.g. ExtendedColorLight. */
    deviceType: string = "";
    /** The id of the node hosting the RIoT device. */
    nodeId: string = "";
    /** The id of the RIoT device configuration the endpoint was declared by. */
    deviceId: string = "";
    /** Whether the owning node is online; a controller shows an unreachable device as offline. */
    reachable: boolean = false;
}
