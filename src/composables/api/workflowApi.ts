import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type {
  TemplateType, WorkflowCatalog, WorkflowDetails, WorkflowEngineStatus, WorkflowExport, WorkflowModel, WorkflowRunDetails,
  WorkflowRunsPage, WorkflowSaveResult, WorkflowSummary, WorkflowTemplateItem, WorkflowVersion
} from '@/models/workflow';

/** The workflow designer's API (ADR 0016). */
export function useWorkflowApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();
  const url = (route: string, id?: string) => orchestratorStore.baseUrl + (id == null ? route : route.replace('{id}', encodeURIComponent(id)));

  function getStatus(): Promise<WorkflowEngineStatus | null> {
    const address = url(Constants.urlWorkflowStatus);
    return httpClient.get<WorkflowEngineStatus>(address);
  }

  function getWorkflows(): Promise<WorkflowSummary[] | null> {
    const address = url(Constants.urlWorkflows);
    return httpClient.get<WorkflowSummary[]>(address);
  }

  function getCatalog(): Promise<WorkflowCatalog | null> {
    const address = url(Constants.urlWorkflowCatalog);
    return httpClient.get<WorkflowCatalog>(address);
  }

  function getTemplates(types: TemplateType[]): Promise<WorkflowTemplateItem[] | null> {
    const names = types.map(x => ['Unknown', 'Command', 'Report', 'Variable'][x]).join(',');
    const address = url(Constants.urlWorkflowTemplates);
    return httpClient.get<WorkflowTemplateItem[]>(address, { params: { types: names } });
  }

  function getWorkflow(id: string, version?: number): Promise<WorkflowDetails | null> {
    const address = url(Constants.urlWorkflow, id);
    return httpClient.get<WorkflowDetails>(address, { params: version == null ? undefined : { version } });
  }

  function getVersions(id: string): Promise<WorkflowVersion[] | null> {
    const address = url(Constants.urlWorkflowVersions, id);
    return httpClient.get<WorkflowVersion[]>(address);
  }

  /** Creates a workflow from a definition model. */
  function createWorkflow(model: WorkflowModel, publish: boolean): Promise<WorkflowSaveResult | null> {
    const address = url(Constants.urlWorkflows);
    return httpClient.post<{ model: WorkflowModel; publish: boolean }, WorkflowSaveResult>(address, { model, publish });
  }

  /** Imports an Elsa export or a template. */
  function importWorkflow(model: WorkflowModel, publish: boolean): Promise<WorkflowSaveResult | null> {
    const address = url(Constants.urlImportWorkflow);
    return httpClient.post<{ model: WorkflowModel; publish: boolean }, WorkflowSaveResult>(address, { model, publish });
  }

  /** Saves the workflow's draft, a new version when the latest is published. */
  function saveWorkflow(id: string, model: WorkflowModel, publish: boolean): Promise<WorkflowSaveResult | null> {
    const address = url(Constants.urlWorkflow, id);
    return httpClient.put<{ model: WorkflowModel; publish: boolean }, WorkflowSaveResult>(address, { model, publish });
  }

  function deleteWorkflow(id: string): Promise<null> {
    const address = url(Constants.urlWorkflow, id);
    return httpClient.delete<null>(address);
  }

  function exportWorkflow(id: string): Promise<WorkflowExport | null> {
    const address = url(Constants.urlExportWorkflow, id);
    return httpClient.get<WorkflowExport>(address);
  }

  function publishWorkflow(id: string): Promise<WorkflowSaveResult | null> {
    const address = url(Constants.urlPublishWorkflow, id);
    return httpClient.post<null, WorkflowSaveResult>(address, null);
  }

  /** Unpublishes the workflow, so its triggers stop. */
  function retractWorkflow(id: string): Promise<null> {
    const address = url(Constants.urlRetractWorkflow, id);
    return httpClient.post<null, null>(address, null);
  }

  function getRuns(definitionId: string | null, status: string | null, page: number, pageSize: number): Promise<WorkflowRunsPage | null> {
    const address = url(Constants.urlWorkflowRuns);
    return httpClient.get<WorkflowRunsPage>(address, {
      params: { definitionId: definitionId ?? undefined, status: status ?? undefined, page, pageSize }
    });
  }

  function getRun(id: string): Promise<WorkflowRunDetails | null> {
    const address = url(Constants.urlWorkflowRun, id);
    return httpClient.get<WorkflowRunDetails>(address);
  }

  function cancelRun(id: string): Promise<null> {
    const address = url(Constants.urlCancelWorkflowRun, id);
    return httpClient.post<null, null>(address, null);
  }

  return {
    getStatus, getWorkflows, getCatalog, getTemplates, getWorkflow, getVersions, createWorkflow, importWorkflow,
    saveWorkflow, deleteWorkflow, exportWorkflow, publishWorkflow, retractWorkflow, getRuns, getRun, cancelRun
  };
}
