/* eslint-disable */
/**
 * Generated from RIoT2.Core/contracts/schemas/riot2-contracts.schema.json (contract version 1)
 * by scripts/generate-models.mjs during `npm run build`. Do not edit: change the .NET contract
 * types in RIoT2.Core.Contracts, build RIoT2.Core.sln, then run `npm run generate`.
 */

/**
 * Any JSON value: a report, command or variable value, or a template's default model.
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "JsonValue".
 */
export type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
/**
 * 0 = Boolean, 1 = Text, 2 = Number, 3 = Entity, 4 = TextArray
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "ValueType".
 */
export type ValueType = 0 | 1 | 2 | 3 | 4;
/**
 * 0 = Button, 1 = Chart_line, 2 = Chart_bar, 3 = Chart_doughnut, 4 = Chart_pie, 5 = NumericValue, 6 = Image, 7 = Timeline, 8 = SlideButton, 9 = State, 10 = Switch
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DashboardComponentType".
 */
export type DashboardComponentType = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
/**
 * 3 = Small, 6 = Half, 9 = Large, 12 = Full
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DashboardComponentSize".
 */
export type DashboardComponentSize = 3 | 6 | 9 | 12;
/**
 * 21 = ContactSensor, 256 = OnOffLight, 257 = DimmableLight, 262 = LightSensor, 263 = OccupancySensor, 266 = OnOffPlugInUnit, 267 = DimmablePlugInUnit, 268 = ColorTemperatureLight, 269 = ExtendedColorLight, 769 = Thermostat, 770 = TemperatureSensor, 775 = HumiditySensor
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "MatterDeviceType".
 */
export type MatterDeviceType = 21 | 256 | 257 | 262 | 263 | 266 | 267 | 268 | 269 | 769 | 770 | 775;
/**
 * 0 = OnOff, 1 = CurrentLevel, 2 = CurrentHue, 3 = CurrentSaturation, 4 = ColorTemperatureMireds, 5 = TemperatureMeasuredValue, 6 = HumidityMeasuredValue, 7 = IlluminanceMeasuredValue, 8 = Occupancy, 9 = BooleanStateValue, 10 = LocalTemperature, 11 = OccupiedHeatingSetpoint, 12 = OccupiedCoolingSetpoint, 13 = ThermostatSystemMode
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "MatterAttribute".
 */
export type MatterAttribute = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;
/**
 * 0 = None, 1 = InvertBoolean, 2 = Percent0To100ToLevel0To254, 3 = Fraction0To1ToLevel0To254, 4 = Degrees0To360ToHue0To254, 5 = Percent0To100ToSaturation0To254, 6 = KelvinToMireds, 7 = CelsiusToHundredths, 8 = PercentToHundredths, 9 = LuxToLogScale
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "MatterValueScale".
 */
export type MatterValueScale = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
/**
 * 0 = Text, 1 = Number, 2 = Integer, 3 = Boolean
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DeviceParameterType".
 */
export type DeviceParameterType = 0 | 1 | 2 | 3;
/**
 * 0 = Unknown, 1 = Stopped, 2 = Initialized, 3 = Running, 4 = Error
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DeviceState".
 */
export type DeviceState = 0 | 1 | 2 | 3 | 4;
/**
 * 0 = Unknown, 1 = Device, 2 = Dashboard, 3 = Workflow
 *
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "NodeType".
 */
export type NodeType = 0 | 1 | 2 | 3;

/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "Command".
 */
export interface Command {
  id?: string | null;
  value?: JsonValue;
  correlationId?: string | null;
  contractVersion?: number | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "CommandResult".
 */
export interface CommandResult {
  correlationId?: string | null;
  commandId?: string | null;
  status?: string | null;
  error?: string | null;
  timeStamp: number;
  contractVersion?: number | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "CommandTemplate".
 */
export interface CommandTemplate {
  id?: string | null;
  name?: string | null;
  address?: string | null;
  model?: JsonValue;
  type: ValueType;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "ConfigurationCommand".
 */
export interface ConfigurationCommand {
  apiBaseUrl?: string | null;
  revision?: number | null;
  hash?: string | null;
  contractVersion?: number | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DashboardComponent".
 */
export interface DashboardComponent {
  name?: string | null;
  description?: string | null;
  icon?: string | null;
  type: DashboardComponentType;
  size: DashboardComponentSize;
  elements?: DashboardElement[] | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DashboardElement".
 */
export interface DashboardElement {
  name?: string | null;
  id?: string | null;
  icon?: string | null;
  numberOfPreviousReports: number;
  reportTemplate?: ReportTemplate | null;
  commandTemplate?: CommandTemplate | null;
  previousReports?: Report[] | null;
  properties?: {
    [k: string]: JsonValue;
  } | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "ReportTemplate".
 */
export interface ReportTemplate {
  type: ValueType;
  id?: string | null;
  name?: string | null;
  address?: string | null;
  parameters?: {
    [k: string]: string;
  } | null;
  filters?: string[] | null;
  maintainHistory: boolean;
  model?: JsonValue;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "Report".
 */
export interface Report {
  id?: string | null;
  timeStamp: number;
  filter?: string | null;
  value?: JsonValue;
  contractVersion?: number | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DashboardConfiguration".
 */
export interface DashboardConfiguration {
  pages?: DashboardPage[] | null;
  name?: string | null;
  id?: string | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DashboardPage".
 */
export interface DashboardPage {
  name?: string | null;
  icon?: string | null;
  components?: DashboardComponent[] | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DeviceConfiguration".
 */
export interface DeviceConfiguration {
  id: string | null;
  name: string | null;
  classFullName: string | null;
  commandTemplates: CommandTemplate[] | null;
  reportTemplates: ReportTemplate[] | null;
  deviceParameters: {
    [k: string]: string;
  } | null;
  refreshSchedule: string | null;
  matterEndpoints: MatterEndpointTemplate[] | null;
  hash?: string | null;
  parameterDefinitions?: DeviceParameterDefinition[] | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "MatterEndpointTemplate".
 */
export interface MatterEndpointTemplate {
  id: string | null;
  name: string | null;
  deviceType: MatterDeviceType;
  vendorName: string | null;
  productName: string | null;
  attributes: MatterAttributeBinding[] | null;
  commands: MatterCommandBinding[] | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "MatterAttributeBinding".
 */
export interface MatterAttributeBinding {
  attribute: MatterAttribute;
  reportTemplateId: string | null;
  valuePath: string | null;
  filter: string | null;
  scale: MatterValueScale;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "MatterCommandBinding".
 */
export interface MatterCommandBinding {
  attribute: MatterAttribute;
  commandTemplateId: string | null;
  valuePath: string | null;
  valueTemplateJson: string | null;
  scale: MatterValueScale;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DeviceParameterDefinition".
 */
export interface DeviceParameterDefinition {
  key: string | null;
  type: DeviceParameterType;
  required: boolean;
  secret: boolean;
  default?: string | null;
  description?: string | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "DeviceStatus".
 */
export interface DeviceStatus {
  id: string | null;
  name: string | null;
  message: string | null;
  state: DeviceState;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "FailedDevice".
 */
export interface FailedDevice {
  id?: string | null;
  message?: string | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "NodeCommandTemplate".
 */
export interface NodeCommandTemplate {
  nodeId: string | null;
  node: string | null;
  deviceId: string | null;
  device: string | null;
  id: string | null;
  name: string | null;
  address: string | null;
  model: JsonValue;
  type: ValueType;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "NodeDeviceConfiguration".
 */
export interface NodeDeviceConfiguration {
  name: string | null;
  id: string | null;
  pluginPackageUrl: string | null;
  deviceConfigurations: DeviceConfiguration[] | null;
  revision?: number | null;
  hash?: string | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "NodeOnlineMessage".
 */
export interface NodeOnlineMessage {
  name?: string | null;
  isOnline: boolean;
  nodeBaseUrl?: string | null;
  grpcBaseUrl?: string | null;
  nodeType: NodeType;
  manifest?: PackageManifest | null;
  pluginManifest?: PackageManifest | null;
  capabilities?: string[] | null;
  contractVersion?: number | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "PackageManifest".
 */
export interface PackageManifest {
  name?: string | null;
  version?: string | null;
  date?: string | null;
  installedPackageFilename?: string | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "NodeReportTemplate".
 */
export interface NodeReportTemplate {
  nodeId: string | null;
  node: string | null;
  deviceId: string | null;
  device: string | null;
  type: ValueType;
  id: string | null;
  name: string | null;
  address: string | null;
  parameters: {
    [k: string]: string;
  } | null;
  filters: string[] | null;
  maintainHistory: boolean;
  model: JsonValue;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "NodeStatusMessage".
 */
export interface NodeStatusMessage {
  appliedRevision?: number | null;
  appliedHash?: string | null;
  state?: string | null;
  error?: string | null;
  failedDevices?: FailedDevice[] | null;
  pluginManifest?: PackageManifest | null;
  timeStamp: number;
  contractVersion?: number | null;
}
/**
 * This interface was referenced by `RIoT2Contracts`'s JSON-Schema
 * via the `definition` "Variable".
 */
export interface Variable {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  isPersistant: boolean;
  valueAsJson?: string | null;
  type: ValueType;
  model?: JsonValue;
  value?: JsonValue;
}

/** A JSON object: an entity value, or the properties of a dashboard element. */
export interface JsonObject {
  [key: string]: JsonValue;
}
/** A JSON array. */
export interface JsonArray extends Array<JsonValue> {}
