import type { RouteRecordRaw } from 'vue-router'

const NotFoundPage = () => import('./views/NotFoundPage.vue')
const PortfolioLayout = () => import('@/layouts/PortfolioLayout.vue')

/**
 * Anything no other route takes, in the portfolio's layout: the cookie and the
 * settings are in its corner here too.
 */
export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  component: PortfolioLayout,
  children: [
    {
      path: '',
      name: 'NotFound',
      component: NotFoundPage,
      meta: { title: '404' },
    },
  ],
}
