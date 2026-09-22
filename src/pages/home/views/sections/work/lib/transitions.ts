/**
 * The "Work" section's way into a painting and back, outside of Vue:
 *
 * - `ripple`: the clicked picture ripples like water from the touch point
 *   (an SVG displacement filter whose rings grow out of that point);
 * - `bleed`: clean wet paper spreads over the page from the same point, with
 *   tongues along the fibres and a tide line, and draws back on the way out;
 * - `painting`: the project's painting appears on that paper the way the hero
 *   blooms — soft and spread while wet, then drying into the drawing.
 *
 * Ported from the scroll3d prototype (works.html).
 */
import VERT from '../shaders/quad.vert.glsl?raw'
import BLEED_FRAG from '../shaders/bleed.frag.glsl?raw'
import PAINTING_FRAG from '../shaders/painting.frag.glsl?raw'

/** --work-paper, as linear 0..1 RGB for the shaders. */
const PAPER: [number, number, number] = [0.925, 0.91, 0.882]

/* ---------------- ripple ---------------- */

export interface RippleFilter {
  image: SVGFEImageElement
  move: SVGFEDisplacementMapElement
  blur: SVGFEGaussianBlurElement
}

/** Concentric rings as a displacement map (R/G: the push outwards). */
export function rippleMap(): string {
  const N = 256
  const c = document.createElement('canvas')
  c.width = c.height = N
  const g = c.getContext('2d')!
  const im = g.createImageData(N, N)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const dx = x - N / 2
      const dy = y - N / 2
      const len = Math.hypot(dx, dy) || 1
      const r = len / (N / 2)
      const w = r < 1 ? Math.sin(r * Math.PI * 7) * Math.pow(1 - r, 1.2) * Math.min(1, r * 6) : 0
      const i = (y * N + x) * 4
      im.data[i] = 128 + 127 * w * (dx / len)
      im.data[i + 1] = 128 + 127 * w * (dy / len)
      im.data[i + 2] = 128
      im.data[i + 3] = 255
    }
  }
  g.putImageData(im, 0, 0)
  return c.toDataURL()
}

/**
 * Ripples `el` from (x, y) in its own px; `settle` plays it backwards and
 * leaves the element clean. Only one picture ripples at a time (one filter).
 */
export function ripple(
  f: RippleFilter,
  el: HTMLElement,
  x: number,
  y: number,
  { ms = 800, settle = false } = {}
): Promise<void> {
  const r = el.getBoundingClientRect()
  el.style.filter = 'url(#work-ripple)'
  const reach = Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y)) * 1.3
  const t0 = performance.now()
  return new Promise((done) => {
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / ms)
      const k = settle ? 1 - t : t
      const R = 20 + reach * (1 - Math.pow(1 - k, 2))
      f.image.setAttribute('x', String(x - R))
      f.image.setAttribute('y', String(y - R))
      f.image.setAttribute('width', String(2 * R))
      f.image.setAttribute('height', String(2 * R))
      f.move.setAttribute('scale', String(70 * Math.sin(Math.min(1, k * 1.4) * Math.PI * 0.5)))
      f.blur.setAttribute('stdDeviation', String(6 * k * k))
      el.style.opacity = String(1 - 0.55 * k * k)
      if (t < 1) requestAnimationFrame(step)
      else {
        if (settle) {
          el.style.filter = ''
          el.style.opacity = ''
        }
        done()
      }
    }
    requestAnimationFrame(step)
  })
}

/* ---------------- WebGL helpers ---------------- */

function program(gl: WebGLRenderingContext, frag: string) {
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!
    gl.shaderSource(s, src)
    gl.compileShader(s)
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? '')
    return s
  }
  const prog = gl.createProgram()!
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(gl.getProgramInfoLog(prog) ?? '')
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
  gl.clearColor(0, 0, 0, 0)
  return (name: string) => gl.getUniformLocation(prog, name)
}

const dprOf = () => Math.min(window.devicePixelRatio || 1, 2)

/* ---------------- bleed ---------------- */

export interface Bleed {
  /**
   * Spreads the paper from (x, y) (css px on screen): radius from `from` to
   * `to` (0..1 of what covers the screen). Resolves at `doneAt` of the time,
   * so the next step can start while the water still settles.
   */
  run(x: number, y: number, from: number, to: number, ms: number, doneAt?: number): Promise<void>
}

export function createBleed(canvas: HTMLCanvasElement): Bleed | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true })
  if (!gl) return null
  const u = program(gl, BLEED_FRAG)
  const U = { res: u('uRes'), c: u('uC'), r: u('uR'), dpr: u('uDpr'), paper: u('uPaper') }
  gl.uniform3f(U.paper, ...PAPER)
  return {
    run(x, y, from, to, ms, doneAt = 1) {
      const dpr = dprOf()
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(U.res, canvas.width, canvas.height)
      gl.uniform2f(U.c, x, y)
      gl.uniform1f(U.dpr, dpr)
      // far enough that even the slowest tongue has covered the far corner
      const full =
        Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) * 1.45 +
        60
      const t0 = performance.now()
      return new Promise((done) => {
        let resolved = false
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms)
          // water spreads fast and slows as it soaks in; drawing back is even
          const e = to > from ? 1 - Math.pow(1 - t, 1.5) : t * t * (3 - 2 * t)
          gl.clear(gl.COLOR_BUFFER_BIT)
          gl.uniform1f(U.r, full * (from + (to - from) * e))
          gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
          if (!resolved && t >= doneAt) {
            resolved = true
            done()
          }
          if (t < 1) requestAnimationFrame(step)
        }
        requestAnimationFrame(step)
      })
    },
  }
}

/* ---------------- the painting on wet paper ---------------- */

export interface Painting {
  load(img: HTMLImageElement): void
  /** Reveal progress: -0.1 blank .. 1.45 drawn and dry; `from` is where the ink starts (0..1, y up). */
  set(p: number, from?: [number, number]): void
  get(): number
  /** Runs the ink to `to`; a new run cancels the previous one. */
  to(to: number, ms: number): Promise<void>
  fit(): void
  clear(): void
}

export function createPainting(canvas: HTMLCanvasElement): Painting | null {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true })
  if (!gl) return null
  const u = program(gl, PAINTING_FRAG)
  const U = {
    tex: u('uTex'),
    res: u('uRes'),
    scale: u('uScale'),
    off: u('uOff'),
    from: u('uFrom'),
    p: u('uP'),
    aspect: u('uAspect'),
  }
  const tex = gl.createTexture()
  let imgAspect = 2 / 3
  let p = -0.1
  let from: [number, number] = [0.55, 0.5]
  let ready = false
  let raf = 0

  function fit() {
    const w = canvas.clientWidth
    const h = canvas.clientHeight
    if (!w || !h) return
    const dpr = dprOf()
    canvas.width = Math.round(w * dpr)
    canvas.height = Math.round(h * dpr)
    gl!.viewport(0, 0, canvas.width, canvas.height)
    gl!.uniform2f(U.res, canvas.width, canvas.height)
    const A = w / h
    gl!.uniform1f(U.aspect, A)
    // cover, framed a little above the centre
    if (A > imgAspect) {
      const k = imgAspect / A
      gl!.uniform2f(U.scale, 1, k)
      gl!.uniform2f(U.off, 0, (1 - k) * 0.55)
    } else {
      const k = A / imgAspect
      gl!.uniform2f(U.scale, k, 1)
      gl!.uniform2f(U.off, (1 - k) * 0.5, 0)
    }
  }
  function draw() {
    gl!.clear(gl!.COLOR_BUFFER_BIT)
    if (!ready) return
    gl!.uniform1f(U.p, p)
    gl!.uniform2f(U.from, from[0], from[1])
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
  }

  return {
    load(img) {
      // the wet look samples the painting blurred: mipmaps need a power-of-two texture
      const c = document.createElement('canvas')
      c.width = 1024
      c.height = 2048
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      gl.bindTexture(gl.TEXTURE_2D, tex)
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
      gl.generateMipmap(gl.TEXTURE_2D)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
      gl.uniform1i(U.tex, 0)
      imgAspect = img.naturalWidth / img.naturalHeight
      ready = true
      fit()
    },
    set(v, at) {
      p = v
      if (at) from = at
      draw()
    },
    get: () => p,
    to(target, ms) {
      cancelAnimationFrame(raf)
      const start = p
      const t0 = performance.now()
      return new Promise((done) => {
        const step = (now: number) => {
          const t = Math.min(1, (now - t0) / ms)
          const e = target > start ? 1 - Math.pow(1 - t, 1.6) : 1 - Math.pow(1 - t, 1.4)
          p = start + (target - start) * e
          draw()
          if (t < 1) raf = requestAnimationFrame(step)
          else done()
        }
        raf = requestAnimationFrame(step)
      })
    },
    fit() {
      fit()
      draw()
    },
    clear() {
      cancelAnimationFrame(raf)
      ready = false
      draw()
    },
  }
}

const images = new Map<string, Promise<HTMLImageElement>>()
/** The painting as an <img>, loaded once. */
export function loadImage(src: string): Promise<HTMLImageElement> {
  let img = images.get(src)
  if (!img) {
    img = new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = src
    })
    images.set(src, img)
  }
  return img
}
