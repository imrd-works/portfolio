import type { Middleware } from './index'
import { useUserStore } from '@/stores'

export const auth: Middleware = ({ to }) => {
  const userStore = useUserStore()
  if (!userStore.isAuthenticated) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
}
