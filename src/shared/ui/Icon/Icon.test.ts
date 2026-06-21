import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Icon from './Icon.vue'

describe('Icon', () => {
  it('renders a decorative sprite icon by default', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'close',
      },
      attrs: {
        class: 'custom-icon',
        'data-test': 'icon',
      },
    })

    expect(wrapper.attributes('aria-hidden')).toBe('true')
    expect(wrapper.attributes('role')).toBeUndefined()
    expect(wrapper.classes()).toEqual(expect.arrayContaining(['icon', 'custom-icon']))
    expect(wrapper.attributes('data-test')).toBe('icon')
    expect(wrapper.get('use').attributes('href')).toBe('#icon-close')
  })

  it('renders an accessible image when title is provided', () => {
    const wrapper = mount(Icon, {
      props: {
        name: 'search',
        title: 'Search',
        width: 20,
        height: 18,
      },
    })

    expect(wrapper.attributes('aria-hidden')).toBeUndefined()
    expect(wrapper.attributes('role')).toBe('img')
    expect(wrapper.attributes('aria-label')).toBe('Search')
    expect(wrapper.attributes('width')).toBe('20')
    expect(wrapper.attributes('height')).toBe('18')
    expect(wrapper.find('title').exists()).toBe(false)
  })
})
