import type { ObjectDirective } from 'vue'

/**
 * `v-ink-in`: a block comes up through the paper the first time the reader gets to it, out
 * of a blur and nothing, the way the text of "About" and of the privacy page does. With a
 * number (`v-ink-in="2"`) it waits that many steps, so the blocks of one section come one
 * after another.
 *
 * What is on the screen already when the page opens stays as it was painted: it was there
 * before the scripts. Without scripts, without IntersectionObserver and for a reader who
 * asked for less motion, everything is simply there.
 *
 * The state is kept in a data attribute, not a class: Vue rewrites `class` whenever a bound
 * one changes, and would take the block's state with it. The styles are in
 * assets/styles/base/_animations.scss.
 */
const STEP_MS = 110
/** The longest of the transitions (the blur), after which the block is plain again. */
const DONE_MS = 1400

let observer: IntersectionObserver | null = null

function watch(el: HTMLElement) {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const block = entry.target as HTMLElement
        observer?.unobserve(block)
        block.dataset.inkIn = 'in'
        // once it is there, nothing of the effect is left on it (a filter, even an empty
        // one, makes a layer of its own)
        const delay = parseFloat(block.style.getPropertyValue('--ink-in-delay')) || 0
        window.setTimeout(() => {
          delete block.dataset.inkIn
          block.style.removeProperty('--ink-in-delay')
        }, DONE_MS + delay)
      }
    },
    { rootMargin: '0px 0px -10% 0px' }
  )
  observer.observe(el)
}

export const vInkIn: ObjectDirective<HTMLElement, number | undefined> = {
  mounted(el, { value }) {
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    if (el.getBoundingClientRect().top < window.innerHeight) return
    el.dataset.inkIn = 'wait'
    if (value) el.style.setProperty('--ink-in-delay', `${value * STEP_MS}ms`)
    watch(el)
  },
  unmounted(el) {
    observer?.unobserve(el)
  },
  getSSRProps: () => ({}),
}
