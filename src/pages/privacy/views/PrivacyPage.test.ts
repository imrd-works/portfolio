import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createAppI18n } from '@/app/i18n'
import { policySections } from '../model/policy'
import PrivacyPage from './PrivacyPage.vue'

const route = { path: '/privacy/', hash: '' }
vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('../seo/usePageSeo', () => ({ usePageSeo: vi.fn() }))

const state: { value: 'granted' | 'denied' | null } = { value: null }
const setConsent = vi.fn()
vi.mock('@/shared/lib/consent', () => ({
  consent: {
    get granted() {
      return state.value === 'granted'
    },
  },
  onConsentChange: () => () => {},
  setConsent: (value: string) => setConsent(value),
}))

/** The page with the site's real copy, in a language; router links as anchors. */
function page(locale: 'ru' | 'en') {
  route.path = locale === 'ru' ? '/privacy/' : '/en/privacy/'
  return mount(PrivacyPage, {
    global: {
      plugins: [createAppI18n(locale)],
      stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

describe('PrivacyPage', () => {
  beforeEach(() => {
    state.value = null
    setConsent.mockClear()
  })

  it.each(['ru', 'en'] as const)('has every section, all its copy there (%s)', (locale) => {
    const wrapper = page(locale)
    expect(wrapper.findAll('.privacy__section')).toHaveLength(policySections.length)
    // a missing key would show up as the key itself
    expect(wrapper.text()).not.toMatch(/(privacy|consent)\.[a-z]/)
    wrapper.unmount()
  })

  it('leads home and to the other language', () => {
    const wrapper = page('en')
    expect(wrapper.find('.privacy__back').attributes('href')).toBe('/en/')
    expect(wrapper.find('.privacy__lang').attributes('href')).toBe('/privacy/')
    wrapper.unmount()
  })

  it("gives the owner's contacts", () => {
    const wrapper = page('ru')
    const hrefs = wrapper.findAll('.privacy__link').map((a) => a.attributes('href'))
    expect(hrefs).toContain('mailto:imld.works@yandex.ru')
    expect(hrefs).toContain('https://t.me/IIMRD')
    wrapper.unmount()
  })

  it('changes the consent to analytics right there', async () => {
    state.value = 'granted'
    const wrapper = page('ru')
    await nextTick()
    const analytics = wrapper.find('[role="switch"]')
    expect(analytics.attributes('aria-checked')).toBe('true')
    await analytics.trigger('click')
    expect(setConsent).toHaveBeenCalledWith('denied')
    wrapper.unmount()
  })
})
