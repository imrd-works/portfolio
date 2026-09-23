import VERT from '../shaders/quad.vert.glsl?raw'

/**
 * A fragment shader over the whole canvas: the one piece of WebGL both the
 * drying sheet and the seal need. Throws if the shader does not compile.
 */
export interface Quad<U extends string> {
  gl: WebGLRenderingContext
  u: Record<U, WebGLUniformLocation | null>
  draw(): void
  dispose(): void
}

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, src)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? 'shader')
  }
  return shader
}

/** Returns null when WebGL is unavailable. */
export function createQuad<U extends string>(
  canvas: HTMLCanvasElement,
  frag: string,
  uniforms: readonly U[],
  options: WebGLContextAttributes = {}
): Quad<U> | null {
  const gl = canvas.getContext('webgl', { antialias: false, ...options })
  if (!gl) return null

  const program = gl.createProgram()!
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERT))
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? 'program')
  }
  gl.useProgram(program)

  // one triangle that covers the canvas
  const buffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const aPos = gl.getAttribLocation(program, 'aPos')
  gl.enableVertexAttribArray(aPos)
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

  const u = {} as Record<U, WebGLUniformLocation | null>
  for (const name of uniforms) u[name] = gl.getUniformLocation(program, name)

  return {
    gl,
    u,
    draw() {
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    },
    dispose() {
      gl.getExtension('WEBGL_lose_context')?.loseContext()
    },
  }
}
