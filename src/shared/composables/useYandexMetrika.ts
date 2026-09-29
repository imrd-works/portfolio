import { onBeforeUnmount, onMounted } from 'vue'
import { consent, onConsentChange } from '@/shared/lib/consent'

/**
 * Yandex Metrica. Everything about the counter is here: change it in this file.
 *
 * Only with the visitor's consent (lib/consent.ts): until they allow it nothing of
 * Metrica is on the page, not even its queue; once they do, it starts right away.
 *
 * On the published site only: the counter's number comes from
 * `VITE_YANDEX_METRIKA_ID` (a build secret, like the site's address), so nothing
 * loads in development, in the prerender, or in a build without it. The tag loads
 * once the page has, when the browser is idle, so it never competes with the hero's
 * opening.
 *
 * The site is one page that changes its address without reloading: switching the
 * language (`/` and `/en/`) and opening, switching and closing a project
 * (`#/work/<id>`), all through the History API. Metrica's own hash tracking only
 * hears `hashchange`, which `pushState` never fires, so every change of address is
 * sent from here as a hit, once.
 */
export const YANDEX_METRIKA = {
  id: import.meta.env.VITE_YANDEX_METRIKA_ID,
  /** The tag, through Metrica's alternative CDN: it also counts where yandex.ru is out of reach. */
  tag: 'https://mc.webvisor.org/metrika/tag_ww.js',
  /** What the counter records (the counter's own settings in Metrica must match). */
  options: {
    ssr: true, // the pages are prerendered
    webvisor: true, // session replays
    clickmap: true,
    trackLinks: true, // outbound links and file downloads (the CV)
    accurateTrackBounce: true,
  },
} as const

type Ym = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number }

declare global {
  interface Window {
    ym?: Ym
  }
}

interface Options {
  /** The counter's number; the build secret by default. */
  id?: string
  /** On the published site only, by default. */
  enabled?: boolean
}

/**
 * Starts the counter when the app mounts (in the root component, once) and returns
 * `reachGoal`, for goals set up in Metrica (a letter sent, the CV downloaded…).
 */
export function useYandexMetrika({
  id = YANDEX_METRIKA.id,
  enabled = import.meta.env.PROD,
}: Options = {}) {
  const counter = Number(id)
  const on = enabled && Boolean(id) && Number.isInteger(counter)
  let stop = () => {}
  let unwatch = () => {}

  const begin = () => {
    if (!window.ym) stop = start(counter)
  }

  onMounted(() => {
    if (!on) return
    if (consent.granted) begin()
    else unwatch = onConsentChange((value) => value === 'granted' && begin())
  })
  onBeforeUnmount(() => {
    unwatch()
    stop()
  })

  function reachGoal(target: string, params?: Record<string, unknown>) {
    if (on) window.ym?.(counter, 'reachGoal', target, params)
  }

  return { reachGoal }
}

/** Sets the counter up and loads its tag; returns the way to undo it. */
function start(counter: number): () => void {
  // the queue Metrica's tag picks up when it arrives, as its own snippet sets it up
  const ym: Ym = (...args: unknown[]) => {
    ;(ym.a ??= []).push(args)
  }
  ym.l = Date.now()
  window.ym = ym
  ym(counter, 'init', {
    ...YANDEX_METRIKA.options,
    referrer: document.referrer,
    url: location.href,
  })

  // every later change of address, sent once, with the address it came from
  let last = location.href
  const hit = () => {
    if (location.href === last) return
    window.ym?.(counter, 'hit', location.href, { referer: last, title: document.title })
    last = location.href
  }
  const original = { pushState: history.pushState, replaceState: history.replaceState }
  for (const method of ['pushState', 'replaceState'] as const) {
    history[method] = function (this: History, ...args: Parameters<History['pushState']>) {
      original[method].apply(this, args)
      queueMicrotask(hit) // the router sets the title just after the address
    }
  }
  addEventListener('popstate', hit)

  const load = () => {
    const script = document.createElement('script')
    script.async = true
    script.src = `${YANDEX_METRIKA.tag}?id=${counter}`
    document.head.appendChild(script)
  }
  const whenIdle = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(load, { timeout: 4000 })
      : setTimeout(load, 1500)
  if (document.readyState === 'complete') whenIdle()
  else addEventListener('load', whenIdle, { once: true })

  return () => {
    history.pushState = original.pushState
    history.replaceState = original.replaceState
    removeEventListener('popstate', hit)
    removeEventListener('load', whenIdle)
  }
}
