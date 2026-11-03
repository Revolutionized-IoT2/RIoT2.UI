import { DeviceState } from '@/models/enums';
import type SystemNode from '@/models/systemNode';

/** How a device or node state is shown: a Vuetify color and a Material icon. */
export interface StateLook {
  color: string;
  icon: string;
}

const running: StateLook = { color: 'green', icon: 'mdi-check-circle' };
const unknown: StateLook = { color: 'yellow', icon: 'mdi-help-circle' };

export function deviceStateLook(state: DeviceState): StateLook {
  if (state == DeviceState.error)
    return { color: 'red', icon: 'mdi-alert-circle' };
  if (state == DeviceState.unknown || state == DeviceState.initialized)
    return unknown;
  if (state == DeviceState.stopped)
    return { color: 'blue', icon: 'mdi-close-circle-outline' };
  return running;
}

/**
 * A node's look: that of its first device that isn't running, or running when all are. Unknown
 * when the node reports no devices.
 */
export function nodeStateLook(node: SystemNode | null | undefined): StateLook {
  const statuses = node?.deviceStatuses ?? [];
  if (statuses.length == 0)
    return unknown;
  for (const status of statuses) {
    const look = deviceStateLook(status.state);
    if (look !== running)
      return look;
  }
  return running;
}
