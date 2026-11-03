import { createRouter, createWebHistory, type RouteMeta, type RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** The view fills the main area itself, without the layout's padding. */
    fullBleed?: boolean;
    /** The dashboard without the app's layout (phones, wall displays, RIoT2.Mobile). */
    dashboardStandalone?: boolean;
    /** The dashboard editor. */
    dashboardEdit?: boolean;
  }
}

// Every view is its own chunk, loaded when its route is first visited, so the main bundle holds
// only the shell (App, Vuetify core, MQTT and the stores).
const Default = () => import('@/layout/Default.vue');
const Dashboard = () => import('@/views/DashboardView.vue');

/** A route that shows `view` inside the default layout (app bar and navigation drawer). */
function withLayout(path: string, name: string, title: string, view: RouteRecordRaw['component'], meta: RouteMeta = {}): RouteRecordRaw {
  return { path, name, component: Default, children: [{ path: '', name: title, component: view!, meta }] };
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    withLayout('/', 'home', 'Home', () => import('@/views/HomeView.vue')),
    // The dashboard alone, for phones and wall displays; RIoT2.Mobile opens /dashboard/fullscreen.
    { path: '/dashboard', alias: '/dashboard/fullscreen', name: 'dashboard', component: Dashboard, meta: { dashboardStandalone: true } },
    withLayout('/nodes', 'nodes', 'List nodes', () => import('@/views/NodesView.vue')),
    withLayout('/matter', 'matter', 'Matter bridge', () => import('@/views/MatterView.vue')),
    withLayout('/variables', 'variables', 'List variables', () => import('@/views/VariablesView.vue')),
    withLayout('/backup', 'backup', 'Backup and restore', () => import('@/views/BackupView.vue')),
    withLayout('/system', 'system', 'System health', () => import('@/views/SystemView.vue')),
    // The workflow designer and the Run LLM step's connections (ADR 0016), in place of Elsa Studio.
    withLayout('/workflows', 'workflows', 'Workflows', () => import('@/views/WorkflowsView.vue')),
    withLayout('/workflows/:id', 'workflow', 'Workflow designer', () => import('@/views/WorkflowDesignerView.vue')),
    withLayout('/ai', 'ai', 'AI models', () => import('@/views/AiModelsView.vue')),
    withLayout('/dash', 'dash', 'Dashboard with header', Dashboard, { fullBleed: true }),
    withLayout('/dashboard/edit', 'dashboard edit', 'Dashboard editor', Dashboard, { fullBleed: true, dashboardEdit: true }),
  ]
})

export default router
