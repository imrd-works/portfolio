import VERT from '../shaders/hero.vert.glsl?raw'
import FRAG from '../shaders/hero.frag.glsl?raw'
import { SPLASH_SEGMENTS } from '../config'

/** Everything the fragment shader reads, in the prototype's units. */
export interface InkUniforms {
  /** Reveal progress. */
  p: number
  blotR: number
  aspect: number
  maxD: number
  blot: [number, number]
  /** Seconds since the impact. */
  t: number
  seed: number
  r0: number
  wet: number
  sunT: number
  sunR: number
  sun: [number, number]
  time: number
  fog: number
  fogSpeed: number
  fogLo: number
  fogHi: number
  seg: Float32Array
  rad: Float32Array
}

export interface InkRenderer {
  readonly canvas: HTMLCanvasElement
  loadTexture(source: CanvasImageSource): void
  draw(u: InkUniforms): void
  dispose(): void
}

const UNIFORMS = [
  'uTex',
  'uP',
  'uBlotR',
  'uAspect',
  'uMaxD',
  'uBlot',
  'uT',
  'uSeed',
  'uSeg',
  'uRad',
  'uR0',
  'uWet',
  'uSunT',
  'uSunR',
  'uSun',
  'uTime',
  'uFog',
  'uFogSpeed',
  'uFogLo',
  'uFogHi',
] as const

type UniformName = (typeof UNIFORMS)[number]

/** Returns null when WebGL is unavailable; throws if the shaders fail to compile. */
export function createInkRenderer(canvas: HTMLCanvasElement): InkRenderer | null {
  const gl = canvas.getContext('webgl', {
    premultipliedAlpha: true,
    alpha: true,
    antialias: false,
  })
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

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const U = {} as Record<UniformName, WebGLUniformLocation | null>
  for (const n of UNIFORMS) U[n] = gl.getUniformLocation(prog, n)
  gl.disable(gl.BLEND)
  gl.clearColor(0, 0, 0, 0)

  let texReady = false

  return {
    canvas,

    loadTexture(source) {
      // WebGL1 only mipmaps power-of-two textures, so the painting is redrawn
      // onto a 4096x2048 canvas (2048x1024 on weak GPUs); uv stay the same.
      const big = gl.getParameter(gl.MAX_TEXTURE_SIZE) >= 4096
      const c = document.createElement('canvas')
      c.width = big ? 4096 : 2048
      c.height = big ? 2048 : 1024
      c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height)
      const tex = gl.createTexture()
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform1i(U.uTex, 0)
      texReady = true
    },

    draw(u) {
      if (!texReady) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.uniform1f(U.uP, u.p)
      gl.uniform1f(U.uBlotR, u.blotR)
      gl.uniform1f(U.uAspect, u.aspect)
      gl.uniform1f(U.uMaxD, u.maxD)
      gl.uniform2f(U.uBlot, u.blot[0], u.blot[1])
      gl.uniform1f(U.uT, u.t)
      gl.uniform1f(U.uSeed, u.seed)
      gl.uniform1f(U.uR0, u.r0)
      gl.uniform1f(U.uWet, u.wet)
      gl.uniform1f(U.uSunT, u.sunT)
      gl.uniform1f(U.uSunR, u.sunR)
      gl.uniform1f(U.uTime, u.time)
      gl.uniform1f(U.uFog, u.fog)
      gl.uniform1f(U.uFogSpeed, u.fogSpeed)
      gl.uniform1f(U.uFogLo, u.fogLo)
      gl.uniform1f(U.uFogHi, u.fogHi)
      gl.uniform2f(U.uSun, u.sun[0], u.sun[1])
      gl.uniform4fv(U.uSeg, u.seg)
      gl.uniform2fv(U.uRad, u.rad)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    },

    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}

export const createSegmentBuffers = () => ({
  seg: new Float32Array(SPLASH_SEGMENTS * 4),
  rad: new Float32Array(SPLASH_SEGMENTS * 2),
})
