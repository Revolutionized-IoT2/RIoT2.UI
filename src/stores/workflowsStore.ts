import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useWorkflowApi } from '@/composables/api/workflowApi';
import { useRequests } from './requests';
import type {
  TemplateType, WorkflowCatalog, WorkflowDetails, WorkflowEngineStatus, WorkflowModel, WorkflowRunDetails, WorkflowRunsPage,
  WorkflowSaveResult, WorkflowSummary, WorkflowTemplateItem, WorkflowVersion
} from '@/models/workflow';

/** The workflows, the engine's status and catalog, the RIoT templates the selectors offer, and the runs (ADR 0016). */
export const useWorkflowsStore = defineStore('workflows', () => {
  const api = useWorkflowApi();
  const { loading, error, run } = useRequests();

  const workflows = ref<WorkflowSummary[]>([]);
  const status = ref<WorkflowEngineStatus | null>(null);
  const catalog = ref<WorkflowCatalog | null>(null);
  const templates = new Map<string, Promise<WorkflowTemplateItem[]>>();

  async function load(): Promise<void> {
    await Promise.all([
      run(async () => { status.value = await api.getStatus(); }),
      run(async () => { workflows.value = await api.getWorkflows() ?? []; }),
    ]);
  }

  /** The catalog, loaded once. */
  async function loadCatalog(): Promise<WorkflowCatalog | null> {
    if (catalog.value == null)
      await run(async () => { catalog.value = await api.getCatalog(); });
    return catalog.value;
  }

  /** The templates of the given kinds, loaded once per kinds; empty on failure. */
  function loadTemplates(types: TemplateType[]): Promise<WorkflowTemplateItem[]> {
    const key = [...types].sort().join(',');
    let pending = templates.get(key);
    if (pending == null) {
      pending = run(() => api.getTemplates(types)).then(x => x ?? []);
      templates.set(key, pending);
      void pending.then(items => { if (items.length === 0) templates.delete(key); });
    }
    return pending;
  }

  async function get(id: string, version?: number): Promise<WorkflowDetails | null> {
    return await run(() => api.getWorkflow(id, version)) ?? null;
  }

  async function versions(id: string): Promise<WorkflowVersion[]> {
    return await run(() => api.getVersions(id)) ?? [];
  }

  /** Creates (no id) or saves a workflow, optionally publishing it; null when the request failed. */
  async function save(id: string | null, model: WorkflowModel, publish: boolean): Promise<WorkflowSaveResult | null> {
    const result = await run(() => id == null ? api.createWorkflow(model, publish) : api.saveWorkflow(id, model, publish)) ?? null;
    void load();
    return result;
  }

  async function importModel(model: WorkflowModel, publish: boolean): Promise<WorkflowSaveResult | null> {
    const result = await run(() => api.importWorkflow(model, publish)) ?? null;
    void load();
    return result;
  }

  async function publish(id: string): Promise<WorkflowSaveResult | null> {
    const result = await run(() => api.publishWorkflow(id)) ?? null;
    void load();
    return result;
  }

  async function retract(id: string): Promise<boolean> {
    const done = await run(async () => { await api.retractWorkflow(id); return true; }) ?? false;
    void load();
    return done;
  }

  async function remove(id: string): Promise<boolean> {
    const done = await run(async () => { await api.deleteWorkflow(id); return true; }) ?? false;
    await load();
    return done;
  }

  async function exportModel(id: string) {
    return await run(() => api.exportWorkflow(id)) ?? null;
  }

  async function runs(definitionId: string | null, runStatus: string | null, page: number, pageSize: number): Promise<WorkflowRunsPage | null> {
    return await run(() => api.getRuns(definitionId, runStatus, page, pageSize)) ?? null;
  }

  async function runDetails(id: string): Promise<WorkflowRunDetails | null> {
    return await run(() => api.getRun(id)) ?? null;
  }

  async function cancelRun(id: string): Promise<boolean> {
    return await run(async () => { await api.cancelRun(id); return true; }) ?? false;
  }

  return {
    workflows, status, catalog, loading, error, load, loadCatalog, loadTemplates, get, versions, save, importModel,
    publish, retract, remove, exportModel, runs, runDetails, cancelRun
  };
});
