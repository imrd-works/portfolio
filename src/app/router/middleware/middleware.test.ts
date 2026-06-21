import { beforeEach, describe, expect, it } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores'
import { auth } from './auth'
import { guest } from './guest'
import { notFoundMiddleware } from './notFound'

function route(fullPath: string): RouteLocationNormalized {
  return { fullPath } as RouteLocationNormalized
}

describe('router middleware', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('redirects guest users to login and preserves target path', () => {
    const result = auth({ to: route('/dashboard?tab=profile'), from: route('/') })

    expect(result).toEqual({
      name: 'Login',
      query: { redirect: '/dashboard?tab=profile' },
    })
  })

  it('allows authenticated users through auth middleware', () => {
    const store = useUserStore()
    store.setToken('token-123')

    expect(auth({ to: route('/dashboard'), from: route('/') })).toBeUndefined()
  })

  it('redirects authenticated users away from guest-only pages', () => {
    const store = useUserStore()
    store.setToken('token-123')

    expect(guest({ to: route('/login'), from: route('/') })).toEqual({ name: 'Dashboard' })
  })

  it('redirects unmatched routes to the not found page', () => {
    expect(notFoundMiddleware({ to: route('/missing'), from: route('/') })).toEqual({
      name: 'NotFound',
    })
  })
})
