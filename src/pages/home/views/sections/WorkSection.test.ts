import { shallowMount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import WorkSection from './WorkSection.vue'
import workSectionSource from './WorkSection.vue?raw'
import { projects } from '../../model/portfolio'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}))

const mountWork = () => shallowMount(WorkSection)

describe('WorkSection', () => {
  it('pins a sheet for every project, in the prerendered HTML too', () => {
    const wrapper = mountWork()
    const sheets = wrapper.findAll('.work__sheet')

    expect(sheets.map((s) => s.attributes('data-id'))).toEqual(projects.map(({ id }) => id))
    expect(wrapper.findAll('.work__name').map((n) => n.text())).toEqual(
      projects.map(({ id }) => `home.work.items.${id}.title`)
    )
  })

  it('shows the paintings it has and waits blank for the rest', () => {
    const wrapper = mountWork()

    expect(wrapper.findAll('.work__art[src]').map((img) => img.attributes('src'))).toEqual(
      projects.flatMap(({ art }) => (art ? [art] : []))
    )
    expect(wrapper.findAll('.work__soon')).toHaveLength(projects.filter(({ art }) => !art).length)
  })

  it('offers a filter for every kind of project', () => {
    const wrapper = mountWork()

    expect(wrapper.findAll('.work__filter').map((f) => f.text())).toEqual([
      'home.work.filters.all',
      'home.work.filters.system',
      'home.work.filters.product',
      'home.work.filters.landing',
    ])
  })

  it('keeps the painting closed until a sheet is chosen', () => {
    const wrapper = mountWork()

    expect(wrapper.find('.work__inside').classes()).not.toContain('work__inside--on')
    expect(wrapper.find('.work__body').exists()).toBe(false)
  })

  it('renders project copy from the active locale', () => {
    expect(workSectionSource).toContain('t(`home.work.items.${p.id}.title`)')
    expect(workSectionSource).not.toContain('project.title')
  })
})
