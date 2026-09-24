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

  // The sheet is drawn taller than the section and pinned to its top, so when
  // the section grows — the stack shelf opens in the letter, the envelope
  // takes its place — the paper does not move: more of the same sheet shows.
  // It is only drawn again when the width changes or the section outgrows it.
  const SPARE = 900 // px of paper below the section
  let drawnW = 0
  let drawnH = 0

  const draw = () => {
    frame = 0
    const dpr = Math.min(devicePixelRatio || 1, 2)
    const width = root.clientWidth
    const height = root.clientHeight
    if (!width || !height) return
    if (width === drawnW && height <= drawnH) return
    drawnW = width
    drawnH = height + SPARE
    canvas.style.height = `${drawnH}px`
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(drawnH * dpr)
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uDpr, dpr)
    gl.uniform1f(u.uSeed, seed)
    quad.draw()
  }

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
