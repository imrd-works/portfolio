import type { RouteRecordRaw } from 'vue-router'
import { LOCALE_ROUTE_PATH } from '@/app/config/site'

const HomePage = () => import('./views/HomePage.vue')
const PortfolioLayout = () => import('@/layouts/PortfolioLayout.vue')

/**
 * One route record per locale. Both render the same page component — the
 * active language comes from `meta.locale`, which the app applies to i18n and
 * to `<html lang>` before the first render (client and prerender alike).
 */
export const portfolioRoutes: RouteRecordRaw[] = [
  {
    path: LOCALE_ROUTE_PATH.ru,
    component: PortfolioLayout,
    children: [
      {
        path: '',
        name: 'Home',
        component: HomePage,
        meta: { locale: 'ru' },
      },
    ],
  },
  {
    path: LOCALE_ROUTE_PATH.en,
    component: PortfolioLayout,
    children: [
      {
        path: '',
        name: 'HomeEn',
        component: HomePage,
        meta: { locale: 'en' },
      },
    ],
  },
]
