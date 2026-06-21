import type { Directive } from 'vue'

// `v-tilt` — gives an element a subtle 3D tilt that tracks the pointer.
// Optional binding sets the maximum tilt in degrees (default 8).
// Hover-capable pointers only.

const cleanups = new WeakMap<HTMLElement, () => void>()

export const vTilt: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (!window.matchMedia('(hover: hover)').matches) return

    const max = binding.value ?? 8
    el.style.transition = 'transform 0.25s ease-out'

    const onMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const rx = ((event.clientY - rect.top) / rect.height - 0.5) * -max
      const ry = ((event.clientX - rect.left) / rect.width - 0.5) * max
      el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`
    }
    const onLeave = () => {
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)'
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
