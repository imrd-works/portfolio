import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GraphicsOffer from './GraphicsOffer.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const offerListeners: (() => void)[] = []
const chooseGraphics = vi.fn()
vi.mock('@/shared/lib/graphics', () => ({
  graphics: { offered: false },
  onGraphicsOffer: (fn: () => void) => {
    offerListeners.push(fn)
    return () => {}
  },
  chooseGraphics: (level: string) => chooseGraphics(level),
}))

/** The page stutters: lib/graphics.ts makes the offer. */
function stutter() {
  offerListeners.forEach((fn) => fn())
}

describe('GraphicsOffer', () => {
  beforeEach(() => {
    offerListeners.length = 0
    chooseGraphics.mockClear()
  })

  it('shows nothing until the light mode is offered', async () => {
    const wrapper = mount(GraphicsOffer)
    expect(wrapper.find('.graphics-offer__note').exists()).toBe(false)
    stutter()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.graphics-offer__note').text()).toContain('home.graphics.offer')
  })

  it('switches to the light mode only when asked to, and goes away', async () => {
    const wrapper = mount(GraphicsOffer)
    stutter()
    await wrapper.vm.$nextTick()
    await wrapper.find('.graphics-offer__yes').trigger('click')
    expect(chooseGraphics).toHaveBeenCalledWith('low')
    expect(wrapper.find('.graphics-offer__note').exists()).toBe(false)
  })

  it('keeps it as is when declined', async () => {
    const wrapper = mount(GraphicsOffer)
    stutter()
    await wrapper.vm.$nextTick()
    await wrapper.find('.graphics-offer__no').trigger('click')
    expect(chooseGraphics).toHaveBeenCalledWith('high')
  })
})
