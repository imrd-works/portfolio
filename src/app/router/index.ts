import { createMemoryHistory, createRouter, createWebHistory, START_LOCATION } from 'vue-router'
import type { Router, RouteRecordRaw } from 'vue-router'
import { setupRouterMiddleware } from './middleware'
import { portfolioRoutes, notFoundRoute } from '@/pages'

/**
 * Locale lives in the URL, not in localStorage: `/` is Russian, `/en/` is
 * English. Two crawlable URLs mean two prerendered documents, real `hreflang`
 * alternates and a shareable link per language.
 */
const routes: RouteRecordRaw[] = [...portfolioRoutes, notFoundRoute]

export function createAppRouter(ssr = false): Router {
  const router = createRouter({
    history: ssr ? createMemoryHistory() : createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
      // A fresh load (or a reload) opens the story at the hero; main.ts drops
      // a section's anchor from the address before the router reads it.
      if (from === START_LOCATION) return { top: 0 }
      // An anchor, not one of the overlay routes the page keeps in the hash.
      if (/^#[\w-]+$/.test(to.hash)) return { el: to.hash, behavior: 'smooth' }
      // the router remembers the scroll only for going back and forward
      if (savedPosition) return savedPosition
      // Switching RU <-> EN is the same page in another language: stay put.
      if (to.path !== from.path && to.name === from.name) return false
      return { top: 0 }
    },
  })

  setupRouterMiddleware(router)

  return router
}
