import type { Router } from 'vue-router'
import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { auth } from './auth'
import { guest } from './guest'
import { notFoundMiddleware } from './notFound'

export type MiddlewareContext = {
  to: RouteLocationNormalized
  from: RouteLocationNormalized
}

export type MiddlewareResult = void | RouteLocationRaw | false

export type Middleware = (ctx: MiddlewareContext) => MiddlewareResult | Promise<MiddlewareResult>

const middlewareRegistry: Record<string, Middleware> = {}

export function registerMiddleware(name: string, fn: Middleware): void {
  middlewareRegistry[name] = fn
}

registerMiddleware('auth', auth)
registerMiddleware('guest', guest)
registerMiddleware('notFound', notFoundMiddleware)

export function setupRouterMiddleware(router: Router): void {
  router.beforeEach(async (to, from) => {
    const names = (to.meta.middleware as string[]) || []

    for (const name of names) {
      const fn = middlewareRegistry[name]
      if (!fn) {
        console.warn(`[Router] Middleware "${name}" not registered`)
        continue
      }
      const result = await fn({ to, from })
      if (result !== undefined && result !== null) {
        return result
      }
    }
  })
}
