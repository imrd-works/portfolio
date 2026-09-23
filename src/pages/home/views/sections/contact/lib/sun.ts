import FRAG from '../shaders/sun.frag.glsl?raw'
import { createQuad } from './quad'

/**
 * The seal that closes the envelope, landing the way the hero's sun lands: a
 * drop of cinnabar spreads on the paper into a disc. `play` runs the bloom
 * from the moment of impact; `settle` shows it already spread.
 */
export interface SunSeal {
  play(): void
  settle(): void
  destroy(): void
}

const UNIFORMS = ['uRes', 'uT'] as const
// the hero lets its sun spread over five seconds; a seal is pressed faster
const PACE = 1.8
const DONE = 3

/** Returns null when WebGL is unavailable: the css seal stays in its place. */
export function mountSun(canvas: HTMLCanvasElement, size: number): SunSeal | null {
  const quad = createQuad(canvas, FRAG, UNIFORMS, { alpha: true, premultipliedAlpha: true })
  if (!quad) return null
  const { gl, u } = quad

  const dpr = Math.min(devicePixelRatio || 1, 2)
  canvas.width = canvas.height = Math.round(size * dpr)
  let frame = 0

  const draw = (t: number) => {
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uT, t)
    quad.draw()
  }
  draw(-1)

  return {
    play() {
      cancelAnimationFrame(frame)
      const start = performance.now()
      const tick = (now: number) => {
        const t = ((now - start) / 1000) * PACE
        draw(Math.min(t, DONE))
        if (t < DONE) frame = requestAnimationFrame(tick)
      }
      frame = requestAnimationFrame(tick)
    },
    settle() {
      cancelAnimationFrame(frame)
      draw(DONE)
    },
    destroy() {
      cancelAnimationFrame(frame)
      quad.dispose()
    },
  }
}
