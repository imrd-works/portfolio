import type { Middleware } from './index'
import { useUserStore } from '@/stores'

export const guest: Middleware = () => {
  const userStore = useUserStore()
  if (userStore.isAuthenticated) {
    return { name: 'Dashboard' }
  }
}
