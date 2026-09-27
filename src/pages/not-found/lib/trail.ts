import { makePaw, type PawSprite } from '@/shared/lib/ink/paw'

/**
 * The wolverine's trail across the 404 painting: out of the mist under the
 * taiga, towards the number, fainter with every step, and gone where the birds
 * take off. Points are fractions of the painting (it keeps its 3:2 proportions
 * at any size), so the trail lands on the same spots of it everywhere.
 */
const FROM = { x: 0.27, y: 0.8 }
const TO = { x: 0.48, y: 0.67 }
const STEPS = 6
/** A print's width, as a fraction of the painting's. */
const PAW = 0.022
/** How far left and right of the line the feet fall, the same fraction. */
const GAIT = 0.006

export interface Trail {
  /** How many prints there are. */
  steps: number
  /** Paints the first `shown` prints on `canvas`, sized to the painting's css box. */
  draw(canvas: HTMLCanvasElement, width: number, height: number, shown: number): void
}

export function createTrail(): Trail {
  const paws: PawSprite[] = Array.from({ length: STEPS }, (_, i) =>
    makePaw(41 + i * 5, i % 2 === 1)
  )

  function draw(canvas: HTMLCanvasElement, width: number, height: number, shown: number) {
    const dpr = Math.min(devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * dpr)
    canvas.height = Math.round(height * dpr)
    const g = canvas.getContext('2d')!
    g.scale(dpr, dpr)

    const dx = (TO.x - FROM.x) * width
    const dy = (TO.y - FROM.y) * height
    const heading = Math.atan2(dy, dx)
    const len = Math.hypot(dx, dy)
    // across the line, to the side each foot falls on
    const nx = -dy / len
    const ny = dx / len

    for (let i = 0; i < Math.min(shown, STEPS); i++) {
      const paw = paws[i]
      const t = i / (STEPS - 1)
      const side = (i % 2 === 0 ? 1 : -1) * GAIT * width
      const w = PAW * width
      const h = (w * paw.height) / paw.width
      g.save()
      g.globalAlpha = 0.95 - t * 0.6
      g.translate(FROM.x * width + dx * t + nx * side, FROM.y * height + dy * t + ny * side)
      // drawn toes-up: a quarter turn puts the toes the way it walks
      g.rotate(heading + Math.PI / 2)
      g.drawImage(paw.canvas, -w / 2, -h / 2, w, h)
      g.restore()
    }
  }

  return { steps: STEPS, draw }
}
