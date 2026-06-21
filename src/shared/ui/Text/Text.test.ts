import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Text from './Text.vue'

describe('Text', () => {
  it('renders body text as a paragraph by default', () => {
    const wrapper = mount(Text, {
      slots: {
        default: 'Body copy',
      },
    })

    expect(wrapper.element.tagName).toBe('P')
    expect(wrapper.classes()).toContain('text--variant-body-m')
    expect(wrapper.classes()).toContain('text--tone-primary')
    expect(wrapper.text()).toBe('Body copy')
  })

  it('supports custom tag, variant and tone', () => {
    const wrapper = mount(Text, {
      props: {
        tag: 'h2',
        variant: 'heading-l',
        tone: 'danger',
      },
      slots: {
        default: 'Danger heading',
      },
    })

    expect(wrapper.element.tagName).toBe('H2')
    expect(wrapper.classes()).toContain('text--variant-heading-l')
    expect(wrapper.classes()).toContain('text--tone-danger')
  })
})
