/**
 * The visitor's consent to analytics (Yandex Metrica, Google Analytics).
 *
 * Nothing of them loads until the visitor allows it: no tag, no queue, no cookie.
 * The answer is kept for half a year, then the banner asks again. The visitor can
 * change it at any time from the cookie in the page's corner; taking it back
 * clears the counters' cookies and reloads the page, since tags already running
 * cannot be unloaded.
 */

export type ConsentValue = 'granted' | 'denied'

type Listener = (value: ConsentValue | null) => void

/** How long an answer is kept: half a year, then the visitor is asked again. */
export const CONSENT_TTL_MS = 182.5 * 24 * 60 * 60 * 1000

const STORE_KEY = 'consent:analytics'

/** The counters' own cookies: Metrica's `_ym*`, Google's `_ga*`, `_gid`, `_gat*`. */
const ANALYTICS_COOKIE = /^(_ym|_ga|_gid|_gat)/

function read(): ConsentValue | null {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (!raw) return null
    const { value, at } = JSON.parse(raw) as { value?: unknown; at?: unknown }
    if (value !== 'granted' && value !== 'denied') return null
    if (typeof at !== 'number' || Date.now() - at > CONSENT_TTL_MS) return null
    return value
  } catch {
    return null
  }
}

function write(value: ConsentValue) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({ value, at: Date.now() }))
  } catch {
    // private mode or storage off: the answer holds for this visit only
  }
}

let value: ConsentValue | null = typeof window === 'undefined' ? null : read()
const listeners = new Set<Listener>()

export const consent = {
  /** The answer, or `null` while there is none (never given, or half a year old). */
  get analytics(): ConsentValue | null {
    return value
  },
  get granted(): boolean {
    return value === 'granted'
  },
}

/** Calls `fn` on every change of the answer; returns the way to stop. */
export function onConsentChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Keeps the visitor's answer. Allowing starts the counters right away (they listen);
 * taking it back after they have run clears their cookies and reloads the page.
 */
export function setConsent(next: ConsentValue) {
  const wasRunning = value === 'granted' && analyticsLoaded()
  write(next)
  if (next === value) return
  value = next
  listeners.forEach((fn) => fn(next))
  if (next === 'denied' && wasRunning) {
    clearAnalyticsCookies()
    location.reload()
  }
}

/** Whether a counter has started on this page. */
function analyticsLoaded(): boolean {
  return Boolean(window.ym || window.gtag)
}

/** Deletes the counters' cookies, on this host and each parent domain they may sit on. */
export function clearAnalyticsCookies() {
  const names = document.cookie
    .split(';')
    .map((c) => c.split('=')[0].trim())
    .filter((name) => ANALYTICS_COOKIE.test(name))
  const parts = location.hostname.split('.')
  const domains = ['', ...parts.slice(0, -1).map((_, i) => `; domain=.${parts.slice(i).join('.')}`)]
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`
    }
  }
}

/** For tests: forget the answer and read it again from storage. */
export function reloadConsent() {
  value = read()
}
