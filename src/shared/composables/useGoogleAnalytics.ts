import { onBeforeUnmount, onMounted } from 'vue'
import { consent, onConsentChange } from '@/shared/lib/consent'

/**
 * Google Analytics 4. Everything about the tag is here: change it in this file.
 *
 * Only with the visitor's consent (lib/consent.ts): until they allow it nothing of
 * Google is on the page, not even its data layer; once they do, it starts right away.
 *
 * On the published site only: the measurement ID comes from `VITE_GA_MEASUREMENT_ID`
 * (a build secret, like the site's address), so nothing loads in development, in the
 * prerender, or in a build without it. The tag loads once the page has, when the
 * browser is idle, so it never competes with the hero's opening.
 *
 * Page views need nothing from here: the stream's enhanced measurement counts the
 * address changes of this one-page site itself (the language, the projects'
 * paintings), from the browser's history. Sending them from here as well would count
 * each one twice. Scrolls, outbound links and file downloads come from it too.
 */
export const GOOGLE_ANALYTICS = {
  id: import.meta.env.VITE_GA_MEASUREMENT_ID,
  tag: 'https://www.googletagmanager.com/gtag/js',
  /** Passed to `gtag('config')`. */
  config: {},
} as const

type Gtag = (...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: Gtag
  }
}

interface Options {
  /** The measurement ID (`G-…`); the build secret by default. */
  id?: string
  /** On the published site only, by default. */
  enabled?: boolean
}

/**
 * Starts the tag when the app mounts (in the root component, once) and returns
 * `event`, for events of one's own (a letter sent, the CV downloaded…).
 */
export function useGoogleAnalytics({
  id = GOOGLE_ANALYTICS.id,
  enabled = import.meta.env.PROD,
}: Options = {}) {
  const on = enabled && /^G-[A-Z0-9]+$/.test(id ?? '')

  let unwatch = () => {}
  const begin = () => {
    if (!window.gtag) start(id!)
  }

  onMounted(() => {
    if (!on) return
    if (consent.granted) begin()
    else unwatch = onConsentChange((value) => value === 'granted' && begin())
  })
  onBeforeUnmount(() => unwatch())

  function event(name: string, params?: Record<string, unknown>) {
    if (on) window.gtag?.('event', name, params)
  }

  return { event }
}

/** Sets the tag up and loads it, as Google's own snippet does. */
function start(id: string) {
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    // gtag.js reads the `arguments` object itself, not an array made of it
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', id, GOOGLE_ANALYTICS.config)

  const load = () => {
    const script = document.createElement('script')
    script.async = true
    script.src = `${GOOGLE_ANALYTICS.tag}?id=${id}`
    document.head.appendChild(script)
  }
  const whenIdle = () =>
    'requestIdleCallback' in window
      ? requestIdleCallback(load, { timeout: 4000 })
      : setTimeout(load, 1500)
  if (document.readyState === 'complete') whenIdle()
  else addEventListener('load', whenIdle, { once: true })
}
