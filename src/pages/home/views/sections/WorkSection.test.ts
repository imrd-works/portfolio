import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WorkSection from './WorkSection.vue'
import workSectionSource from './WorkSection.vue?raw'
import { projects } from '../../model/portfolio'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

describe('WorkSection', () => {
  it('marks projects without public links as NDA work', () => {
    const wrapper = shallowMount(WorkSection, {
      global: {
        renderStubDefaultSlot: true,
        directives: {
          magnetic: {},
          tilt: {},
        },
      },
    })

    expect(wrapper.findAll('.work__nda-badge')).toHaveLength(
      projects.filter(({ href }) => !href).length
    )
  })

  it('renders the matching project preview images', () => {
    const wrapper = shallowMount(WorkSection, {
      global: {
        renderStubDefaultSlot: true,
        directives: {
          magnetic: {},
          tilt: {},
        },
      },
    })

    expect(wrapper.findAll('.work__image').map((image) => image.attributes('src'))).toEqual([
      '/altai.webp',
      '/academy.webp',
      '/twoprime.webp',
      '/moex.webp',
      '/transport.webp',
    ])
  })

  it('keeps a text preview for projects without an image', () => {
    const wrapper = shallowMount(WorkSection, {
      global: {
        renderStubDefaultSlot: true,
        directives: {
          magnetic: {},
          tilt: {},
        },
      },
    })

    expect(wrapper.findAll('.work__placeholder')).toHaveLength(projects.length)
    expect(wrapper.findAll('.work__image')).toHaveLength(
      projects.filter(({ image }) => image).length
    )
  })

  it('clips each composited preview image from the first animation frame', () => {
    expect(workSectionSource).toMatch(/\.work__image\s*\{[\s\S]*?border-radius:\s*inherit;/)
  })

  it('renders project names from the active locale', () => {
    expect(workSectionSource).toContain('t(`home.work.items.${project.id}.title`)')
    expect(workSectionSource).not.toContain('project.title')
  })
})
