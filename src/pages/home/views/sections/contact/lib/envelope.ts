import FRAG from '../shaders/envelope.frag.glsl?raw'
import { createQuad } from './quad'

/**
 * The envelope, drawn onto the letter the way the hero's painting is drawn:
 * a drop of ink falls onto the apex of the V and the envelope blooms out of
 * the blot on wet paper; then a drop of cinnabar falls on the same spot and
 * spreads into the seal. `settle` shows the end state at once.
 */
export interface EnvelopeScene {
  play(): void
  settle(): void
  destroy(): void
}

export interface EnvelopeParts {
  /** Covers the envelope's box. */
  canvas: HTMLCanvasElement
  /** The ink drop and the cinnabar drop, parked on the apex. */
  inkDrop: HTMLElement
  sunDrop: HTMLElement
  /** The three layers of the painted envelope, drawn as one. */
  layers: string[]
}

export interface EnvelopeHooks {
  /** The cinnabar has spread: time for the initials to come up in it. */
  sealed(): void
}

/** Where the V meets, as a share of the envelope's box from its top left. */
export const APEX = { x: 0.473, y: 0.571 } as const

const UNIFORMS = [
  'uTex',
  'uRes',
  'uAspect',
  'uBlot',
  'uMaxD',
  'uP',
  'uT',
  'uBlotR',
  'uR0',
  'uSunT',
  'uSunR',
] as const

// the hero's timings, for a painting a third of its size
const INK_FALL_MS = 700
const REVEAL_MS = 3400
// ahead of the hero's start: the envelope comes out of the blot the moment it lands
const P0 = 0.24
const P_END = 1.5
const SUN_AT_MS = 1500 // after the ink hit
const SUN_FALL_MS = 600
const SEALED_AT_MS = 800 // after the cinnabar hit
// blot radius, share of the envelope's height: small, a hit rather than a pool
const R0 = 0.028
const SUN_R = 0.125 // seal radius, same unit
const easeSpread = (t: number) => 1 - Math.pow(1 - t, 1.55)

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })

/** Resolves to null when WebGL is unavailable: the flat envelope stays. */
export async function mountEnvelope(
  { canvas, inkDrop, sunDrop, layers }: EnvelopeParts,
  hooks: EnvelopeHooks
): Promise<EnvelopeScene | null> {
  const images = await Promise.all(layers.map(load))
  const quad = createQuad(canvas, FRAG, UNIFORMS, { alpha: true, premultipliedAlpha: true })
  if (!quad) return null
  const { gl, u } = quad

  // one power-of-two sheet, so the ink can be sampled soft through mipmaps
  const sheet = document.createElement('canvas')
  sheet.width = 1024
  sheet.height = 512
  const g = sheet.getContext('2d')!
  for (const img of images) g.drawImage(img, 0, 0, sheet.width, sheet.height)
  const texture = gl.createTexture()
  gl.activeTexture(gl.TEXTURE0)
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, sheet)
  gl.generateMipmap(gl.TEXTURE_2D)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.uniform1i(u.uTex, 0)

  let raf = 0
  let inkAt = 0
  let sunAt = 0
  const timers: number[] = []
  const falls: Animation[] = []

  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    const aspect = w / h
    const bx = APEX.x * aspect
    const by = 1 - APEX.y
    const far = Math.max(
      Math.hypot(bx, by),
      Math.hypot(aspect - bx, by),
      Math.hypot(bx, 1 - by),
      Math.hypot(aspect - bx, 1 - by)
    )
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uAspect, aspect)
    gl.uniform2f(u.uBlot, APEX.x, 1 - APEX.y)
    gl.uniform1f(u.uMaxD, far)
    gl.uniform1f(u.uR0, R0)
    gl.uniform1f(u.uSunR, SUN_R)
    return h
  }
  let height = size()

  /** The scene `ts` seconds after the ink hit, `ss` after the cinnabar hit. */
  const draw = (ts: number, ss: number) => {
    const tr = ts / (REVEAL_MS / 1000)
    gl.uniform1f(u.uP, ts < 0 ? -0.1 : P0 + (P_END - P0) * easeSpread(Math.min(1, tr)))
    gl.uniform1f(u.uT, ts)
    gl.uniform1f(
      u.uBlotR,
      ts < 0 ? 0 : (1 - Math.exp(-ts * 30)) * (1 + 0.14 * (1 - Math.exp(-ts * 1.1)))
    )
    gl.uniform1f(u.uSunT, ss)
    quad.draw()
  }
  draw(-1, -1)

  const tick = (now: number) => {
    const ts = inkAt ? (now - inkAt) / 1000 : -1
    const ss = sunAt ? (now - sunAt) / 1000 : -1
    draw(ts, ss)
    const done = ts > REVEAL_MS / 1000 + 0.5 && ss > 4
    raf = done ? 0 : requestAnimationFrame(tick)
  }

  /** A drop leaves the brush above the apex, stretches as it falls, and is gone on the hit. */
  const fall = (el: HTMLElement, ms: number, onHit: () => void) => {
    el.style.opacity = '1'
    const from = -height * 0.62
    const anim = el.animate(
      [
        { transform: `translateY(${from}px) scale(.1, .1)`, offset: 0, easing: 'ease-out' },
        {
          transform: `translateY(${from + 14}px) scale(1, 1.15)`,
          offset: 0.5,
          easing: 'cubic-bezier(.6,0,1,.6)',
        },
        { transform: 'translateY(0) scale(.8, 2.3)', offset: 1 },
      ],
      { duration: ms, fill: 'forwards' }
    )
    falls.push(anim)
    anim.onfinish = () => {
      el.style.opacity = '0'
      onHit()
    }
  }

  const onResize = () => {
    height = size()
    if (!raf) draw(inkAt ? 99 : -1, sunAt ? 99 : -1)
  }
  addEventListener('resize', onResize)

  return {
    play() {
      fall(inkDrop, INK_FALL_MS, () => {
        inkAt = performance.now()
        if (!raf) raf = requestAnimationFrame(tick)
        timers.push(
          window.setTimeout(
            () =>
              fall(sunDrop, SUN_FALL_MS, () => {
                sunAt = performance.now()
                timers.push(window.setTimeout(hooks.sealed, SEALED_AT_MS))
              }),
            SUN_AT_MS - SUN_FALL_MS
          )
        )
      })
    },
    settle() {
      inkAt = sunAt = 1
      draw(99, 99)
      hooks.sealed()
    },
    destroy() {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
      falls.forEach((a) => a.cancel())
      removeEventListener('resize', onResize)
      gl.deleteTexture(texture)
      quad.dispose()
    },
  }
}
