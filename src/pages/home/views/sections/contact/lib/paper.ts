import FRAG from '../shaders/paper.frag.glsl?raw'
import { createQuad } from '../../ink/lib/quad'

/**
 * The old sheet the letter is written on: a full-section canvas of yellowed
 * paper with a web of cracks. It is drawn once, and again when the section
 * changes size.
 */
export interface Paper {
  destroy(): void
}

const UNIFORMS = ['uRes', 'uDpr', 'uSeed'] as const

/** Returns null when WebGL is unavailable: the section keeps its css paper. */
export function mountPaper(root: HTMLElement, canvas: HTMLCanvasElement): Paper | null {
  const quad = createQuad(canvas, FRAG, UNIFORMS, { alpha: false })
  if (!quad) return null
  const { gl, u } = quad
  // the web of cracks runs differently on every visit
  const seed = Math.random() * 97
  let frame = 0

  const draw = () => {
    frame = 0
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const width = root.clientWidth
    const height = root.clientHeight
    if (!width || !height) return
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uDpr, dpr)
    gl.uniform1f(u.uSeed, seed)
    quad.draw()
  }

  // the section grows when the envelope replaces the letter, not only on resize
  const observer = new ResizeObserver(() => {
    if (!frame) frame = requestAnimationFrame(draw)
  })
  observer.observe(root)
  draw()

  return {
    destroy() {
      observer.disconnect()
      if (frame) cancelAnimationFrame(frame)
      quad.dispose()
    },
  }
}
