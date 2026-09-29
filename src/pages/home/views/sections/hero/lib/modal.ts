/**
 * An event from inside an open modal (a painting of the Work section): it scrolls that
 * window, not the page, so the hero's scroll hold and its evening leave it alone. Without
 * this, a painting opened while the page was at its top had its wheel taken by the evening.
 */
export function fromModal(e: Event): boolean {
  const target = e.target as Element | null
  return !!target?.closest?.('[aria-modal="true"]')
}
