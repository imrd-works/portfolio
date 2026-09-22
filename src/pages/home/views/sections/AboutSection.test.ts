import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import AboutSection from './AboutSection.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('AboutSection', () => {
  it('renders the ink portrait with accessible image metadata', () => {
    const wrapper = shallowMount(AboutSection, {
      global: {
        renderStubDefaultSlot: true,
        stubs: {
          'i18n-t': true,
        },
        directives: {
          tilt: {},
        },
      },
    })

    const portrait = wrapper.find('.about__art')

    expect(portrait.attributes()).toMatchObject({
      src: '/about/portrait.webp',
      alt: 'home.about.photo',
      loading: 'lazy',
      decoding: 'async',
    })
  })
})
