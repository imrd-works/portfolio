import FRAG from '../shaders/bloom.frag.glsl?raw'
import { createQuad } from './quad'
import { drawingRatio } from '@/shared/lib/graphics'

/**
 * A painting (ink on transparency) drawn onto a canvas the way the hero's
 * valley is drawn: `draw(p)` shows it `p` of the way through the bloom.
 */
export interface Bloom {
  /** Sizes the canvas to its box on the page; call when that box changes. */
  resize(): void
  draw(p: number): void
  destroy(): void
}

/** Where the bloom runs from and to, as in the hero (scene.ts P0 / P_END). */
export const BLOOM_START = 0.035
export const BLOOM_END = 1.5

const UNIFORMS = ['uTex', 'uRes', 'uFrom', 'uP', 'uAspect'] as const

/** Returns null when WebGL is unavailable: the picture stays as it is. */
export function createBloom(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  from: { x: number; y: number }
): Bloom | null {
  const quad = createQuad(canvas, FRAG, UNIFORMS, { alpha: true, premultipliedAlpha: true })
  if (!quad) return null
  const { gl, u } = quad

  // a power-of-two copy, so the ink can be sampled soft through mipmaps
  const sheet = document.createElement('canvas')
  sheet.width = 1024
  sheet.height = 1024
  sheet.getContext('2d')!.drawImage(img, 0, 0, sheet.width, sheet.height)
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
  gl.uniform2f(u.uFrom, from.x, 1 - from.y)

  let p = -0.1

  const bloom: Bloom = {
    resize() {
      const dpr = drawingRatio()
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      if (!w || !h) return
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      gl.uniform2f(u.uRes, canvas.width, canvas.height)
      gl.uniform1f(u.uAspect, w / h)
      bloom.draw(p)
    },
    draw(next) {
      p = next
      gl.uniform1f(u.uP, p)
      quad.draw()
    },
    destroy() {
      gl.deleteTexture(texture)
      quad.dispose()
    },
  }
  bloom.resize()
  return bloom
}
