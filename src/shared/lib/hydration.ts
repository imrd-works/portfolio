/**
 * Entrance animations vs. prerendered HTML.
 *
 * With static generation the browser paints the real content before any
 * JavaScript runs. If the entrance animations then replayed from
 * `opacity: 0`, everything above the fold would flash: visible -> hidden ->
 * fade back in. So on the very first render after hydration we skip the
 * animation for anything already on screen; content further down still
 * animates, because the visitor has not seen it yet.
 *
 * Later client-side navigations (RU <-> EN) animate normally.
 */

let hydratedFromPrerender = false
let initialRender = true

/** Called by the browser entry when it hydrates prerendered markup. */
export function markPrerenderedHydration(): void {
  hydratedFromPrerender = true
}

/** Called once the first mount pass is over. */
export function completeInitialRender(): void {
  initialRender = false
}

function isOnScreen(el: Element): boolean {
  const rect = el.getBoundingClientRect()
  return rect.top < window.innerHeight && rect.bottom > 0 && rect.width > 0
}

/** True when the element is already painted and must not be re-animated. */
export function shouldSkipEntrance(el: Element | null | undefined): boolean {
  if (!hydratedFromPrerender || !initialRender || !el) return false
  return isOnScreen(el)
}
