/**
 * The splash around the blot: jets grown into it, detached flying drops and
 * drips running down. Rolled anew on every play, so no two blots look alike.
 * Each part becomes one capsule (tail, head, two radii) in the shader.
 */

interface Jet {
  kind: 'jet'
  th: number
  len: number
  ra: number
  rb: number
  dur: number
}

interface Fly {
  kind: 'fly'
  th: number
  L: number
  r: number
  dur: number
  delay: number
}

interface Drip {
  kind: 'drip'
  dx: number
  len: number
  ra: number
  rb: number
  delay: number
  tau: number
}

export type SplashPart = Jet | Fly | Drip

export const easeOut3 = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3)

export function makeSplash(R0: number, rnd: () => number = Math.random): SplashPart[] {
  const parts: SplashPart[] = []
  for (let i = 0; i < 7; i++) {
    // jets attached to the blot
    const th = rnd() * Math.PI * 2
    const down = Math.max(0, -Math.sin(th))
    parts.push({
      kind: 'jet',
      th,
      len: R0 * (0.7 + 1.5 * rnd() * rnd()) * (1 + 0.6 * down),
      ra: R0 * (0.32 + 0.16 * rnd()),
      rb: R0 * (0.05 + 0.07 * rnd()),
      dur: 0.1 + 0.08 * rnd(),
    })
  }
  for (let i = 0; i < 9; i++) {
    // detached drops
    const th = rnd() * Math.PI * 2
    const down = Math.max(0, -Math.sin(th))
    const far = Math.pow(rnd(), 1.7)
    parts.push({
      kind: 'fly',
      th,
      L: R0 * (1.8 + 3.4 * far) * (1 + 0.5 * down),
      r: R0 * (0.06 + 0.1 * rnd()) * (1 - 0.5 * far),
      dur: 0.16 + 0.26 * rnd(),
      delay: 0.03 * rnd(),
    })
  }
  for (let i = 0; i < 2; i++) {
    // drips running down
    parts.push({
      kind: 'drip',
      dx: R0 * (i ? 0.42 : -0.3) * (0.6 + 0.8 * rnd()),
      len: R0 * (2.2 + 2.4 * rnd()),
      ra: R0 * (0.07 + 0.04 * rnd()),
      rb: R0 * (0.13 + 0.05 * rnd()),
      delay: 0.25 + 0.5 * rnd(),
      tau: 1.4 + rnd(),
    })
  }
  return parts
}

/**
 * Writes the capsules for `ts` seconds after the impact into `seg`/`rad`.
 * `bx`, `by` are the blot centre in shader space (x already scaled by aspect).
 */
export function updateSplash(
  parts: SplashPart[],
  ts: number,
  bx: number,
  by: number,
  R0: number,
  seg: Float32Array,
  rad: Float32Array
): void {
  parts.forEach((p, i) => {
    let tx: number, ty: number, hx: number, hy: number, ra: number, rb: number
    if (p.kind === 'jet') {
      const e = easeOut3(ts / p.dur)
      const c = Math.cos(p.th)
      const s = Math.sin(p.th)
      tx = bx + c * R0 * 0.55
      ty = by + s * R0 * 0.55
      hx = bx + c * (R0 * 0.8 + p.len * e)
      hy = by + s * (R0 * 0.8 + p.len * e)
      ra = p.ra
      rb = p.rb
    } else if (p.kind === 'fly') {
      const t = ts - p.delay
      const c = Math.cos(p.th)
      const s = Math.sin(p.th)
      const eh = easeOut3(t / p.dur)
      const et = easeOut3((t - 0.06) / p.dur)
      const pos = (e: number) => [
        bx + c * (R0 + (p.L - R0) * e),
        by + s * (R0 + (p.L - R0) * e) - 0.7 * R0 * e * e,
      ]
      ;[hx, hy] = pos(eh)
      ;[tx, ty] = pos(et)
      // the landed spot bleeds out a little
      const bleed = 1 + 0.22 * (1 - Math.exp(-Math.max(0, t - p.dur) / 0.8))
      rb = t > 0 ? p.r * bleed : 0
      ra = rb * (0.45 + 0.55 * et)
    } else {
      const t = Math.max(0, ts - p.delay)
      const e = 1 - Math.exp(-t / p.tau)
      tx = bx + p.dx
      ty = by - R0 * 0.6
      hx = tx + p.dx * 0.15 * e
      hy = ty - p.len * e
      ra = t > 0 ? p.ra : 0
      rb = t > 0 ? p.rb * Math.min(1, t * 4) : 0
    }
    seg.set([tx, ty, hx, hy], i * 4)
    rad.set([ra, rb], i * 2)
  })
}
