import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useMcpApi } from '@/composables/api/mcpApi';
import { useRequests } from './requests';
import type { McpActivityEntry, McpConfiguration, McpConfigurationSave, McpStatus } from '@/models/mcp';

/** The MCP server's status, its tool policy and the latest tool calls (ADR 0018). */
export const useMcpStore = defineStore('mcp', () => {
  const api = useMcpApi();
  const { loading, error, run } = useRequests();

  const status = ref<McpStatus | null>(null);
  const configuration = ref<McpConfiguration | null>(null);
  const activity = ref<McpActivityEntry[]>([]);

  async function load(): Promise<void> {
    await Promise.all([
      run(async () => { status.value = await api.getStatus(); }),
      run(async () => { configuration.value = await api.getConfiguration(); }),
      loadActivity(),
    ]);
  }

  async function loadActivity(): Promise<void> {
    await run(async () => { activity.value = await api.getActivity(100) ?? []; });
  }

  /** Stores the policy; null on failure. */
  async function save(next: McpConfigurationSave): Promise<McpConfiguration | null> {
    const saved = await run(() => api.saveConfiguration(next)) ?? null;
    if (saved)
      configuration.value = saved;
    return saved;
  }

  return { status, configuration, activity, loading, error, load, loadActivity, save };
});
