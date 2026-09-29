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

/**
 * How sharp the paintings are drawn, the visitor's own setting: the pixel ratio
 * the scenes draw at, at most. On a dense (Retina) screen the scenes cost four
 * times the pixels at 2x; 1x keeps every animation and draws them softer.
 * 1.5x until the visitor chooses: hardly softer than 2x on a phone, and nearly
 * half the pixels.
 */
export type Clarity = 1 | 1.5 | 2
export const CLARITIES: readonly Clarity[] = [1, 1.5, 2]
const DEFAULT_CLARITY: Clarity = 1.5
const CLARITY_KEY = 'graphics:clarity'

function hasStored(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null
  } catch {
    return false
  }
}

function readClarity(): Clarity {
  try {
    const v = Number(localStorage.getItem(CLARITY_KEY))
    return (CLARITIES as readonly number[]).includes(v) ? (v as Clarity) : DEFAULT_CLARITY
  } catch {
    return DEFAULT_CLARITY
  }
}

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
let clarity: Clarity = typeof window === 'undefined' ? DEFAULT_CLARITY : readClarity()
/** The visitor has set the clarity (then the offer goes straight to the light mode). */
let clarityChosen = typeof window !== 'undefined' && hasStored(CLARITY_KEY)
/**
 * What the page offers a visitor whose page stutters, in turn: first a lower
 * clarity on a dense screen (every animation kept), and the light mode if that
 * was not enough. `null` while nothing is offered.
 */
export type GraphicsOffer = 'clarity' | 'light' | 'weak'
let offered: GraphicsOffer | null = null
let probes = 0
let probing = false
let slowInARow = 0
const listeners = new Set<Listener>()
const offerListeners = new Set<(kind: GraphicsOffer) => void>()

/**
 * GPUs known to struggle with the scenes: the older Mali, Adreno and PowerVR of budget
 * phones, and drawing without a GPU at all (a software renderer).
 */
const WEAK_GPU =
  /Mali-(?:[34]\d\d|T[678]\d\d|G(?:31|51|52|57))\b|Adreno \(TM\) (?:[34]\d\d|50\d|51\d)\b|PowerVR (?:SGX|Rogue GE)|SwiftShader|llvmpipe|Software|Microsoft Basic Render/i

/** Whether the GPU the browser names is one of the weak ones. */
export function weakGpu(name: string): boolean {
  return WEAK_GPU.test(name)
}

/** The GPU as the browser names it, and its largest texture ('' and 0 without WebGL). */
function gpu(): { name: string; maxTexture: number } {
  if (typeof WebGLRenderingContext === 'undefined') return { name: '', maxTexture: 0 }
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return { name: '', maxTexture: 0 }
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const name = String(gl.getParameter(info ? info.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? '')
    const maxTexture = Number(gl.getParameter(gl.MAX_TEXTURE_SIZE)) || 0
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return { name, maxTexture }
  } catch {
    return { name: '', maxTexture: 0 }
  }
}

/**
 * The hints that the device is weak, before a single frame is measured: the visitor saves
 * data, little memory, few cores, a weak GPU or one that cannot hold the paintings'
 * textures.
 */
function hintsWeak(): boolean {
  if (typeof navigator === 'undefined') return false
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  if (nav.connection?.saveData) return true
  const memory = nav.deviceMemory
  const cores = nav.hardwareConcurrency
  if (memory !== undefined && memory <= 2) return true
  if (cores !== undefined && cores <= 2) return true
  if (memory !== undefined && memory <= 3 && cores !== undefined && cores <= 4) return true
  const g = gpu()
  return weakGpu(g.name) || (g.maxTexture > 0 && g.maxTexture < 4096)
}

export const graphics = {
  get level(): GraphicsLevel {
    return level
  },
  get low(): boolean {
    return level === 'low'
  },
  /** What is being offered and not answered yet, if anything. */
  get offered(): GraphicsOffer | null {
    return choice ? null : offered
  },
  get clarity(): Clarity {
    return clarity
  },
}

/** The screen's pixel ratio (1 outside a browser). */
function screenRatio(): number {
  return typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
}

/**
 * The clarities this screen can tell apart: none above its own pixel ratio. A
 * screen of 1x has only one, and then there is nothing to choose.
 */
export function clarityChoices(): Clarity[] {
  const dpr = screenRatio()
  return CLARITIES.filter((c) => c <= dpr + 0.01)
}

/** The visitor's clarity: kept, and the scenes are drawn again at once. */
export function chooseClarity(next: Clarity): void {
  try {
    localStorage.setItem(CLARITY_KEY, String(next))
  } catch {
    // private mode: it still holds for this page
  }
  clarityChosen = true
  const lowered = offered === 'clarity' && next < clarity
  if (offered === 'clarity') offered = null
  if (lowered) {
    // the lower clarity was taken from the offer: measure again, and if the page
    // still stutters, the light mode is offered next
    probes = 0
    slowInARow = 0
    window.setTimeout(probeGraphics, RECHECK_MS)
  }
  if (next === clarity) return
  clarity = next
  listeners.forEach((fn) => fn(level))
}

/**
 * The visitor turned the offer down, whichever it was: the page as it is, kept,
 * and nothing is offered again.
 */
export function declineOffer(): void {
  if (offered === 'clarity') chooseClarity(clarity)
  chooseGraphics('high')
}

/**
 * Calls `fn` whenever the level or the clarity changes (the scenes are laid out
 * again at the new pixel ratio); returns the unsubscribe.
 */
export function onGraphicsChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Calls `fn` when something is offered (and says what); returns the unsubscribe. */
export function onGraphicsOffer(fn: (kind: GraphicsOffer) => void): () => void {
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

function offer(hinted = false) {
  if (choice || offered) return
  // a device weak by its hints: the light mode and the lower clarity at once, asked
  // straight away; one that stutters: on a dense screen the clarity comes first
  // (smoother, and nothing stops moving), then the light mode
  const kind: GraphicsOffer = hinted
    ? 'weak'
    : !clarityChosen && clarity > 1 && screenRatio() > 1
      ? 'clarity'
      : 'light'
  offered = kind
  if (import.meta.env.DEV) console.info(`[graphics] offering the ${kind}`)
  offerListeners.forEach((fn) => fn(kind))
}

/**
 * The pixel ratio to draw at: the screen's, capped at 2 and at the visitor's
 * clarity, and 1x in the light mode.
 */
export function drawingRatio(): number {
  const dpr = screenRatio()
  return level === 'low' ? Math.min(dpr, 1) : Math.min(dpr, 2, clarity)
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
    window.setTimeout(() => offer(true), PROBE_DELAY_MS)
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
