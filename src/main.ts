import { nextTick } from 'vue'
import { createHead } from '@unhead/vue/client'
import { createPortfolioApp } from '@/app/create'
import { completeInitialRender, markPrerenderedHydration } from '@/shared/lib/hydration'
import 'virtual:svg-icons-register'

const root = document.querySelector<HTMLElement>('#app')

/** `/en` and `/en/` are the same document; compare them in one form. */
function normalize(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}

/**
 * `npm run build` prerenders each route to its own document and stamps the
 * path it was generated for. Hydrate only when that stamp matches the URL we
 * were actually served: if the host fell back to 404.html for an unknown
 * path, the markup describes a different page and hydrating it would splice
 * two trees together. Mounting fresh is the safe path, and `vite dev` (empty
 * shell, no stamp) takes it too.
 */
const prerenderedPath = root?.dataset.prerendered
const canHydrate =
  Boolean(prerenderedPath) && normalize(prerenderedPath!) === normalize(window.location.pathname)

if (canHydrate) markPrerenderedHydration()

const { app, router } = createPortfolioApp({
  hydrate: canHydrate,
  head: createHead(),
})

router.isReady().then(() => {
  app.mount('#app')
  void nextTick(completeInitialRender)
})
