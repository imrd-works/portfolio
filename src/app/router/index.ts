import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { setupRouterMiddleware } from './middleware'
import { portfolioRoutes, notFoundRoute } from '@/pages'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/PortfolioLayout.vue'),
    children: portfolioRoutes,
  },
  notFoundRoute,
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

setupRouterMiddleware(router)

export default router
