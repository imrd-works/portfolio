import type { Directive } from 'vue'

// `v-magnetic` — the element drifts toward the pointer while hovered, snapping
// back on leave. Hover-capable pointers only; a no-op on touch.

const cleanups = new WeakMap<HTMLElement, () => void>()

export const vMagnetic: Directive<HTMLElement> = {
  mounted(el) {
    if (!window.matchMedia('(hover: hover)').matches) return

    el.style.transition = 'transform 0.2s cubic-bezier(0.2, 0.8, 0.3, 1)'

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (event.clientX - (rect.left + rect.width / 2)) * 0.16
      const y = (event.clientY - (rect.top + rect.height / 2)) * 0.26
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    const onLeave = () => {
      el.style.transform = 'translate(0, 0)'
    }

    el.addEventListener('mousemove', onMove)
    el.addEventListener('mouseleave', onLeave)
    cleanups.set(el, () => {
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
    })
  },

  unmounted(el) {
    cleanups.get(el)?.()
    cleanups.delete(el)
  },
}
