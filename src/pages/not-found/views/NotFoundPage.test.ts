import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createAppI18n } from '@/app/i18n'
import NotFoundPage from './NotFoundPage.vue'
import ru from '../locales/ru.json'
import en from '../locales/en.json'

const route = { path: '/nope', hash: '' }
vi.mock('vue-router', () => ({ useRoute: () => route }))
vi.mock('../seo/usePageSeo', () => ({ usePageSeo: vi.fn() }))
// the trail is canvas work: not what is checked here
vi.mock('../lib/trail', () => ({ createTrail: () => ({ steps: 0, draw: vi.fn() }) }))
vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    disconnect() {}
  }
)
vi.stubGlobal('matchMedia', () => ({ matches: true }))

/** The heading as read: the copy's non-breaking spaces as plain ones. */
const heading = (wrapper: ReturnType<typeof page>) =>
  wrapper
    .find('h1')
    .text()
    .replace(/\u00a0/g, ' ')

/** The page at an address, with the site's real copy; router links as anchors. */
function page(path: string, locale: 'ru' | 'en') {
  route.path = path
  return mount(NotFoundPage, {
    global: {
      plugins: [createAppI18n(locale)],
      stubs: { RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' } },
    },
  })
}

describe('NotFoundPage', () => {
  it('shows the painting, says what happened, and leads home', () => {
    const wrapper = page('/nope', 'ru')
    expect(wrapper.find('.not-found__painting').attributes('src')).toBe('/not-found/taiga-404.webp')
    expect(heading(wrapper)).toContain('404')
    expect(heading(wrapper)).toContain(ru.heading)
    expect(wrapper.find('.not-found__home').attributes('href')).toBe('/')
    wrapper.unmount()
  })

  it('leads home in the language of the address', () => {
    const wrapper = page('/en/nope', 'en')
    expect(heading(wrapper)).toContain(en.heading)
    expect(wrapper.find('.not-found__home').attributes('href')).toBe('/en/')
    wrapper.unmount()
  })
})
