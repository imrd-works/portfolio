import FRAG from '../shaders/drying.frag.glsl?raw'
import { createQuad } from './quad'

/**
 * The drying sheet behind the letter: a full-section canvas of old, yellowed
 * paper that dries from its edges in as the section is scrolled, a web of age
 * growing over it as it goes.
 */
export interface Drying {
  destroy(): void
}

export interface DryingParts {
  /** The section, which the canvas covers. */
  root: HTMLElement
  canvas: HTMLCanvasElement
}

const UNIFORMS = ['uRes', 'uDry', 'uDpr', 'uSeed'] as const

/** Returns null when WebGL is unavailable: the section then stays dry paper. */
export function mountDrying({ root, canvas }: DryingParts): Drying | null {
  const quad = createQuad(canvas, FRAG, UNIFORMS, { alpha: false })
  if (!quad) return null
  const { gl, u } = quad

  const still = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  let frame = 0
  let dry = still ? 1 : 0
  let started = false
  // the web of age grows from different spots on every visit
  const seed = Math.random() * 97

  const draw = () => {
    frame = 0
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const width = root.clientWidth
    const height = root.clientHeight
    if (!width || !height) return
    if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    }
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uDry, dry)
    gl.uniform1f(u.uDpr, dpr)
    gl.uniform1f(u.uSeed, seed)
    quad.draw()
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  // the sheet dries as it comes up: the web starts as it enters and is
  // grown by the time it fills the screen
  const onScroll = () => {
    const top = root.getBoundingClientRect().top
    const t = Math.min(1, Math.max(0, (innerHeight * 0.95 - top) / (innerHeight * 0.95)))
    const next = still ? 1 : t * t * (3 - 2 * t)
    if (started && Math.abs(next - dry) < 0.003) return
    started = true
    dry = next
    schedule()
  }

  onScroll()
  draw()
  addEventListener('scroll', onScroll, { passive: true })
  addEventListener('resize', schedule)

  return {
    destroy() {
      removeEventListener('scroll', onScroll)
      removeEventListener('resize', schedule)
      if (frame) cancelAnimationFrame(frame)
      quad.dispose()
    },
  }
}
