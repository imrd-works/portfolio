import type { Middleware } from './index'

export const notFoundMiddleware: Middleware = () => {
  return { name: 'NotFound' }
}
