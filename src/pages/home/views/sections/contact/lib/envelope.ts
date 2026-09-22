/**
 * The envelope the letter is folded into, painted rather than marked up: a
 * stroke is a filled ribbon whose width swells in the belly and tapers at
 * both ends, so every line has a landing, a body and a lift-off — the same
 * brush that draws the prints in the Path section.
 */
const INK = [16, 18, 20] as const

type Point = [number, number]

function prng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A quadratic curve, so a stroke bends the way a wrist does. */
function curve(a: Point, b: Point, bend: Point, steps: number, rnd: () => number): Point[] {
  const mx = (a[0] + b[0]) / 2 + bend[0]
  const my = (a[1] + b[1]) / 2 + bend[1]
  const pts: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const k = 1 - t
    pts.push([
      k * k * a[0] + 2 * k * t * mx + t * t * b[0] + (rnd() - 0.5) * 0.7,
      k * k * a[1] + 2 * k * t * my + t * t * b[1] + (rnd() - 0.5) * 0.7,
    ])
  }
  return pts
}

/** Fill the ribbon: the brush lands over `head`, presses, lifts over `tail`. */
function brush(g: CanvasRenderingContext2D, pts: Point[], w: number, head = 0.22, tail = 0.3) {
  const n = pts.length - 1
  const left: Point[] = []
  const right: Point[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const swell =
      t < head ? Math.pow(t / head, 0.7) : t > 1 - tail ? Math.pow((1 - t) / tail, 0.9) : 1
    const half = (w * (0.55 + 0.45 * swell)) / 2
    const p = pts[i]
    const q = pts[Math.min(i + 1, n)]
    const o = pts[Math.max(i - 1, 0)]
    const len = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1
    const nx = -(q[1] - o[1]) / len
    const ny = (q[0] - o[0]) / len
    left.push([p[0] + nx * half, p[1] + ny * half])
    right.push([p[0] - nx * half, p[1] - ny * half])
  }
  g.beginPath()
  g.moveTo(left[0][0], left[0][1])
  for (const [x, y] of left.slice(1)) g.lineTo(x, y)
  for (const [x, y] of right.reverse()) g.lineTo(x, y)
  g.closePath()
  g.fill()
}

/** Ink is not flat: break the alpha up so the line reads as absorbed. */
function soak(canvas: HTMLCanvasElement, seed: number) {
  const g = canvas.getContext('2d')!
  const im = g.getImageData(0, 0, canvas.width, canvas.height)
  const d = im.data
  const rnd = prng(seed)
  const nz = (x: number, y: number) =>
    Math.sin(x * 0.19 + seed) * Math.sin(y * 0.13 - seed) * 0.5 +
    Math.sin(x * 0.05 + y * 0.04) * 0.5
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3]) continue
    const x = (i / 4) % canvas.width
    const y = Math.floor(i / 4 / canvas.width)
    const body = 0.82 + 0.16 * nz(x, y) + (rnd() - 0.5) * 0.1
    d[i] = INK[0]
    d[i + 1] = INK[1]
    d[i + 2] = INK[2]
    d[i + 3] = Math.round(Math.min(1, (d[i + 3] / 255) * body) * 255)
  }
  g.putImageData(im, 0, 0)
}

function sheet(width: number, height: number, dpr: number) {
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const g = canvas.getContext('2d')!
  g.scale(dpr, dpr)
  g.fillStyle = `rgb(${INK.join(',')})`
  g.filter = 'blur(.35px)'
  return { canvas, g }
}

export const ENVELOPE = { width: 420, height: 236, flap: 128 }

/** The back of the envelope: four sides and the folds that meet in the middle. */
export function envelopeBody(dpr: number): HTMLCanvasElement {
  const { canvas, g } = sheet(ENVELOPE.width, ENVELOPE.height + 12, dpr)
  const rnd = prng(31)
  brush(g, curve([14, 14], [406, 11], [0, -3.5], 60, rnd), 3.4)
  brush(g, curve([406, 12], [409, 224], [3, 0], 50, rnd), 3.1)
  brush(g, curve([408, 225], [12, 229], [0, 4], 60, rnd), 3.6)
  brush(g, curve([13, 228], [14, 15], [-3.5, 0], 50, rnd), 3.1)
  brush(g, curve([15, 226], [210, 120], [6, 4], 40, rnd), 2.1)
  brush(g, curve([406, 222], [211, 120], [-6, 4], 40, rnd), 2.1)
  soak(canvas, 31)
  return canvas
}

/** The flap: three strokes that come to a point over the middle. */
export function envelopeFlap(dpr: number): HTMLCanvasElement {
  const { canvas, g } = sheet(ENVELOPE.width, ENVELOPE.flap + 14, dpr)
  const rnd = prng(57)
  brush(g, curve([14, 12], [406, 9], [0, -4], 60, rnd), 3.4)
  brush(g, curve([406, 10], [212, ENVELOPE.flap + 4], [4, 5], 46, rnd), 3.0)
  brush(g, curve([211, ENVELOPE.flap + 5], [14, 13], [-4, 5], 46, rnd), 3.0)
  soak(canvas, 57)
  return canvas
}
