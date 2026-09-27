import { shallowRef } from 'vue'

/**
 * The page's hero, while one is on the page. The hero registers itself as it
 * mounts and leaves as it unmounts; what keeps off it (the page corner's
 * buttons) watches this instead of looking it up once. Looked up once, a page
 * that arrives after them (from another page, through the router's transition)
 * would find no hero yet, and they would stand over it.
 */
export const pageHero = shallowRef<HTMLElement | null>(null)

export function registerPageHero(el: HTMLElement | null) {
  pageHero.value = el
}
