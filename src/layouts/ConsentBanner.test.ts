import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import ConsentBanner from './ConsentBanner.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const route = { path: '/', hash: '' }
vi.mock('vue-router', () => ({ useRoute: () => route }))

/** The banner, with the router's link as a plain anchor. */
const mountBanner = () =>
  mount(ConsentBanner, {
    global: { stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } } },
  })

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
    route.path = '/'
    state.value = null
    setConsent.mockClear()
  })

  it('asks a visitor who has not answered', async () => {
    const wrapper = mountBanner()
    await nextTick()
    expect(wrapper.find('.consent-banner__note').exists()).toBe(true)
  })

  it('does not ask a visitor who has answered', async () => {
    state.value = 'denied'
    const wrapper = mountBanner()
    await nextTick()
    expect(wrapper.find('.consent-banner__note').exists()).toBe(false)
  })

  it.each([
    ['.consent-banner__yes', 'granted'],
    ['.consent-banner__no', 'denied'],
  ])('keeps the answer (%s) and goes away', async (button, value) => {
    const wrapper = mountBanner()
    await nextTick()
    await wrapper.find(button).trigger('click')
    expect(setConsent).toHaveBeenCalledWith(value)
    expect(wrapper.find('.consent-banner__note').exists()).toBe(false)
  })

  it("links to the privacy policy in the page's language", async () => {
    route.path = '/en/'
    const wrapper = mountBanner()
    await nextTick()
    expect(wrapper.find('.consent-banner__more').attributes('href')).toBe('/en/privacy/')
  })
})
