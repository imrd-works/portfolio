/**
 * Keeps the page at the top while the hero is being drawn, so nobody slips
 * past it to the next section before the painting and its sun are down.
 *
 * A try to scroll does not move the page: it calls `onTry`, and the scene
 * hurries up instead. Once released, the page scrolls again as soon as the
 * gesture that was held has ended, so a flick's momentum does not carry the
 * reader past the hero after all.
 */

// keys that scroll the page down
const KEYS = new Set(['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar'])
// a gesture has ended when no try came for this long (trackpad momentum included)
const QUIET_MS = 300
// ...but a reader who keeps scrolling is let go this long after the release anyway
const RELEASE_MS = 700
// never hold longer than this, whatever happens to the drawing
const MAX_MS = 8000

export interface ScrollHold {
  /** The hero is out: let the page scroll once the current gesture is over. */
  release(): void
  dispose(): void
}

export function holdScroll(onTry: () => void): ScrollHold {
  let held = true
  let releasing = false
  let lastTry = 0
  let quiet = 0
  let limit = 0

  function free() {
    if (!held) return
    held = false
    clearTimeout(quiet)
    clearTimeout(limit)
    window.removeEventListener('wheel', tryScroll)
    window.removeEventListener('touchmove', tryScroll)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('scroll', onScroll)
  }

  function waitForQuiet() {
    clearTimeout(quiet)
    quiet = window.setTimeout(free, QUIET_MS - (performance.now() - lastTry))
  }

  function tryScroll(e: Event) {
    if (e.cancelable) e.preventDefault()
    lastTry = performance.now()
    onTry()
    if (releasing) waitForQuiet()
  }

  function onKey(e: KeyboardEvent) {
    // keyboard users go wherever they tab to
    if (e.key === 'Tab') free()
    else if (KEYS.has(e.key)) tryScroll(e)
  }

  // the scrollbar and anything else that got through: back to the top
  function onScroll() {
    if (window.scrollY <= 0) return
    window.scrollTo(0, 0)
    lastTry = performance.now()
    onTry()
    if (releasing) waitForQuiet()
  }

  window.addEventListener('wheel', tryScroll, { passive: false })
  window.addEventListener('touchmove', tryScroll, { passive: false })
  window.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScroll, { passive: true })
  limit = window.setTimeout(free, MAX_MS)

  return {
    release() {
      if (releasing) return
      releasing = true
      clearTimeout(limit)
      limit = window.setTimeout(free, RELEASE_MS)
      if (performance.now() - lastTry >= QUIET_MS) free()
      else waitForQuiet()
    },
    dispose: free,
  }
}
