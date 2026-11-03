/**
 * Icons. The UI uses Material Design Icons ("mdi-…"). Dashboards saved before used Material icon
 * names ("home", "lightbulb"): the common ones are mapped to MDI when a dashboard loads; others still
 * render with the Material icon font (src/plugins/vuetify.ts), until the user picks a new icon.
 */
const materialToMdi: Record<string, string> = {
  add: 'plus', add_circle: 'plus-circle', alarm: 'alarm', ac_unit: 'snowflake', air: 'weather-windy',
  arrow_back: 'arrow-left', arrow_forward: 'arrow-right', arrow_downward: 'arrow-down', arrow_upward: 'arrow-up',
  battery_full: 'battery', battery_alert: 'battery-alert', battery_charging_full: 'battery-charging', bathtub: 'bathtub',
  bed: 'bed', bedroom_parent: 'bed-king', blinds: 'blinds', bolt: 'lightning-bolt', build: 'wrench',
  calendar_today: 'calendar', camera: 'camera', camera_alt: 'camera', cancel: 'close-circle', check: 'check',
  check_circle: 'check-circle', chair: 'sofa', close: 'close', cloud: 'cloud', computer: 'monitor', co2: 'molecule-co2',
  dashboard: 'view-dashboard', delete: 'delete', device_thermostat: 'thermometer', devices: 'devices',
  dining: 'silverware-fork-knife', directions_car: 'car', door_front: 'door', door_sliding: 'door-sliding',
  done: 'check', electric_bolt: 'lightning-bolt', electrical_services: 'power-plug', edit: 'pencil', eco: 'leaf',
  error: 'alert-circle', error_outline: 'alert-circle-outline', event: 'calendar', face: 'face-man',
  fan: 'fan', favorite: 'heart', fence: 'fence', fireplace: 'fireplace', flash_on: 'flash', garage: 'garage',
  grass: 'grass', heat_pump: 'heat-pump', help: 'help-circle', history: 'history', home: 'home',
  hot_tub: 'hot-tub', house: 'home', humidity_percent: 'water-percent', image: 'image', info: 'information',
  kitchen: 'fridge', key: 'key', lamp: 'lamp', light: 'lightbulb', lightbulb: 'lightbulb',
  lightbulb_outline: 'lightbulb-outline', light_mode: 'white-balance-sunny', dark_mode: 'weather-night',
  living: 'sofa', local_fire_department: 'fire', location_on: 'map-marker', lock: 'lock', lock_open: 'lock-open',
  meeting_room: 'door-open', mic: 'microphone', mode_fan: 'fan', motion_photos_on: 'motion-sensor',
  music_note: 'music', nightlight: 'weather-night', notifications: 'bell', opacity: 'water', outlet: 'power-socket-eu',
  pause: 'pause', person: 'account', pets: 'paw', phone: 'phone', photo: 'image', play_arrow: 'play',
  power: 'power-plug', power_settings_new: 'power', power_off: 'power-plug-off', radio_button_checked: 'radiobox-marked',
  refresh: 'refresh', roofing: 'home-roof', router: 'router-wireless', sensors: 'access-point', sensor_door: 'door-sensor',
  sensor_window: 'window-closed-variant', settings: 'cog', settings_remote: 'remote', shower: 'shower',
  speed: 'speedometer', star: 'star', stop: 'stop', storm: 'weather-lightning', sunny: 'white-balance-sunny',
  thermostat: 'thermostat', thermometer: 'thermometer', timeline: 'chart-timeline-variant', timer: 'timer-outline',
  toggle_on: 'toggle-switch', toggle_off: 'toggle-switch-off', trending_up: 'trending-up', trending_down: 'trending-down',
  trending_flat: 'trending-neutral', tv: 'television', videocam: 'video', visibility: 'eye', volume_up: 'volume-high',
  warning: 'alert', water: 'water', water_drop: 'water', waves: 'waves', wb_incandescent: 'lightbulb',
  wb_sunny: 'white-balance-sunny', weekend: 'sofa', wifi: 'wifi', window: 'window-closed-variant', yard: 'flower',
};

/** An icon name as the UI shows it: Material names it knows become MDI ("home" -> "mdi-home"). */
export function normalizeIcon(icon: string | null | undefined): string | undefined {
  const name = icon?.trim();
  if (!name)
    return undefined;
  if (name.startsWith('mdi-'))
    return name;
  const mapped = materialToMdi[name];
  return mapped ? `mdi-${mapped}` : name;
}

const semanticIcons: Record<string, [on: string, off?: string]> = {
  temperature: ['mdi-thermometer'],
  humidity: ['mdi-water-percent'],
  pressure: ['mdi-gauge'],
  illuminance: ['mdi-brightness-5'],
  power: ['mdi-flash'],
  energy: ['mdi-lightning-bolt'],
  voltage: ['mdi-sine-wave'],
  current: ['mdi-current-ac'],
  battery: ['mdi-battery'],
  co2: ['mdi-molecule-co2'],
  motion: ['mdi-motion-sensor', 'mdi-motion-sensor-off'],
  occupancy: ['mdi-home-account', 'mdi-home-outline'],
  contact: ['mdi-electric-switch-closed', 'mdi-electric-switch'],
  door: ['mdi-door-open', 'mdi-door-closed'],
  window: ['mdi-window-open-variant', 'mdi-window-closed-variant'],
  light: ['mdi-lightbulb-on', 'mdi-lightbulb-outline'],
  switch: ['mdi-toggle-switch', 'mdi-toggle-switch-off-outline'],
  brightness: ['mdi-brightness-6'],
  color: ['mdi-palette'],
  colorTemperature: ['mdi-thermometer-lines'],
  image: ['mdi-image'],
  text: ['mdi-text'],
};

/** The icon of a meaning, in its on or off state, such as an open or a closed door. */
export function iconFor(semantic: string | null | undefined, on = true): string | undefined {
  const icons = semantic == null ? undefined : semanticIcons[semantic];
  return icons == null ? undefined : on ? icons[0] : icons[1] ?? icons[0];
}

/** Icons offered first in the icon picker. */
export const suggestedIcons = [
  'mdi-home', 'mdi-sofa', 'mdi-bed', 'mdi-silverware-fork-knife', 'mdi-shower', 'mdi-garage', 'mdi-flower', 'mdi-office-building',
  'mdi-lightbulb', 'mdi-lightbulb-outline', 'mdi-lamp', 'mdi-ceiling-light', 'mdi-led-strip-variant', 'mdi-floor-lamp',
  'mdi-power-socket-eu', 'mdi-power-plug', 'mdi-toggle-switch', 'mdi-power', 'mdi-thermometer', 'mdi-water-percent',
  'mdi-gauge', 'mdi-flash', 'mdi-lightning-bolt', 'mdi-solar-power', 'mdi-battery', 'mdi-molecule-co2', 'mdi-weather-windy',
  'mdi-motion-sensor', 'mdi-door', 'mdi-door-open', 'mdi-window-closed-variant', 'mdi-lock', 'mdi-lock-open', 'mdi-cctv',
  'mdi-camera', 'mdi-bell', 'mdi-alarm-light', 'mdi-fan', 'mdi-air-conditioner', 'mdi-radiator', 'mdi-heat-pump',
  'mdi-fire', 'mdi-snowflake', 'mdi-water', 'mdi-pool', 'mdi-car', 'mdi-car-electric', 'mdi-ev-station', 'mdi-television',
  'mdi-speaker', 'mdi-music', 'mdi-robot-vacuum', 'mdi-washing-machine', 'mdi-dishwasher', 'mdi-fridge', 'mdi-coffee-maker',
  'mdi-white-balance-sunny', 'mdi-weather-night', 'mdi-weather-partly-cloudy', 'mdi-account', 'mdi-paw', 'mdi-heart',
  'mdi-star', 'mdi-clock-outline', 'mdi-calendar', 'mdi-chart-line', 'mdi-information', 'mdi-alert', 'mdi-cog',
];

let allIcons: Promise<string[]> | undefined;

/** Every MDI icon name ("mdi-…"), read from @mdi/font when first asked for (a lazily loaded chunk). */
export function loadIconNames(): Promise<string[]> {
  allIcons ??= import('@mdi/font/scss/_variables.scss?raw').then(({ default: scss }) =>
    Array.from(scss.matchAll(/^\s+"([a-z0-9-]+)": F[0-9A-F]+,?$/gm), match => `mdi-${match[1]}`));
  return allIcons;
}
