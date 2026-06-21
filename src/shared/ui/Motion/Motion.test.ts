import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import Motion from './Motion.vue'

const gsapMock = vi.hoisted(() => ({
  fromTo: vi.fn(() => ({ kill: vi.fn() })),
  set: vi.fn(),
}))

vi.mock('gsap', () => ({
  gsap: {
    fromTo: gsapMock.fromTo,
    set: gsapMock.set,
  },
}))

class IntersectionObserverMock {
  static instances: IntersectionObserverMock[] = []

  callback: IntersectionObserverCallback
  observe = vi.fn()
  disconnect = vi.fn()

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    IntersectionObserverMock.instances.push(this)
  }

  trigger(isIntersecting = true) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver
    )
  }
}

describe('Motion', () => {
  beforeEach(() => {
    gsapMock.fromTo.mockClear()
    gsapMock.set.mockClear()
    IntersectionObserverMock.instances = []

    vi.stubGlobal('IntersectionObserver', IntersectionObserverMock)
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: false }))
    )
  })

  it('animates itself on mount with a preset', async () => {
    const wrapper = mount(Motion, {
      props: {
        tag: 'section',
        preset: 'fade-up',
        delay: 100,
        duration: 500,
        ease: 'power3.out',
      },
      slots: {
        default: 'Content',
      },
    })

    await flushPromises()

    expect(wrapper.element.tagName).toBe('SECTION')
    expect(gsapMock.fromTo).toHaveBeenCalledWith(
      wrapper.element,
      expect.objectContaining({ opacity: 0, y: 24 }),
      expect.objectContaining({
        opacity: 1,
        y: 0,
        delay: 0.1,
        duration: 0.5,
        ease: 'power3.out',
      })
    )
  })

  it('animates direct children with stagger and custom vars', async () => {
    const wrapper = mount(Motion, {
      props: {
        target: 'children',
        from: { opacity: 0, x: 16 },
        to: { opacity: 1, x: 0 },
        stagger: 80,
      },
      slots: {
        default: '<span>One</span><span>Two</span>',
      },
    })

    await flushPromises()

    const children = Array.from(wrapper.element.children)

    expect(gsapMock.fromTo).toHaveBeenCalledWith(
      children,
      expect.objectContaining({ opacity: 0, x: 16 }),
      expect.objectContaining({ opacity: 1, x: 0, stagger: 0.08 })
    )
  })

  it('waits for viewport visibility when trigger is visible', async () => {
    const wrapper = mount(Motion, {
      props: {
        trigger: 'visible',
        target: 'children',
        once: true,
      },
      slots: {
        default: '<span>One</span><span>Two</span>',
      },
    })

    await flushPromises()

    const children = Array.from(wrapper.element.children)

    expect(gsapMock.set).toHaveBeenCalledWith(children, expect.objectContaining({ opacity: 0 }))
    expect(gsapMock.fromTo).not.toHaveBeenCalled()

    IntersectionObserverMock.instances[0].trigger()

    expect(gsapMock.fromTo).toHaveBeenCalled()
    expect(IntersectionObserverMock.instances[0].disconnect).toHaveBeenCalled()
  })

  it('does not animate when disabled or reduced motion is enabled', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({ matches: true }))
    )

    mount(Motion, {
      props: {
        disabled: true,
      },
      slots: {
        default: 'Content',
      },
    })

    await flushPromises()

    expect(gsapMock.fromTo).not.toHaveBeenCalled()
    expect(gsapMock.set).not.toHaveBeenCalled()
  })
})
