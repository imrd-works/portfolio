import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from './user'

const user = {
  id: '1',
  email: 'user@example.com',
  name: 'Test User',
}

describe('useUserStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('marks user as authenticated after login', () => {
    const store = useUserStore()

    store.login(user, 'token-123')

    expect(store.currentUser).toEqual(user)
    expect(store.token).toBe('token-123')
    expect(store.isAuthenticated).toBe(true)
  })

  it('clears user session on logout', () => {
    const store = useUserStore()
    store.login(user, 'token-123')

    store.logout()

    expect(store.currentUser).toBeNull()
    expect(store.token).toBeNull()
    expect(store.isAuthenticated).toBe(false)
  })
})
