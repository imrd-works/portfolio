import { createApp, createSSRApp } from 'vue'
import type { App, Plugin } from 'vue'
import type { Router } from 'vue-router'
import { createPinia } from 'pinia'
import AppRoot from '@/App.vue'
import { createAppRouter } from '@/router'
import { createAppI18n, setI18nLocale } from '@/i18n'
import { portfolioDirectives } from '@/shared/directives'
import { DEFAULT_LOCALE, localeFromPath, type AppLocale } from '@/app/config/site'
import '@/assets/styles/main.scss'

export interface CreateAppOptions {
  /** Render on the server (memory history, no DOM). */
  ssr?: boolean
  /** Hydrate prerendered markup instead of mounting a fresh tree. */
  hydrate?: boolean
  /** Head manager — `@unhead/vue/client` in the browser, `/server` at build time. */
  head: Plugin
}

export interface PortfolioApp {
  app: App
  router: Router
}

/**
 * Builds the application graph shared by the browser entry and the prerender
 * entry. Everything DOM-specific stays out of here so the same code can run
 * under Node during `npm run build`.
 */
export function createPortfolioApp({ ssr = false, hydrate = false, head }: CreateAppOptions) {
  const app = ssr || hydrate ? createSSRApp(AppRoot) : createApp(AppRoot)
  const router = createAppRouter(ssr)
  const i18n = createAppI18n(DEFAULT_LOCALE)

  // The URL owns the language. Applying it in a guard means the locale is
  // already correct during the very first render — no flash of Russian copy
  // on `/en/`, and the prerendered document is in the right language.
  router.beforeEach((to) => {
    setI18nLocale(i18n, (to.meta.locale as AppLocale | undefined) ?? localeFromPath(to.path))
  })

  app.use(createPinia())
  app.use(router)
  app.use(i18n)
  app.use(head)
  app.use(portfolioDirectives)

  return { app, router } satisfies PortfolioApp
}
