/**
 * A wolverine's front print, painted in cinnabar (the hero's sun): five toes on a wide arc (the
 * inner one smaller and set back), claw nicks ahead of them, a broad chevron
 * pad. The paint pools at the edges as it dries, and a faint wet halo soaks into
 * the paper around it. Drawn toes-up; the scene turns it to walk downstream.
 */
export interface PawSprite {
  canvas: HTMLCanvasElement
  /** Logical size, css px. */
  width: number
  height: number
}

// the hero's sun: vec3(.78, .22, .15) in hero.frag.glsl
export const CINNABAR = [199, 56, 38] as const
const FILL = `rgb(${CINNABAR.join(',')})`

function prng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const TOES = [
  { a: -152, R: 30, rx: 6, ry: 7.5 },
  { a: -120, R: 35, rx: 7, ry: 9.5 },
  { a: -92, R: 37, rx: 7.2, ry: 10 },
  { a: -63, R: 35, rx: 7, ry: 9.5 },
  { a: -33, R: 32, rx: 6.6, ry: 8.6 },
]

export function makePaw(seed: number, mirror: boolean): PawSprite {
  const S = 2
  const width = 92
  const height = 104
  const canvas = document.createElement('canvas')
  canvas.width = width * S
  canvas.height = height * S
  const g = canvas.getContext('2d')!
  const rnd = prng(seed)
  g.scale(S, S)
  if (mirror) {
    g.translate(width, 0)
    g.scale(-1, 1)
  }
  g.fillStyle = FILL
  g.filter = 'blur(.6px)'
  const cx = 46
  const cy = 64
  // the pad: wide, a soft chevron with a notch at the back
  g.beginPath()
  g.moveTo(cx - 25, cy + 2)
  g.bezierCurveTo(cx - 26, cy - 12, cx - 10, cy - 15, cx, cy - 13)
  g.bezierCurveTo(cx + 12, cy - 15, cx + 27, cy - 10, cx + 25, cy + 3)
  g.bezierCurveTo(cx + 23, cy + 15, cx + 11, cy + 19, cx + 3, cy + 13)
  g.quadraticCurveTo(cx, cy + 10, cx - 4, cy + 13)
  g.bezierCurveTo(cx - 12, cy + 19, cx - 25, cy + 15, cx - 25, cy + 2)
  g.fill()
  for (const t of TOES) {
    const a = ((t.a + (rnd() - 0.5) * 6) * Math.PI) / 180
    const x = cx + Math.cos(a) * t.R
    const y = cy + Math.sin(a) * t.R
    g.beginPath()
    g.ellipse(x, y, t.rx, t.ry, a + Math.PI / 2, 0, Math.PI * 2)
    g.fill()
    g.save()
    g.translate(cx + Math.cos(a) * (t.R + t.ry + 6), cy + Math.sin(a) * (t.R + t.ry + 6))
    g.rotate(a + Math.PI / 2)
    g.beginPath()
    g.moveTo(-1.6, 3)
    g.quadraticCurveTo(0, -5, 0.4, -6.5)
    g.quadraticCurveTo(1.2, -3, 1.6, 3)
    g.fill()
    g.restore()
  }
  g.filter = 'none'

  // the same shape, soft: where the water carried the ink
  const soft = document.createElement('canvas')
  soft.width = canvas.width
  soft.height = canvas.height
  const sg = soft.getContext('2d')!
  sg.filter = `blur(${3 * S}px)`
  sg.drawImage(canvas, 0, 0)

  const im = g.getImageData(0, 0, canvas.width, canvas.height)
  const d = im.data
  const blurred = sg.getImageData(0, 0, canvas.width, canvas.height).data
  const nz = (x: number, y: number) =>
    Math.sin(x * 0.21 + seed) * Math.sin(y * 0.17 - seed) * 0.5 +
    Math.sin(x * 0.07 + y * 0.05) * 0.5
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4
      const a0 = d[i + 3] / 255
      const ab = blurred[i + 3] / 255
      let a: number
      if (a0 > 0) {
        // brushed and uneven inside, darker where the ink pooled as it dried
        const body = 0.62 + 0.2 * nz(x, y) + (rnd() - 0.5) * 0.16
        const rim = Math.max(0, a0 - ab) * 1.1
        a = a0 * Math.min(1, body + rim) * (rnd() < 0.015 ? 0.5 : 1)
      } else {
        a = ab * 0.1 // the wet halo soaking into the paper around it
      }
      d[i] = CINNABAR[0]
      d[i + 1] = CINNABAR[1]
      d[i + 2] = CINNABAR[2]
      d[i + 3] = Math.round(Math.min(1, a) * 255)
    }
  }
  g.putImageData(im, 0, 0)
  return { canvas, width, height }
}
