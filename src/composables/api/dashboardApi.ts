import { Constants } from '@/models/constants';
import { useHttpClient } from '@/composables/httpClientService';
import { useOrchestratorStore } from '@/stores/orchestratorStore';
import type { DashboardData } from '@/dashboard/sdk/model';
import type { CardCatalog } from '@/dashboard/sdk/catalog';
import type { IReport } from '@/models/report';

/** A saved dashboard version (I60), newest first in the list; the newest is the dashboard now. */
export interface DashboardVersionInfo {
  id: string;
  savedAt: string;
  /** ui, mcp, restore, backup or baseline. */
  source: string;
  /** The MCP caller; empty for the UI. */
  caller: string;
  summary: string;
  pages: number;
  cards: number;
}

/** The stored card catalog as the UI compares it with its own. */
export interface StoredCardCatalog {
  uiVersion: string;
  hash: string;
}

/** The dashboard definition, with each element's report history. */
export function useDashboardApi() {

  const httpClient = useHttpClient();
  const orchestratorStore = useOrchestratorStore();

  /** Resolves to null when none is saved yet. */
  function getDashboard(): Promise<DashboardData | null> {
    return httpClient.get<DashboardData>(orchestratorStore.baseUrl + Constants.urlGetDashboardConfigurationWithHistory);
  }

  /** Saves the definition (toDefinition in src/dashboard/sdk/model.ts); resolves to the dashboard's id. */
  function saveDashboard(definition: DashboardData): Promise<string | null> {
    return httpClient.post<DashboardData, string>(orchestratorStore.baseUrl + Constants.urlSaveDashboard, definition);
  }

  /** A report template's kept reports, newest first; just the latest when it keeps no history. */
  function getReportHistory(templateId: string): Promise<IReport[] | null> {
    return httpClient.get<IReport[]>(orchestratorStore.baseUrl + Constants.urlGetReportHistory.replace('{id}', encodeURIComponent(templateId)));
  }

  /** The dashboard's versions, newest first. */
  function getVersions(): Promise<DashboardVersionInfo[] | null> {
    const url = orchestratorStore.baseUrl + Constants.urlDashboardVersions;
    return httpClient.get<DashboardVersionInfo[]>(url);
  }

  /** Makes a version the dashboard again; resolves to the new newest version. */
  function restoreVersion(id: string): Promise<DashboardVersionInfo | null> {
    const url = orchestratorStore.baseUrl + Constants.urlDashboardVersionRestore.replace('{id}', encodeURIComponent(id));
    return httpClient.post<null, DashboardVersionInfo>(url, null);
  }

  /** The stored card catalog; null when no UI has uploaded one. */
  function getCardCatalog(): Promise<StoredCardCatalog | null> {
    const url = orchestratorStore.baseUrl + Constants.urlDashboardCards;
    return httpClient.get<StoredCardCatalog>(url);
  }

  function saveCardCatalog(catalog: CardCatalog): Promise<StoredCardCatalog | null> {
    const url = orchestratorStore.baseUrl + Constants.urlDashboardCards;
    return httpClient.put<CardCatalog, StoredCardCatalog>(url, catalog);
  }

  return {
    getDashboard,
    saveDashboard,
    getReportHistory,
    getVersions,
    restoreVersion,
    getCardCatalog,
    saveCardCatalog,
  };
}
