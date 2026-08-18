import { renderToString } from 'vue/server-renderer'
import { createHead, renderSSRHead } from '@unhead/vue/server'
import { createPortfolioApp } from '@/app/create'

export interface RenderResult {
  appHtml: string
  headTags: string
  htmlAttrs: string
  bodyAttrs: string
  bodyTags: string
  bodyTagsOpen: string
}

/**
 * Renders one route to a string. Used only by `scripts/prerender.mjs` at build
 * time — there is no Node server in production, the output is static files.
 */
export async function render(url: string): Promise<RenderResult> {
  // `disableDefaults` keeps unhead from re-emitting the charset and viewport
  // tags that index.html already carries.
  const head = createHead({ disableDefaults: true })
  const { app, router } = createPortfolioApp({ ssr: true, head })

  await router.push(url)
  await router.isReady()

  const appHtml = await renderToString(app)
  const payload = await renderSSRHead(head)

  return { appHtml, ...payload }
}
