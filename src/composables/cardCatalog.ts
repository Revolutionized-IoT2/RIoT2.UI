import { useDashboardApi } from '@/composables/api/dashboardApi';
import { buildCardCatalog, compareVersions, type CardCatalog } from '@/dashboard/sdk/catalog';

export type CardCatalogSync = 'current' | 'uploaded' | 'older' | 'failed';

/**
 * Uploads this UI's card catalog to the orchestrator for the MCP dashboard tools (I60), unless it already has this
 * version's, or a newer UI's. Quiet: an orchestrator without the route, or a refusal, only means the tools can't build
 * cards yet.
 */
export async function syncCardCatalog(api = useDashboardApi(), catalog: CardCatalog = buildCardCatalog()): Promise<CardCatalogSync> {
  try {
    const stored = await api.getCardCatalog();
    if (stored?.uiVersion === catalog.uiVersion && stored.hash === catalog.hash)
      return 'current';
    if (stored != null && compareVersions(catalog.uiVersion, stored.uiVersion) < 0)
      return 'older';
    await api.saveCardCatalog(catalog);
    return 'uploaded';
  } catch {
    return 'failed';
  }
}
