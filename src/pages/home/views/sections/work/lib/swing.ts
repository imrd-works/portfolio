/**
 * The sheets on the wall hang on their pins like pendulums. A cursor passing
 * over one pushes it the way it goes, harder the faster it goes, and the sheet
 * swings back and forth, less each time, till it comes to rest: straight while
 * it is pointed at (or has the focus, or is open), askew on its pin otherwise.
 *
 * Each frame is a few sums per sheet and one `transform: rotate()` on its
 * hanger, which the compositor turns without laying out or painting anything;
 * the loop only runs while a sheet still moves. Only for a mouse or a pen (a
 * touch screen has no hover); the caller leaves it off with reduced motion and
 * in the light mode, where the sheets straighten as before, in CSS.
 */

/** The spring pulling a sheet to rest (1/s²): a swing of about a second. */
const STIFFNESS = 40
/** The friction: a push dies down in about three seconds. */
const DAMPING = 2
/** How much a passing cursor pushes (deg/s per px/ms, squared by its speed, per ms). */
const PUSH = 0.07
/** It never swings wider than this (deg) or faster than this (deg/s). */
const MAX_ANGLE = 8
const MAX_SPEED = 60
/** A pointed-at sheet lifts off the wall a little (px), as it did in CSS. */
const LIFT = -3
/** Close enough to rest to stop drawing. */
const EPS = 0.005

interface Sheet {
  el: HTMLElement
  hang: HTMLElement
  angle: number
  speed: number
  lift: number
  lastX: number
  lastT: number
}

export interface Swing {
  /** Something changed that moves a sheet's rest (a painting opened or closed). */
  wake(): void
  /** Stops a sheet where it should rest, at once (it is being opened). */
  still(el: HTMLElement): void
  dispose(): void
}

const tiltOf = (el: HTMLElement) => parseFloat(el.style.getPropertyValue('--work-tilt')) || 0
const upright = (el: HTMLElement) =>
  el.matches(':hover, :focus-visible') || el.classList.contains('work__sheet--active')

export function createSwing(wall: HTMLElement): Swing {
  const sheets = new Map<HTMLElement, Sheet>()
  let raf = 0
  let last = 0

  function sheetOf(target: EventTarget | null): Sheet | null {
    const el = (target as Element | null)?.closest<HTMLElement>('.work__sheet')
    if (!el || !wall.contains(el)) return null
    let s = sheets.get(el)
    if (!s) {
      const hang = el.querySelector<HTMLElement>('.work__hang')
      if (!hang) return null
      s = { el, hang, angle: tiltOf(el), speed: 0, lift: 0, lastX: 0, lastT: 0 }
      sheets.set(el, s)
    }
    return s
  }

  function draw(s: Sheet) {
    s.hang.style.transform = `translateY(${s.lift.toFixed(2)}px) rotate(${s.angle.toFixed(3)}deg)`
  }

  function frame(now: number) {
    raf = 0
    const dt = Math.min(1 / 30, (now - (last || now)) / 1000)
    last = now
    let moving = false
    sheets.forEach((s) => {
      const up = upright(s.el)
      const rest = up ? 0 : tiltOf(s.el)
      // two half steps: steady even at 30 fps
      for (let k = 0; k < 2; k++) {
        const h = dt / 2
        s.speed += (-STIFFNESS * (s.angle - rest) - DAMPING * s.speed) * h
        s.angle += s.speed * h
      }
      if (Math.abs(s.angle) > MAX_ANGLE) {
        s.angle = Math.sign(s.angle) * MAX_ANGLE
        s.speed *= -0.3 // it bumps its limit softly and turns back
      }
      s.lift += ((up ? LIFT : 0) - s.lift) * (1 - Math.exp(-dt * 10))
      const still =
        Math.abs(s.angle - rest) < EPS &&
        Math.abs(s.speed) < EPS * 10 &&
        Math.abs(s.lift - (up ? LIFT : 0)) < EPS
      if (still) {
        s.angle = rest
        s.speed = 0
        s.lift = up ? LIFT : 0
      } else moving = true
      draw(s)
    })
    if (moving) raf = requestAnimationFrame(frame)
    else last = 0
  }

  function wake() {
    if (!raf) raf = requestAnimationFrame(frame)
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType === 'touch') return
    const s = sheetOf(e.target)
    if (!s) return
    const t = e.timeStamp
    if (s.lastT && t - s.lastT < 100) {
      const dt = Math.max(1, t - s.lastT)
      const vx = (e.clientX - s.lastX) / dt // px/ms
      // pushed the way the cursor goes: the bottom follows it, so the sheet turns the other way
      s.speed -= PUSH * vx * Math.abs(vx) * dt // 300 px at 2 px/ms: ~40 deg/s, a ~6° swing
      s.speed = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, s.speed))
    }
    s.lastX = e.clientX
    s.lastT = t
    wake()
  }

  function onEnterLeave(e: Event) {
    // its rest changes: upright while pointed at or focused, askew otherwise
    if (sheetOf(e.target)) wake()
  }

  wall.classList.add('work__wall--swing')
  wall.addEventListener('pointermove', onMove)
  wall.addEventListener('pointerover', onEnterLeave)
  wall.addEventListener('pointerout', onEnterLeave)
  wall.addEventListener('focusin', onEnterLeave)
  wall.addEventListener('focusout', onEnterLeave)

  return {
    wake,
    still(el) {
      const s = sheetOf(el)
      if (!s) return
      s.angle = upright(el) ? 0 : tiltOf(el)
      s.speed = 0
      draw(s)
    },
    dispose() {
      cancelAnimationFrame(raf)
      wall.classList.remove('work__wall--swing')
      wall.removeEventListener('pointermove', onMove)
      wall.removeEventListener('pointerover', onEnterLeave)
      wall.removeEventListener('pointerout', onEnterLeave)
      wall.removeEventListener('focusin', onEnterLeave)
      wall.removeEventListener('focusout', onEnterLeave)
      sheets.forEach((s) => (s.hang.style.transform = ''))
      sheets.clear()
    },
  }
}
