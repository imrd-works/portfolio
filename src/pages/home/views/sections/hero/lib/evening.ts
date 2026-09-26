/**
 * The evening, once the hero is drawn: at the top of the page, a scroll down doesn't move
 * the page, it starts the evening, which then plays by itself: the sun goes down behind the
 * hills in ~3 s, then the moon comes up in ~2 s. Until the moon is up the page stays, so the
 * next section waits for it; after that it scrolls on as usual. Scrolling up at the top plays
 * it all back (the moon goes down first, then the sun comes up).
 *
 * Whoever keeps scrolling while it plays hurries it on, up to 3×, so it can all go by in
 * about two seconds (the scene may still hold the sun and the moon back for the brush
 * strokes at their slits); the pace eases back once they stop. A gesture still going when
 * the moon is up is let go once it stops, 0.7 s at most, so its momentum doesn't carry the
 * reader past it all.
 */

// keys that scroll the page, and which way
const KEYS: Record<string, number> = {
  ArrowDown: 80,
  PageDown: 400,
  ' ': 400,
  Spacebar: 400,
  ArrowUp: -80,
  PageUp: -400,
}
const SUN_PER_S = 1 / 3 // the sunset: ~3 s
const SUN_BACK_PER_S = 0.4
const MOON_PER_S = 0.5 // the moonrise: ~2 s
// the moon sets off once the sun has gone into its slit, not after it has eased to a stop
const SUN_IN_AT = 0.9
const MAX_PACE = 3
const QUIET_MS = 300
const LET_GO_MS = 700
// never held longer than this, however slowly it plays on a slow device
const MAX_HOLD_MS = 8000

export interface Evening {
  /** The hero is drawn: from now on a scroll at the top starts the evening. */
  arm(): void
  /**
   * Advances it by `dt` seconds; `s`: how far the sun has gone down, `m`: the moon up.
   * `hold` may keep them back (from where they were to where they would go).
   */
  step(
    dt: number,
    hold?: (s0: number, m0: number, s: number, m: number) => [number, number]
  ): { s: number; m: number; moving: boolean }
  /** Back to the day, disarmed (a replay of the drawing). */
  reset(): void
  dispose(): void
}

export function createEvening(): Evening {
  let armed = false
  let night = false
  let pace = 1
  let s = 0
  let m = 0
  let lastHeld = 0
  let doneAt = 0
  let nightAt = 0

  function done() {
    const d = night && ((s >= 1 && m >= 0.999) || performance.now() - nightAt > MAX_HOLD_MS)
    if (d && !doneAt) doneAt = performance.now()
    if (!d) doneAt = 0
    return d
  }

  function take(d: number, e: Event) {
    if (!armed || window.scrollY > 0) return
    const now = performance.now()
    const was = night
    if (d > 0 && (!done() || (now - lastHeld < QUIET_MS && now - doneAt < LET_GO_MS))) {
      if (!night) nightAt = now
      night = true
    } else if (d < 0 && (night || s > 0 || m > 0)) night = false
    else return
    // scrolling on the same way while it plays: faster (the first notch only starts it)
    if (night === was) pace = Math.min(MAX_PACE, pace + Math.abs(d) / 250)
    lastHeld = now
    if (e.cancelable) e.preventDefault()
  }

  const onWheel = (e: WheelEvent) => take(e.deltaY * (e.deltaMode === 1 ? 16 : 1), e)
  let touchY: number | null = null
  const onTouchStart = (e: TouchEvent) => {
    touchY = e.touches[0].clientY
  }
  const onTouchMove = (e: TouchEvent) => {
    const y = e.touches[0].clientY
    if (touchY !== null) take((touchY - y) * 1.5, e)
    touchY = y
  }
  const onKey = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null
    if (e.altKey || e.ctrlKey || e.metaKey || t?.closest('input, textarea, select, button, a'))
      return
    const d = KEYS[e.key]
    if (d) take(d, e)
  }

  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('keydown', onKey)

  return {
    arm() {
      armed = true
    },
    step(dt, hold) {
      pace = 1 + (pace - 1) * Math.exp(-dt / 0.8) // eases back once the scrolling stops
      const s0 = s
      const m0 = m
      // the sun goes back up only once the moon has gone down
      const sTarget = night || m > 0.02 ? 1 : 0
      s += Math.max(-dt * SUN_BACK_PER_S * pace, Math.min(dt * SUN_PER_S * pace, sTarget - s))
      // the moon comes up once the sun is gone
      const mTarget = night && s >= SUN_IN_AT ? 1 : 0
      m += Math.max(-dt * MOON_PER_S * pace, Math.min(dt * MOON_PER_S * pace, mTarget - m))
      if (hold) [s, m] = hold(s0, m0, s, m)
      return { s, m, moving: s !== s0 || m !== m0 }
    },
    reset() {
      armed = false
      night = false
      pace = 1
      s = 0
      m = 0
    },
    dispose() {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('keydown', onKey)
    },
  }
}
