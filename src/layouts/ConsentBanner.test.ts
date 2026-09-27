import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ConsentBanner from './ConsentBanner.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const state: { value: 'granted' | 'denied' | null } = { value: null }
const setConsent = vi.fn()
vi.mock('@/shared/lib/consent', () => ({
  consent: {
    get analytics() {
      return state.value
    },
  },
  onConsentChange: () => () => {},
  setConsent: (value: string) => setConsent(value),
}))

describe('ConsentBanner', () => {
  beforeEach(() => {
    state.value = null
    setConsent.mockClear()
  })

  it('asks a visitor who has not answered', async () => {
    const wrapper = mount(ConsentBanner)
    await nextTick()
    expect(wrapper.find('.consent-banner__note').exists()).toBe(true)
  })

  it('does not ask a visitor who has answered', async () => {
    state.value = 'denied'
    const wrapper = mount(ConsentBanner)
    await nextTick()
    expect(wrapper.find('.consent-banner__note').exists()).toBe(false)
  })

  it.each([
    ['.consent-banner__yes', 'granted'],
    ['.consent-banner__no', 'denied'],
  ])('keeps the answer (%s) and goes away', async (button, value) => {
    const wrapper = mount(ConsentBanner)
    await nextTick()
    await wrapper.find(button).trigger('click')
    expect(setConsent).toHaveBeenCalledWith(value)
    expect(wrapper.find('.consent-banner__note').exists()).toBe(false)
  })
})
