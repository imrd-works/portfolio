import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import SettingsMenu from './SettingsMenu.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const state = { low: false, clarity: 2 as 1 | 1.5 | 2, choices: [1, 1.5, 2] as (1 | 1.5 | 2)[] }
const listeners: ((level: 'high' | 'low') => void)[] = []
const notify = () => listeners.forEach((fn) => fn(state.low ? 'low' : 'high'))
const chooseGraphics = vi.fn((level: 'high' | 'low') => {
  state.low = level === 'low'
  notify()
})
const chooseClarity = vi.fn((c: 1 | 1.5 | 2) => {
  state.clarity = c
  notify()
})
vi.mock('@/shared/lib/graphics', () => ({
  graphics: {
    get low() {
      return state.low
    },
    get clarity() {
      return state.clarity
    },
  },
  clarityChoices: () => state.choices,
  onGraphicsChange: (fn: (level: 'high' | 'low') => void) => {
    listeners.push(fn)
    return () => {}
  },
  chooseGraphics: (level: 'high' | 'low') => chooseGraphics(level),
  chooseClarity: (c: 1 | 1.5 | 2) => chooseClarity(c),
}))

/** The menu, open. */
async function openMenu() {
  const wrapper = mount(SettingsMenu, { attachTo: document.body })
  await wrapper.find('.popover-button__trigger').trigger('click')
  return wrapper
}

const checked = (wrapper: Awaited<ReturnType<typeof openMenu>>) =>
  wrapper.findAll<HTMLInputElement>('input[type="radio"]').find((r) => r.element.checked)?.element
    .value

describe('SettingsMenu', () => {
  beforeEach(() => {
    state.low = false
    state.clarity = 2
    state.choices = [1, 1.5, 2]
    listeners.length = 0
    chooseGraphics.mockClear()
    chooseClarity.mockClear()
  })

  it('opens its panel from the gear', async () => {
    const wrapper = mount(SettingsMenu, { attachTo: document.body })
    const gear = wrapper.find('.popover-button__trigger')
    expect(gear.attributes('aria-expanded')).toBe('false')
    expect(wrapper.find('.popover-button__panel').exists()).toBe(false)
    await gear.trigger('click')
    expect(gear.attributes('aria-expanded')).toBe('true')
    expect(wrapper.find('.popover-button__panel').exists()).toBe(true)
    wrapper.unmount()
  })

  it('turns the light mode on and back off', async () => {
    const wrapper = mount(SettingsMenu, { attachTo: document.body })
    await wrapper.find('.popover-button__trigger').trigger('click')
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
    await wrapper.find('.popover-button__trigger').trigger('click')
    expect(wrapper.find('[role="switch"]').attributes('aria-checked')).toBe('true')
    wrapper.unmount()
  })

  it('sets the clarity on a dense screen, 2x until the visitor chooses', async () => {
    const wrapper = await openMenu()
    const radios = wrapper.findAll('input[type="radio"]')
    expect(radios).toHaveLength(3)
    expect(checked(wrapper)).toBe('2')

    await radios[0].setValue(true)
    expect(chooseClarity).toHaveBeenLastCalledWith(1)
    expect(checked(wrapper)).toBe('1')
    wrapper.unmount()
  })

  it('has no clarity to choose on a 1x screen', async () => {
    state.choices = [1]
    const wrapper = await openMenu()
    expect(wrapper.find('fieldset').exists()).toBe(false)
    wrapper.unmount()
  })

  it('holds the clarity still in the light mode, which draws at 1x anyway', async () => {
    state.low = true
    const wrapper = await openMenu()
    expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
