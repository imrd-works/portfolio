import type { App } from 'vue'
import { vMagnetic } from './magnetic'
import { vTilt } from './tilt'

export { vMagnetic, vTilt }

// Vue plugin registering the portfolio's custom directives. Installed once in
// main.ts so `v-magnetic` and `v-tilt` are available app-wide. (Scroll reveals
// use the shared <Motion> component instead.)
export const portfolioDirectives = {
  install(app: App) {
    app.directive('magnetic', vMagnetic)
    app.directive('tilt', vTilt)
  },
}
