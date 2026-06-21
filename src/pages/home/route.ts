import type { RouteRecordRaw } from 'vue-router'

export const homeRoute: RouteRecordRaw = {
  path: '',
  name: 'Home',
  component: () => import('./views/HomePage.vue'),
  meta: {
    title: 'Daniel Rassomakhin — Portfolio',
  },
}
