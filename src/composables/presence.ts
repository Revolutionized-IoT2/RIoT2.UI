import { NodeType } from '@/models/enums';

/**
 * The UI's presence on riot2/node/{id}/online, as a dashboard node: camelCase like every other
 * node's (mqtt-topics.md). The orchestrator answers it with the configuration command.
 */
export function presenceMessage(name: string): string {
  return JSON.stringify({ isOnline: true, name, nodeType: NodeType.dashboard });
}

/** The last will on the same topic. */
export const offlineMessage = JSON.stringify({ isOnline: false });

/**
 * Whether a riot2/orchestrator/online message means the orchestrator has just (re)started and the
 * UI must announce itself again. A retained message arrives on every subscribe and describes an
 * orchestrator the UI already announced itself to when it connected.
 */
export function orchestratorCameOnline(message: string, retained: boolean): boolean {
  if (retained)
    return false;
  try {
    const parsed = JSON.parse(message);
    return parsed?.isOnline === true || parsed?.IsOnline === true;
  } catch {
    return false;
  }
}
