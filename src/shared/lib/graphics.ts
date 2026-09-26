/**
 * How much graphics the page draws, and asking the visitor about it.
 *
 * The heavy scenes (the hero's scroll, the Path river) draw every frame. On a
 * weak device that makes the page stutter. Nothing is changed behind the
 * visitor's back: while a heavy scene runs the frames are measured, and if two
 * measures in a row find them too slow (or the browser hints the device is
 * weak), the page offers the light mode, and the visitor decides. The choice
 * is kept, so the question is asked once.
 *
 * `low`, the light mode, draws the scenes at 1x resolution, turns the mist off,
 * stills the river's current and paints less often at rest.
 */

export type GraphicsLevel = 'high' | 'low'

type Listener = (level: GraphicsLevel) => void

/** Slower than this (median frame, ms) is a stuttering page: under ~40 fps. */
export const SLOW_FRAME_MS = 25
/** Frames measured per probe; the median of them decides. */
const PROBE_FRAMES = 90
/** A probe waits this long first: loading and first paints stutter on any device. */
const PROBE_DELAY_MS = 1500
/** After one slow probe, the next one comes this soon to confirm it. */
const RECHECK_MS = 3000
/** A gap this long is the tab hidden or the page paused, not a slow frame. */
const GAP_MS = 250
/** Probes per page at most: the scenes starting, and the rechecks. */
const MAX_PROBES = 4
/** Slow probes in a row that make the offer: one could be a passing hiccup. */
const SLOW_TO_OFFER = 2
/** A probe gives up after this long without enough frames (a paused page): no verdict. */
const PROBE_MAX_MS = 10000

const STORE_KEY = 'graphics:choice'

function readChoice(): GraphicsLevel | null {
  try {
    const v = localStorage.getItem(STORE_KEY)
    return v === 'low' || v === 'high' ? v : null
  } catch {
    return null
  }
}

/** What the visitor chose, if they have: then they are never asked again. */
let choice: GraphicsLevel | null = typeof window === 'undefined' ? null : readChoice()
let level: GraphicsLevel = choice ?? 'high'
let offered = false
let probes = 0
let probing = false
let slowInARow = 0
const listeners = new Set<Listener>()
const offerListeners = new Set<() => void>()

/** The browser's own hints that the device is weak or the visitor saves data. */
function hintsWeak(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  if (nav.connection?.saveData) return true
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return true
  return nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 2
}

export const graphics = {
  get level(): GraphicsLevel {
    return level
  },
  get low(): boolean {
    return level === 'low'
  },
  /** The light mode is being offered and the visitor has not answered yet. */
  get offered(): boolean {
    return offered && !choice
  },
}

/** Calls `fn` whenever the level changes; returns the unsubscribe. */
export function onGraphicsChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Calls `fn` when the light mode is offered; returns the unsubscribe. */
export function onGraphicsOffer(fn: () => void): () => void {
  offerListeners.add(fn)
  return () => offerListeners.delete(fn)
}

function setLevel(next: GraphicsLevel) {
  if (next === level) return
  level = next
  listeners.forEach((fn) => fn(level))
}

/** The visitor's answer (the offer, later the settings): kept, and applied at once. */
export function chooseGraphics(next: GraphicsLevel): void {
  choice = next
  try {
    localStorage.setItem(STORE_KEY, next)
  } catch {
    // private mode: the choice still holds for this page
  }
  setLevel(next)
}

function offer() {
  if (choice || offered) return
  offered = true
  if (import.meta.env.DEV) console.info('[graphics] offering the light mode')
  offerListeners.forEach((fn) => fn())
}

/** The pixel ratio to draw at: the screen's, capped at 2, and 1x in the light mode. */
export function drawingRatio(): number {
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return level === 'low' ? Math.min(dpr, 1) : Math.min(dpr, 2)
}

/** The median of the frame times, the ones that are not gaps. */
export function medianFrame(times: number[]): number {
  const frames = times.filter((t) => t > 0 && t < GAP_MS).sort((a, b) => a - b)
  if (!frames.length) return 0
  const mid = frames.length >> 1
  return frames.length % 2 ? frames[mid] : (frames[mid - 1] + frames[mid]) / 2
}

/**
 * A heavy scene has started drawing: measure how fast frames come while it
 * does. It only watches the clock, one timestamp a frame for a second or two,
 * and changes nothing: two slow probes in a row make the offer. Does nothing
 * once the visitor has chosen or been asked, while a probe runs, or after
 * MAX_PROBES.
 */
export function probeGraphics(): void {
  if (typeof window === 'undefined' || choice || offered || probing) return
  if (hintsWeak()) {
    window.setTimeout(offer, PROBE_DELAY_MS)
    return
  }
  if (probes >= MAX_PROBES) return
  probing = true
  probes++
  const times: number[] = []
  let frames = 0 // the ones that are not gaps
  let last = 0
  let first = 0
  // gaps (the tab hidden, the page paused) are left out by their length, not by
  // `document.hidden`, which some embedded views report while they still paint
  const frame = (now: number) => {
    first ||= now
    if (choice || offered || now - first > PROBE_MAX_MS) {
      probing = false
      return
    }
    if (last) {
      const t = now - last
      times.push(t)
      if (t < GAP_MS) frames++
    }
    last = now
    if (frames < PROBE_FRAMES) {
      requestAnimationFrame(frame)
      return
    }
    probing = false
    const median = medianFrame(times)
    if (import.meta.env.DEV) console.info(`[graphics] probe: median frame ${median.toFixed(1)} ms`)
    if (median <= SLOW_FRAME_MS) {
      slowInARow = 0
      return
    }
    slowInARow++
    if (slowInARow >= SLOW_TO_OFFER) offer()
    else window.setTimeout(probeGraphics, RECHECK_MS) // once more, to be sure
  }
  window.setTimeout(() => requestAnimationFrame(frame), PROBE_DELAY_MS)
}

// console handle in development: __graphics.offer() shows the offer without waiting for a
// stuttering page (like __ink and __fog in the hero)
if (import.meta.env.DEV && typeof window !== 'undefined') {
  ;(window as Window & { __graphics?: unknown }).__graphics = { offer, probe: probeGraphics }
}
