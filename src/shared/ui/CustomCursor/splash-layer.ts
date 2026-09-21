/**
 * Ink under the brush cursor, rendered by the hero's own splash shader so it
 * looks exactly like the drop that hits the scroll.
 *
 * - hit(): a click. A blot with jets, flying drops, drips, water dust and a
 *   wet halo, rolled anew every time (half the hero's size); it stays for a
 *   while, then fades.
 * - rest(): the brush stopped. Ink slowly gathers under the tip and one to
 *   three drips run down like the hero's drips, then stop. It all holds while
 *   the brush rests; release() lets it dry away.
 *
 * Blots are pinned to what they fell on, not to the screen: each remembers the
 * element under it and its offset, so it scrolls with the content — and stays
 * put on the hero's sticky sheet, which does not move while the page scrolls.
 * Each blot draws only into a square around its centre, and the loop stops
 * as soon as nothing on screen is changing.
 */
import VERT from './shaders/quad.vert.glsl?raw'
import FRAG from './shaders/splash.frag.glsl?raw'
import { makeSplash, updateSplash, type SplashPart } from '@/shared/lib/ink/splash'

/** Blot radius in painting heights: the hero's `R0`. */
const R0 = 0.046
/** Click blots are drawn at this share of the hero blot's size. */
export const CLICK_SCALE = 0.5
/** Half the square a click blot draws into, in painting heights (room for flying drops). */
const CLICK_REACH = 0.4
const CLICK_HOLD_MS = 3500
const CLICK_FADE_MS = 1200

/** Resting ink: body radius and the half-size of its square, in CSS px. */
const POOL_RADIUS_PX = 7
const POOL_REACH_PX = 80
const POOL_GATHER_S = 0.5
const POOL_DRY_MS = 900

const SEGMENTS = 26
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

type Tone = { dense: [number, number, number]; thin: [number, number, number]; alpha: number }

// Paper: the shader's own ink (the trees). Dark site: black would vanish, so light ink.
const TONES: Record<'paper' | 'dark', Tone> = {
  paper: { dense: [0.035, 0.04, 0.05], thin: [0.21, 0.26, 0.35], alpha: 1 },
  dark: { dense: [0.925, 0.91, 0.882], thin: [0.67, 0.7, 0.78], alpha: 0.85 },
}

interface Blot {
  kind: 'click' | 'pool'
  anchor: Element | null // what the ink fell on
  x: number // offset from the anchor's top-left (page coordinates without one)
  y: number
  t: number
  unit: number // CSS px per shader unit
  r0: number // blot radius, shader units
  reach: number // half of the square, shader units
  seed: number
  parts: SplashPart[]
  seg: Float32Array
  rad: Float32Array
  tone: Tone
  settleS: number // pool: after this many seconds nothing moves any more
  released: number // pool: when the brush left (0 while it rests)
}

export interface SplashLayer {
  /** A drop has just hit (x, y) in viewport px. */
  hit(x: number, y: number, paper: boolean): void
  /** The brush came to rest at (x, y): let ink gather and drip. */
  rest(x: number, y: number, paper: boolean): void
  /** The brush moved on: the resting ink dries away. */
  release(): void
  /** The page scrolled under the brush: redraw, and resting ink dries. */
  scrolled(): void
  resize(): void
  destroy(): void
}

/**
 * Pixels per hero painting height for the current viewport: landscape sheets
 * are about 0.93 of the viewport high; on narrow screens the painting follows
 * the width.
 */
export function inkUnit(): number {
  return Math.min(window.innerHeight * 0.93, window.innerWidth * 1.07)
}

/** One to three drips shaped like the hero's, sized for a small resting blot. */
function poolDrips(r: number): SplashPart[] {
  const count = Math.random() < 0.35 ? 1 : Math.random() < 0.6 ? 2 : 3
  const parts: SplashPart[] = []
  let delay = rnd(0.5, 0.9)
  for (let i = 0; i < count; i++) {
    parts.push({
      kind: 'drip',
      dx: r * rnd(-0.5, 0.5),
      len: r * rnd(3, 8),
      ra: r * rnd(0.16, 0.24),
      rb: r * rnd(0.3, 0.4),
      delay,
      tau: rnd(0.6, 1.2),
    })
    delay += rnd(0.6, 1.4)
  }
  return parts
}

export function createSplashLayer(canvas: HTMLCanvasElement): SplashLayer | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false })
  if (!gl) return null

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? '')
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) ?? '')
  }
  gl.useProgram(prog)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const U = Object.fromEntries(
    [
      'uScale',
      'uBlotR',
      'uT',
      'uSeed',
      'uR0',
      'uFade',
      'uDust',
      'uDense',
      'uThin',
      'uSeg',
      'uRad',
    ].map((n) => [n, gl.getUniformLocation(prog, n)])
  )
  gl.enable(gl.BLEND)
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA) // premultiplied output
  gl.clearColor(0, 0, 0, 0)

  const blots: Blot[] = []
  let raf = 0
  let dpr = 1

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    canvas.width = Math.round(window.innerWidth * dpr)
    canvas.height = Math.round(window.innerHeight * dpr)
    schedule()
  }

  function schedule() {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  /** Adds the per-blot buffers and a fresh random seed. */
  function blank(b: Omit<Blot, 'seed' | 'seg' | 'rad'>): Blot {
    return {
      ...b,
      seed: 1 + Math.random() * 40,
      seg: new Float32Array(SEGMENTS * 4),
      rad: new Float32Array(SEGMENTS * 2),
    }
  }

  function frame(now: number) {
    raf = 0
    for (let i = blots.length - 1; i >= 0; i--) {
      const b = blots[i]
      const gone =
        b.kind === 'click'
          ? now - b.t > CLICK_HOLD_MS + CLICK_FADE_MS
          : b.released > 0 && now - b.released > POOL_DRY_MS
      if (gone) blots.splice(i, 1)
    }

    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    let busy = false
    const vw = window.innerWidth
    const vh = window.innerHeight

    for (const b of blots) {
      let ts: number
      let blotR: number
      let fade: number
      if (b.kind === 'click') {
        const age = now - b.t
        ts = age / 1000
        // same timing as the hero: the hit, then a slow creep
        blotR = (1 - Math.exp(-ts * 30)) * (1 + 0.14 * (1 - Math.exp(-ts * 1.1)))
        fade = age < CLICK_HOLD_MS ? 1 : 1 - Math.min(1, (age - CLICK_HOLD_MS) / CLICK_FADE_MS)
        busy = true
      } else {
        // growth freezes when the brush leaves; after that it only dries
        const clock = b.released ? Math.min(now, b.released) : now
        ts = (clock - b.t) / 1000
        blotR = 1 - Math.exp(-ts / POOL_GATHER_S)
        fade = b.released ? 1 - Math.min(1, (now - b.released) / POOL_DRY_MS) : 1
        if (b.released || ts < b.settleS) busy = true
      }

      const half = b.reach * b.unit
      const [x, y] = screenPos(b)
      if (x + half < 0 || x - half > vw || y + half < 0 || y - half > vh) continue // off screen

      updateSplash(b.parts, ts, b.reach, b.reach, b.r0, b.seg, b.rad)
      gl!.viewport(
        Math.round((x - half) * dpr),
        Math.round(canvas.height - (y + half) * dpr), // GL origin is bottom-left
        Math.round(half * 2 * dpr),
        Math.round(half * 2 * dpr)
      )
      gl!.uniform1f(U.uScale, b.reach * 2)
      gl!.uniform1f(U.uR0, b.r0)
      gl!.uniform1f(U.uBlotR, blotR)
      gl!.uniform1f(U.uT, ts)
      gl!.uniform1f(U.uSeed, b.seed)
      gl!.uniform1f(U.uFade, fade * b.tone.alpha)
      gl!.uniform1f(U.uDust, b.kind === 'click' ? 1 : 0)
      gl!.uniform3fv(U.uDense, b.tone.dense)
      gl!.uniform3fv(U.uThin, b.tone.thin)
      gl!.uniform4fv(U.uSeg, b.seg)
      gl!.uniform2fv(U.uRad, b.rad)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    }

    // A settled resting pool is simply left on the canvas until something changes.
    if (busy) schedule()
  }

  /** The element a blot sticks to: the ink surface under it, else whatever is there. */
  function anchorAt(x: number, y: number) {
    const el = document.elementFromPoint(x, y)
    const anchor = el?.closest('[data-ink-surface]') ?? el
    if (!anchor) return { anchor: null, x: x + window.scrollX, y: y + window.scrollY }
    const r = anchor.getBoundingClientRect()
    return { anchor, x: x - r.left, y: y - r.top }
  }

  function screenPos(b: Blot): [number, number] {
    if (b.anchor?.isConnected) {
      const r = b.anchor.getBoundingClientRect()
      return [r.left + b.x, r.top + b.y]
    }
    return [b.x - window.scrollX, b.y - window.scrollY]
  }

  function release() {
    const now = performance.now()
    let changed = false
    for (const b of blots) {
      if (b.kind === 'pool' && !b.released) {
        b.released = now
        changed = true
      }
    }
    if (changed) schedule()
  }

  resize()

  return {
    hit(x, y, paper) {
      const unit = inkUnit() * CLICK_SCALE
      blots.push(
        blank({
          kind: 'click',
          ...anchorAt(x, y),
          t: performance.now(),
          unit,
          r0: R0,
          reach: CLICK_REACH,
          parts: makeSplash(R0),
          tone: paper ? TONES.paper : TONES.dark,
          settleS: 0,
          released: 0,
        })
      )
      if (blots.filter((b) => b.kind === 'click').length > 6) {
        blots.splice(
          blots.findIndex((b) => b.kind === 'click'),
          1
        )
      }
      schedule()
    },

    rest(x, y, paper) {
      release()
      // The shader works in painting heights (its noise, soft edges and halo
      // are tuned to them), so the pixel sizes are converted, not the shader.
      const unit = inkUnit()
      const r0 = POOL_RADIUS_PX / unit
      const parts = poolDrips(r0)
      const settleS =
        Math.max(...parts.map((p) => (p.kind === 'drip' ? p.delay + p.tau * 5 : 0))) +
        POOL_GATHER_S * 5
      blots.push(
        blank({
          kind: 'pool',
          ...anchorAt(x, y),
          t: performance.now(),
          unit,
          r0,
          reach: POOL_REACH_PX / unit,
          parts,
          settleS,
          tone: paper ? TONES.paper : TONES.dark,
          released: 0,
        })
      )
      schedule()
    },

    release,
    scrolled() {
      release()
      schedule()
    },
    resize,
    destroy() {
      cancelAnimationFrame(raf)
      raf = 0
      blots.length = 0
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
