import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import type { Bloom } from '../views/sections/ink/lib/bloom'

export interface InkBloomOptions {
  /** Where the ink starts on the picture, 0..1 from its top left. */
  from: { x: number; y: number }
  /** How long the bloom takes, ms. */
  ms?: number
}

// gentler than the hero's 1.55: a picture this size would otherwise be all
// there in the first second
const easeSpread = (t: number) => 1 - Math.pow(1 - t, 1.15)

/**
 * Makes a picture (ink on transparency) appear the way the hero's painting
 * does, the first time it comes into view: a canvas is laid exactly over the
 * <img>, the ink blooms on it on wet paper and dries into the drawing, and
 * then the <img> takes its place again. The <img> itself is never replaced,
 * so the prerendered page, the alt text and a browser without WebGL all keep
 * the plain picture.
 */
export function useInkBloom(img: Ref<HTMLImageElement | null>, options: InkBloomOptions) {
  let bloom: Bloom | null = null
  let canvas: HTMLCanvasElement | null = null
  let near: IntersectionObserver | null = null
  let seen: IntersectionObserver | null = null
  let range = { start: 0, end: 1 }
  let sizes: ResizeObserver | null = null
  let frame = 0
  let gone = false

  /** The canvas follows the picture's box inside the same parent. */
  function place() {
    const el = img.value
    if (!el || !canvas) return
    Object.assign(canvas.style, {
      left: `${el.offsetLeft}px`,
      top: `${el.offsetTop}px`,
      width: `${el.offsetWidth}px`,
      height: `${el.offsetHeight}px`,
    })
    bloom?.resize()
  }

  /** The bloom is over: the picture is back in its own element. */
  function finish() {
    const el = img.value
    if (el) {
      el.style.transition = 'none'
      el.style.opacity = ''
    }
    sizes?.disconnect()
    canvas?.remove()
    bloom?.destroy()
    bloom = null
    canvas = null
  }

  function play() {
    const { ms = 6500 } = options
    const begun = performance.now()
    const tick = (now: number) => {
      if (gone || !bloom) return
      const t = Math.min(1, (now - begun) / ms)
      bloom.draw(range.start + (range.end - range.start) * easeSpread(t))
      if (t < 1) frame = requestAnimationFrame(tick)
      else finish()
    }
    frame = requestAnimationFrame(tick)
  }

  async function prepare(el: HTMLImageElement) {
    if (!el.complete) {
      el.loading = 'eager'
      await new Promise((resolve) => {
        el.addEventListener('load', resolve, { once: true })
        el.addEventListener('error', resolve, { once: true })
      })
    }
    if (gone || !el.naturalWidth) return false

    const lib = await import('../views/sections/ink/lib/bloom')
    if (gone) return false
    range = { start: lib.BLOOM_START, end: lib.BLOOM_END }
    const parent = el.parentElement!
    if (getComputedStyle(parent).position === 'static') parent.style.position = 'relative'

    canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    Object.assign(canvas.style, { position: 'absolute', pointerEvents: 'none', maxWidth: 'none' })
    el.after(canvas)
    place()
    try {
      bloom = lib.createBloom(canvas, el, options.from)
    } catch {
      bloom = null
    }
    if (!bloom) {
      canvas.remove()
      canvas = null
      return false
    }
    // until the ink arrives the page shows bare paper where the picture will be
    el.style.opacity = '0'
    sizes = new ResizeObserver(place)
    sizes.observe(el)
    return true
  }

  onMounted(() => {
    const el = img.value
    const still = matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false
    if (!el || still || typeof IntersectionObserver === 'undefined') return

    // get the picture and the canvas ready a little before it shows…
    let ready: Promise<boolean> | null = null
    near = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        near?.disconnect()
        ready = prepare(el)
      },
      { rootMargin: '0px 0px 400px 0px' }
    )
    // …and let the ink in once a good part of it is on screen
    seen = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        seen?.disconnect()
        ready ??= prepare(el)
        void ready.then((ok) => ok && play())
      },
      { threshold: 0.3 }
    )
    near.observe(el)
    seen.observe(el)
  })

  onBeforeUnmount(() => {
    gone = true
    cancelAnimationFrame(frame)
    near?.disconnect()
    seen?.disconnect()
    finish()
  })
}
