import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Button from './Button.vue'

function mountButton(props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  return mount(Button, {
    props,
    slots,
    global: {
      stubs: {
        Icon: {
          props: ['name', 'size'],
          template: '<span data-test="icon" />',
        },
      },
    },
  })
}

describe('Button', () => {
  it('renders a primary medium button by default', () => {
    const wrapper = mountButton({}, { default: 'Save' })

    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['btn', 'btn--primary', 'btn--m']))
    expect(wrapper.text()).toBe('Save')
  })

  it('supports variants, sizes, custom tags and disabled state', () => {
    const wrapper = mountButton(
      {
        tag: 'a',
        variant: 'outline',
        size: 'l',
        disabled: true,
        ariaLabel: 'Open details',
      },
      { default: 'Details' }
    )

    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('disabled')).toBeUndefined()
    expect(wrapper.attributes('aria-disabled')).toBe('true')
    expect(wrapper.attributes('aria-label')).toBe('Open details')
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['btn--outline', 'btn--l']))
  })

  it('renders icons, icon-only mode and loading state', () => {
    const iconWrapper = mountButton({
      icon: 'search',
      ariaLabel: 'Search',
      size: 's',
    })

    expect(iconWrapper.classes()).toContain('btn--icon-only')
    expect(iconWrapper.find('[data-test="icon"]').exists()).toBe(true)
    expect(iconWrapper.find('.btn__label').exists()).toBe(false)

    const loadingWrapper = mountButton(
      {
        loading: true,
        icon: 'search',
      },
      { default: 'Loading' }
    )

    expect(loadingWrapper.classes()).toContain('btn--loading')
    expect(loadingWrapper.attributes('disabled')).toBeDefined()
    expect(loadingWrapper.find('.btn__spinner').exists()).toBe(true)
    expect(loadingWrapper.find('.btn__icon').exists()).toBe(false)
  })
})
