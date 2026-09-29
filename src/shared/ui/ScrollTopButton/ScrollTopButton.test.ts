import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import ScrollTopButton from './ScrollTopButton.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('ScrollTopButton', () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    [false, 'smooth'],
    [true, 'auto'],
  ])('takes the page to the top (less motion: %s)', async (still, behavior) => {
    const scrollTo = vi.fn()
    vi.stubGlobal('scrollTo', scrollTo)
    vi.stubGlobal('matchMedia', () => ({ matches: still }))
    const main = document.createElement('main')
    main.id = 'main-content'
    main.tabIndex = -1
    document.body.appendChild(main)

    const wrapper = mount(ScrollTopButton, { attachTo: document.body })
    expect(wrapper.attributes('aria-label')).toBe('toTop')
    await wrapper.trigger('click')
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior })
    // the keyboard carries on from the top of the content
    expect(document.activeElement).toBe(main)

    wrapper.unmount()
    main.remove()
  })
})
