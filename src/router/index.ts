import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'Home',
          component: () => import('@/views/HomeView.vue'),
        },
      ],
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView
    },
    {
      path: '/nodes',
      name: 'nodes',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'List nodes',
          component: () => import('@/views/NodesView.vue'),
        },
      ],
    },
    {
      path: '/rules',
      name: 'rules',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'List rules',
          component: () => import('@/views/RulesView.vue'),
        },
      ],
    },
    {
      path: '/rules/editor/:id?',
      name: 'rulesEditor',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'Edit rules',
          component: () => import('@/views/RuleEditorView.vue'),
        },
      ],
    },
    {
      path: '/variables',
      name: 'variables',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'List variables',
          component: () => import('@/views/VariablesView.vue'),
        },
      ],
    },
    {
      path: '/rules/simulate/:id?',
      name: 'rulesSimulation',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'Simulate rules',
          component: () => import('@/views/RuleSimulationView.vue'),
        },
      ],
    },
    {
      path: '/dash',
      name: 'dash',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'Dashboard with header',
          component: () => import('@/views/DashboardView.vue'),
        },
      ],
    },
    {
      path: '/dashboard/edit',
      name: 'dashboard edit',
      component: () => import('@/layout/Default.vue'),
      meta: {
        //requiresAuth: true
      },
      children: [
        {
          path: '',
          name: 'Dashboard editor',
          component: () => import('@/views/DashboardView.vue'),
        },
      ],
    },
  ]
})

export default router
