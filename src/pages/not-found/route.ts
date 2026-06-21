import type { RouteRecordRaw } from 'vue-router'

export const notFoundRoute: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('./views/NotFoundPage.vue'),
  meta: {
    title: '404',
    layout: false,
  },
}
