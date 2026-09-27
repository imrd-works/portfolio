import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsMenu from './SettingsMenu.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const state = { low: false }
const listeners: ((level: 'high' | 'low') => void)[] = []
const chooseGraphics = vi.fn((level: 'high' | 'low') => {
  state.low = level === 'low'
  listeners.forEach((fn) => fn(level))
})
vi.mock('@/shared/lib/graphics', () => ({
  graphics: {
    get low() {
      return state.low
    },
  },
  onGraphicsChange: (fn: (level: 'high' | 'low') => void) => {
    listeners.push(fn)
    return () => {}
  },
  chooseGraphics: (level: 'high' | 'low') => chooseGraphics(level),
}))

describe('SettingsMenu', () => {
  beforeEach(() => {
    state.low = false
    listeners.length = 0
    chooseGraphics.mockClear()
  })

  it('opens its panel from the gear', async () => {
    const wrapper = mount(SettingsMenu, { attachTo: document.body })
    const gear = wrapper.find('.settings-menu__gear')
    expect(gear.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.settings-menu__panel').exists()).toBe(false)
    await gear.trigger('click')
    expect(gear.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.settings-menu__panel').exists()).toBe(true)
    wrapper.unmount()
  })

  it('turns the light mode on and back off', async () => {
    const wrapper = mount(SettingsMenu, { attachTo: document.body })
    await wrapper.find('.settings-menu__gear').trigger('click')
    const light = wrapper.find('[role="switch"]')
    expect(light.attributes('aria-checked')).toBe('false')

    await light.trigger('click')
    expect(chooseGraphics).toHaveBeenLastCalledWith('low')
    expect(light.attributes('aria-checked')).toBe('true')

    await light.trigger('click')
    expect(chooseGraphics).toHaveBeenLastCalledWith('high')
    expect(light.attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })

  it('shows the light mode already on for a visitor who took it', async () => {
    state.low = true
    const wrapper = mount(SettingsMenu, { attachTo: document.body })
    await wrapper.find('.settings-menu__gear').trigger('click')
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })
})
