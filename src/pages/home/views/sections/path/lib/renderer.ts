import VERT from '../shaders/river.vert.glsl?raw'
import FRAG from '../shaders/river.frag.glsl?raw'

export interface RiverFrame {
  /** The painting in the canvas, css px. */
  rect: { left: number; top: number; width: number; height: number }
  /** How far the ink has run, and how far the paper has dried behind it (0..1 along the river). */
  head: number
  dry: number
}

export interface RiverRenderer {
  loadTextures(ink: HTMLImageElement, flow: HTMLImageElement): void
  /** Canvas size, css px. */
  resize(width: number, height: number, dpr: number): void
  draw(f: RiverFrame): void
  dispose(): void
}

const UNIFORMS = ['uInk', 'uFlow', 'uRect', 'uView', 'uDpr', 'uHead', 'uDry', 'uAspect'] as const
type UniformName = (typeof UNIFORMS)[number]

/** Returns null when WebGL is unavailable; throws if the shaders fail to compile. */
export function createRiverRenderer(canvas: HTMLCanvasElement): RiverRenderer | null {
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog) ?? '')
  gl.useProgram(prog)

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const U = {} as Record<UniformName, WebGLUniformLocation | null>
  for (const n of UNIFORMS) U[n] = gl.getUniformLocation(prog, n)
  gl.clearColor(0, 0, 0, 0)

  let ready = false
  let cssW = 1
  let cssH = 1
  let dpr = 1

  // The maps are data, not colour: no premultiplication, no colour conversion.
  const bind = (unit: number) => {
    const tex = gl.createTexture()
    gl.activeTexture(gl.TEXTURE0 + unit)
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  }

  return {
    loadTextures(ink, flow) {
      // The wet look samples the ink blurred, which needs mipmaps, which WebGL1
      // only makes for power-of-two textures: the ink is redrawn onto one.
      const big = gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096
      const c = document.createElement('canvas')
      c.width = big ? 2048 : 1024
      c.height = big ? 4096 : 2048
      c.getContext('2d')!.drawImage(ink, 0, 0, c.width, c.height)
      bind(0)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      bind(1)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, flow)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.uniform1i(U.uInk, 0)
      gl.uniform1i(U.uFlow, 1)
      gl.uniform1f(U.uAspect, ink.naturalHeight / ink.naturalWidth)
      ready = true
    },

    resize(width, height, ratio) {
      cssW = width
      cssH = height
      dpr = ratio
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
    },

    draw(f) {
      gl.clear(gl.COLOR_BUFFER_BIT)
      if (!ready) return
      gl.uniform4f(U.uRect, f.rect.left, f.rect.top, f.rect.width, f.rect.height)
      gl.uniform2f(U.uView, cssW, cssH)
      gl.uniform1f(U.uDpr, dpr)
      gl.uniform1f(U.uHead, f.head)
      gl.uniform1f(U.uDry, f.dry)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },

    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
