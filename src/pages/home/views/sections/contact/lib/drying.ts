import VERT from '../shaders/drying.vert.glsl?raw'
import FRAG from '../shaders/drying.frag.glsl?raw'

/**
 * The drying sheet behind the letter: a full-section canvas where the paper
 * comes up soaked and dries from its edges in as the section is scrolled. It
 * reports how dry it is, so the text on it can settle at the same pace.
 */
export interface Drying {
  destroy(): void
}

export interface DryingParts {
  /** The section, which the canvas covers. */
  root: HTMLElement
  canvas: HTMLCanvasElement
}

const UNIFORMS = ['uRes', 'uDry', 'uDpr'] as const
type UniformName = (typeof UNIFORMS)[number]

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
  }
  return shader
}

/** Returns null when WebGL is unavailable: the section then stays dry paper. */
export function mountDrying(
  { root, canvas }: DryingParts,
  onDry: (dry: number) => void
): Drying | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
  if (!gl) return null

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAG))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'program')
  }
  gl.useProgram(program)

  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = {} as Record<UniformName, WebGLUniformLocation | null>
  for (const name of UNIFORMS) u[name] = gl.getUniformLocation(program, name)

  const still = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
  let frame = 0
  let dry = still ? 1 : 0
  let reported = false

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
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform1f(u.uDry, dry)
    gl.uniform1f(u.uDpr, dpr)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  // the sheet dries as it comes up: soaked as it enters, dry once it fills
  // the screen and the letter can be written on it
  const onScroll = () => {
    const top = root.getBoundingClientRect().top
    const t = Math.min(1, Math.max(0, (innerHeight * 0.95 - top) / (innerHeight * 0.95)))
    const next = still ? 1 : t * t * (3 - 2 * t)
    if (reported && Math.abs(next - dry) < 0.003) return
    reported = true
    dry = next
    onDry(dry)
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
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
