import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import NotFoundPage from './NotFoundPage.vue'
import { AuroraBackdrop, Button, Text } from '@/shared/ui'

const push = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

vi.mock('../seo/usePageSeo', () => ({
  usePageSeo: vi.fn(),
}))

describe('NotFoundPage', () => {
  beforeEach(() => {
    push.mockClear()
  })

  it('uses the portfolio hero language and returns home through the brand action', async () => {
    const wrapper = shallowMount(NotFoundPage, {
      global: {
        renderStubDefaultSlot: true,
        directives: {
          magnetic: {},
        },
      },
    })

    expect(wrapper.findComponent(AuroraBackdrop).exists()).toBe(true)
    expect(wrapper.find('.not-found-page__card').exists()).toBe(true)
    expect(wrapper.findComponent(Text).props()).toMatchObject({
      tag: 'h1',
      variant: 'display-xl',
    })

    const button = wrapper.findComponent(Button)
    expect(button.props()).toMatchObject({ variant: 'brand', size: 'l' })

    await button.trigger('click')
    expect(push).toHaveBeenCalledWith({ name: 'Home' })
  })
})
