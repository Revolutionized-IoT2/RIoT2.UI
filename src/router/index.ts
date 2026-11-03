import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

// Every view is its own chunk, loaded when its route is first visited, so the main bundle holds
// only the shell (App, Vuetify core, MQTT and the stores).
const Default = () => import('@/layout/Default.vue');

/** A route that shows `view` inside the default layout (app bar and navigation drawer). */
function withLayout(path: string, name: string, title: string, view: RouteRecordRaw['component']): RouteRecordRaw {
  return { path, name, component: Default, children: [{ path: '', name: title, component: view! }] };
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    withLayout('/', 'home', 'Home', () => import('@/views/HomeView.vue')),
    // The dashboard without the layout, for a wall display.
    { path: '/dashboard', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
    withLayout('/nodes', 'nodes', 'List nodes', () => import('@/views/NodesView.vue')),
    withLayout('/matter', 'matter', 'Matter bridge', () => import('@/views/MatterView.vue')),
    withLayout('/variables', 'variables', 'List variables', () => import('@/views/VariablesView.vue')),
    withLayout('/backup', 'backup', 'Backup and restore', () => import('@/views/BackupView.vue')),
    withLayout('/system', 'system', 'System health', () => import('@/views/SystemView.vue')),
    withLayout('/dash', 'dash', 'Dashboard with header', () => import('@/views/DashboardView.vue')),
    withLayout('/dashboard/edit', 'dashboard edit', 'Dashboard editor', () => import('@/views/DashboardView.vue')),
  ]
})

export default router
