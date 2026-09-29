import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import GraphicsOffer from './GraphicsOffer.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

type Kind = 'clarity' | 'light'
const offerListeners: ((kind: Kind) => void)[] = []
const chooseGraphics = vi.fn()
const chooseClarity = vi.fn()
const declineOffer = vi.fn()
vi.mock('@/shared/lib/graphics', () => ({
  graphics: { offered: null },
  onGraphicsOffer: (fn: (kind: Kind) => void) => {
    offerListeners.push(fn)
    return () => {}
  },
  chooseGraphics: (level: string) => chooseGraphics(level),
  chooseClarity: (c: number) => chooseClarity(c),
  declineOffer: () => declineOffer(),
}))

/** The page stutters: lib/graphics.ts offers `kind`. */
async function stutter(wrapper: ReturnType<typeof mount>, kind: Kind) {
  offerListeners.forEach((fn) => fn(kind))
  await wrapper.vm.$nextTick()
}

describe('GraphicsOffer', () => {
  beforeEach(() => {
    offerListeners.length = 0
    chooseGraphics.mockClear()
    chooseClarity.mockClear()
    declineOffer.mockClear()
  })

  it('shows nothing until something is offered', async () => {
    const wrapper = mount(GraphicsOffer)
    expect(wrapper.find('.graphics-offer__note').exists()).toBe(false)
    await stutter(wrapper, 'light')
    expect(wrapper.find('.graphics-offer__note').text()).toContain('home.graphics.offer')
  })

  it('offers the lower clarity first, and lowers it only when asked to', async () => {
    const wrapper = mount(GraphicsOffer)
    await stutter(wrapper, 'clarity')
    expect(wrapper.find('.graphics-offer__text').text()).toBe('home.graphics.clarity.offer')
    await wrapper.find('.graphics-offer__yes').trigger('click')
    expect(chooseClarity).toHaveBeenCalledWith(1)
    expect(chooseGraphics).not.toHaveBeenCalled()
    expect(wrapper.find('.graphics-offer__note').exists()).toBe(false)
  })

  it('switches to the light mode only when asked to, and goes away', async () => {
    const wrapper = mount(GraphicsOffer)
    await stutter(wrapper, 'light')
    await wrapper.find('.graphics-offer__yes').trigger('click')
    expect(chooseGraphics).toHaveBeenCalledWith('low')
    expect(wrapper.find('.graphics-offer__note').exists()).toBe(false)
  })

  it.each(['clarity', 'light'] as const)(
    'keeps the page as it is when %s is declined',
    async (kind) => {
      const wrapper = mount(GraphicsOffer)
      await stutter(wrapper, kind)
      await wrapper.find('.graphics-offer__no').trigger('click')
      expect(declineOffer).toHaveBeenCalledOnce()
      expect(chooseClarity).not.toHaveBeenCalled()
      expect(wrapper.find('.graphics-offer__note').exists()).toBe(false)
    }
  )
})
