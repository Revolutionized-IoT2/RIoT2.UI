import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useLlmApi } from '@/composables/api/llmApi';
import { useRequests } from './requests';
import type { LlmConnection, LlmConnectionSave, LlmRunResult, LlmUsageSummary } from '@/models/workflow';

/** The language model connections the Run LLM step uses, and their usage (ADR 0016). */
export const useLlmStore = defineStore('llm', () => {
  const api = useLlmApi();
  const { loading, error, run } = useRequests();

  const connections = ref<LlmConnection[]>([]);
  const usage = ref<LlmUsageSummary | null>(null);

  async function load(): Promise<void> {
    await run(async () => { connections.value = await api.getConnections() ?? []; });
  }

  async function loadUsage(days: number, connection: string | null = null): Promise<void> {
    await run(async () => { usage.value = await api.getUsage(days, connection); });
  }

  /** Creates (no id) or changes a connection; null on failure. */
  async function save(id: string | null, connection: LlmConnectionSave): Promise<LlmConnection | null> {
    const saved = await run(() => id == null ? api.createConnection(connection) : api.updateConnection(id, connection)) ?? null;
    await load();
    return saved;
  }

  async function remove(id: string): Promise<void> {
    await run(() => api.deleteConnection(id));
    await load();
  }

  async function test(id: string): Promise<LlmRunResult | null> {
    return await run(() => api.testConnection(id)) ?? null;
  }

  return { connections, usage, loading, error, load, loadUsage, save, remove, test };
});
