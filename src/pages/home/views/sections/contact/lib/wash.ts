import VERT from '../shaders/blot.vert.glsl?raw'
import FRAG from '../shaders/blot.frag.glsl?raw'

/**
 * The ink pool behind the letter: a full-section canvas where the paper of
 * the site shows through around the content and the ink runs out to the
 * edges as the section is scrolled into view.
 */
export interface Wash {
  destroy(): void
}

export interface WashParts {
  /** The section, which the canvas covers. */
  root: HTMLElement
  canvas: HTMLCanvasElement
  /** The block the water keeps clean: heading, letter and contacts. */
  area: HTMLElement
}

const UNIFORMS = ['uRes', 'uArea', 'uRadius', 'uSpread'] as const
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

/** Returns null when WebGL is unavailable: the section then stays plain paper. */
export function mountWash({ root, canvas, area }: WashParts): Wash | null {
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
  let spread = still ? 1 : 0

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

    const box = area.getBoundingClientRect()
    const host = root.getBoundingClientRect()
    // gl_FragCoord counts up from the bottom left, the DOM down from the top
    const cx = (box.left - host.left + box.width / 2) * dpr
    const cy = (host.bottom - box.bottom + box.height / 2) * dpr

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(u.uRes, canvas.width, canvas.height)
    gl.uniform4f(u.uArea, cx, cy, (box.width / 2 + 30) * dpr, (box.height / 2 + 26) * dpr)
    gl.uniform1f(u.uRadius, 120 * dpr)
    gl.uniform1f(u.uSpread, spread)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(draw)
  }

  // the ink runs as the section comes up: the page itself pours it
  const onScroll = () => {
    const host = root.getBoundingClientRect()
    const next = still
      ? 1
      : Math.min(1, Math.max(0, (innerHeight - host.top) / (innerHeight * 0.7)))
    if (Math.abs(next - spread) < 0.004 && spread > 0) return
    spread = next
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
