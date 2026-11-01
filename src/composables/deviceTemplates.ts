import DeviceConfiguration from '@/models/deviceConfiguration';

/** The placeholder offered with a node's device templates, for a device the node doesn't list. */
export function blankDevice(): DeviceConfiguration {
  const device = new DeviceConfiguration();
  device.name = "New device";
  device.classFullName = "RIoT2.Net.Devices.NEWDEVICE";
  device.commandTemplates = [];
  device.reportTemplates = [];
  device.deviceParameters = {};
  return device;
}

/**
 * Adds the report and command templates that `offered` (the running device's own templates) has
 * and `device` lacks, matched by address. Existing templates keep their ids, names and settings.
 */
export function mergeDeviceTemplates(device: DeviceConfiguration, offered: DeviceConfiguration | null | undefined): void {
  if (offered == null)
    return;

  if (offered.commandTemplates != null) {
    device.commandTemplates ??= [];
    for (const template of offered.commandTemplates)
      if (!device.commandTemplates.some(x => x.address == template.address))
        device.commandTemplates.push(template);
  }

  if (offered.reportTemplates != null) {
    device.reportTemplates ??= [];
    for (const template of offered.reportTemplates)
      if (!device.reportTemplates.some(x => x.address == template.address))
        device.reportTemplates.push(template);
  }
}
