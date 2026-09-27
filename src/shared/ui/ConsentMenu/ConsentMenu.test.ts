import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ConsentMenu from './ConsentMenu.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const state: { value: 'granted' | 'denied' | null } = { value: null }
const listeners: ((value: 'granted' | 'denied' | null) => void)[] = []
const setConsent = vi.fn((value: 'granted' | 'denied') => {
  state.value = value
  listeners.forEach((fn) => fn(value))
})
vi.mock('@/shared/lib/consent', () => ({
  consent: {
    get granted() {
      return state.value === 'granted'
    },
  },
  onConsentChange: (fn: (value: 'granted' | 'denied' | null) => void) => {
    listeners.push(fn)
    return () => {}
  },
  setConsent: (value: 'granted' | 'denied') => setConsent(value),
}))

describe('ConsentMenu', () => {
  beforeEach(() => {
    state.value = null
    listeners.length = 0
    setConsent.mockClear()
  })

  it('changes the answer either way', async () => {
    const wrapper = mount(ConsentMenu, { attachTo: document.body })
    await wrapper.find('.popover-button__trigger').trigger('click')
    const analytics = wrapper.find('[role="switch"]')
    expect(analytics.attributes('aria-checked')).toBe('false')

    await analytics.trigger('click')
    expect(setConsent).toHaveBeenLastCalledWith('granted')
    expect(analytics.attributes('aria-checked')).toBe('true')

    await analytics.trigger('click')
    expect(setConsent).toHaveBeenLastCalledWith('denied')
    expect(analytics.attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })

  it('shows analytics on for a visitor who allowed it', async () => {
    state.value = 'granted'
    const wrapper = mount(ConsentMenu, { attachTo: document.body })
    await wrapper.find('.popover-button__trigger').trigger('click')
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })
})
