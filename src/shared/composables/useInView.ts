import { onBeforeUnmount, onMounted, ref, type Ref, type VNodeRef } from 'vue'

interface UseInViewOptions {
  /** Fire only once, then stop observing. Default true. */
  once?: boolean
  /** IntersectionObserver threshold. Default 0.2. */
  threshold?: number
}

interface UseInViewReturn {
  /** Attach to the element you want to watch. */
  target: Ref<HTMLElement | null>
  /** Bind directly to a template's `ref` attribute. */
  targetRef: VNodeRef
  /** Reactive flag — true while the element is in the viewport. */
  inView: Ref<boolean>
}

// Lightweight viewport-presence hook. Components use it to kick off width /
// height / count animations the moment a section scrolls into view.
export function useInView(options: UseInViewOptions = {}): UseInViewReturn {
  const { once = true, threshold = 0.2 } = options
  const target = ref<HTMLElement | null>(null)
  const targetRef: VNodeRef = (element) => {
    target.value = element instanceof HTMLElement ? element : null
  }
  const inView = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!target.value) return

    observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          inView.value = entry.isIntersecting
          if (entry.isIntersecting && once) {
            observer?.disconnect()
            observer = null
          }
        }
      },
      { threshold }
    )
    observer.observe(target.value)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    observer = null
  })

  return { target, targetRef, inView }
}
