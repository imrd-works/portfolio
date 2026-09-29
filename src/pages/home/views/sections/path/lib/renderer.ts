import VERT from '../shaders/river.vert.glsl?raw'
import FRAG from '../shaders/river.frag.glsl?raw'

export interface RiverFrame {
  /** The painting in the canvas, css px. */
  rect: { left: number; top: number; width: number; height: number }
  /** How far the ink has run, and how far the paper has dried behind it (0..1 along the river). */
  head: number
  dry: number
  /** Seconds, for the current. */
  time: number
}

export interface RiverRenderer {
  loadTextures(ink: HTMLImageElement, flow: HTMLImageElement, water: HTMLImageElement): void
  /** Canvas size, css px. */
  resize(width: number, height: number, dpr: number): void
  draw(f: RiverFrame): void
  dispose(): void
}

const UNIFORMS = [
  'uInk',
  'uFlow',
  'uWater',
  'uRect',
  'uView',
  'uDpr',
  'uHead',
  'uDry',
  'uAspect',
  'uTime',
] as const
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
    loadTextures(ink, flow, water) {
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
      bind(2)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, water)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
      gl.uniform1i(U.uInk, 0)
      gl.uniform1i(U.uFlow, 1)
      gl.uniform1i(U.uWater, 2)
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
      gl.uniform1f(U.uTime, f.time)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },

    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

/**
 * The river without WebGL: the same painting in the same place, drawn with a plain 2D canvas,
 * already dry (no ink running down it, no current). The rest of the scene (the steps, the
 * wolverine's trail, the seal) does not know the difference. Null if even 2D is out.
 */
export function createFlatRiverRenderer(canvas: HTMLCanvasElement): RiverRenderer | null {
  const g = canvas.getContext('2d')
  if (!g) return null
  let painting: HTMLCanvasElement | null = null
  let dpr = 1

  return {
    loadTextures(ink) {
      // The ink map is a density (red: 0 paper, 1 black): laid once as ink of the shader's
      // colours on transparency, pale blue-grey where it thins, near black where it is dense.
      const c = document.createElement('canvas')
      const scale = Math.min(1, 1024 / ink.naturalWidth)
      c.width = Math.round(ink.naturalWidth * scale)
      c.height = Math.round(ink.naturalHeight * scale)
      const cg = c.getContext('2d', { willReadFrequently: true })!
      cg.drawImage(ink, 0, 0, c.width, c.height)
      const im = cg.getImageData(0, 0, c.width, c.height)
      const d = im.data
      for (let i = 0; i < d.length; i += 4) {
        const conc = Math.min(1, Math.max(0, (d[i] / 255 - 0.03) / 0.97))
        const k = Math.pow(conc, 0.7)
        d[i] = (0.21 + (0.035 - 0.21) * k) * 255
        d[i + 1] = (0.26 + (0.04 - 0.26) * k) * 255
        d[i + 2] = (0.35 + (0.05 - 0.35) * k) * 255
        d[i + 3] = conc * 255
      }
      cg.putImageData(im, 0, 0)
      painting = c
    },

    resize(width, height, ratio) {
      dpr = ratio
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
    },

    draw(f) {
      g.setTransform(1, 0, 0, 1, 0, 0)
      g.clearRect(0, 0, canvas.width, canvas.height)
      if (!painting) return
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.drawImage(painting, f.rect.left, f.rect.top, f.rect.width, f.rect.height)
    },

    dispose() {
      painting = null
    },
  }
}
