import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'
import ru from '../locales/ru.json'
import {
  contactChannels,
  coreSkills,
  frontendChips,
  projects,
  socials,
  stats,
  timeline,
} from './portfolio'

describe('portfolio CV data', () => {
  it('uses the current contacts and downloadable CV', () => {
    expect(contactChannels).toMatchObject({
      telegramUrl: 'https://t.me/IIMRD',
      telegramHandle: '@IIMRD',
      email: 'imld.works@yandex.ru',
      resumeUrl: '/Rassomakhin_CV.pdf',
    })
    expect(socials).toEqual([{ label: 'GitHub', href: 'https://github.com/imrd-works' }])
  })

  it('states core skills without unverifiable percentage bars', () => {
    expect(coreSkills.every((skill) => !('value' in skill))).toBe(true)
    expect(coreSkills.map(({ id }) => id)).toEqual([
      'vue',
      'typescript',
      'dataviz',
      'architecture',
      'react',
    ])
    for (const { id } of coreSkills) {
      expect((ru.skills.core as Record<string, string>)[id]?.length ?? 0).toBeGreaterThan(20)
      expect((en.skills.core as Record<string, string>)[id]?.length ?? 0).toBeGreaterThan(20)
    }
  })

  it('backs the headline numbers with things listed on the page', () => {
    expect(stats.map(({ id }) => id)).toEqual(['systems', 'launches', 'lead'])
    expect(stats.find(({ id }) => id === 'systems')?.value).toBe(projects.length)
    expect(Object.keys(ru.about.stats)).toEqual(['systems', 'launches', 'lead'])
    expect(Object.keys(en.about.stats)).toEqual(['systems', 'launches', 'lead'])
  })

  it('represents the Vue and Nuxt specialization from the CV', () => {
    expect(coreSkills[0]).toEqual({ id: 'vue', label: 'Vue 3 / Nuxt 3–4' })
    expect(frontendChips).toEqual(expect.arrayContaining(['Vue 3', 'Nuxt 3 / 4', 'Pinia']))
    expect(ru.hero.status).toContain('Vue / Nuxt')
    expect(en.hero.status).toContain('Vue / Nuxt')
  })

  it('includes six named CV projects and no placeholder links', () => {
    expect(projects.map(({ id }) => id)).toEqual([
      'sigma',
      'education',
      'bitcoin',
      'moex',
      'irlix',
      'baccasoft',
    ])
    expect(projects.flatMap(({ image }) => (image ? [image] : []))).toEqual([
      '/altai.webp',
      '/academy.webp',
      '/twoprime.webp',
      '/moex.webp',
      '/transport.webp',
    ])
    expect(projects.find(({ id }) => id === 'bitcoin')?.image).toBe('/twoprime.webp')
    expect(projects.find(({ id }) => id === 'moex')?.image).toBe('/moex.webp')
    expect(projects.find(({ id }) => id === 'baccasoft')?.image).toBe('/transport.webp')
    expect(projects.every(({ href }) => href === undefined)).toBe(true)
    expect(ru.work.items.sigma.desc.length).toBeGreaterThan(50)
    expect(en.work.items.education.desc).toContain('education')
    expect(ru.work.items.bitcoin.desc).toContain('Next.js')
    expect(en.work.items.moex.desc).toContain('monitoring')
    expect(ru.work.items.irlix.placeholder).toContain('Vue 3')
    expect(en.work.items.baccasoft.placeholder).toContain('Vue 2.7')
  })

  it('uses neutral localized project titles without company names', () => {
    expect(projects.every((project) => !('title' in project))).toBe(true)
    const ruTitles = Object.values(ru.work.items).map(({ title }) => title)

    expect(ruTitles).toHaveLength(projects.length)
    expect(ruTitles.every((title) => /[\u0400-\u04ff]/.test(title))).toBe(true)
    expect(ruTitles.join(' ')).not.toMatch(/SIGMA-IT|Afterlogic|MOEX|IRLIX|BACCASOFT/)
    expect(en.work.items.moex.title).toBe('Financial Monitoring Portal')
  })

  it('shows six responsibility milestones in reverse chronological order', () => {
    expect(timeline.map(({ id }) => id)).toEqual([
      'current',
      'fullstack',
      'energyLead',
      'educationLead',
      'complexSystems',
      'commercialStart',
    ])
  })

  it('describes career growth through projects and responsibilities in both locales', () => {
    type ExperienceCopy = { period: string; role: string; desc: string }
    const ids = timeline.map(({ id }) => id)
    const ruItems = ru.experience.items as Record<string, ExperienceCopy>
    const enItems = en.experience.items as Record<string, ExperienceCopy>

    expect(Object.keys(ruItems)).toEqual(ids)
    expect(Object.keys(enItems)).toEqual(ids)
    expect(ruItems.fullstack?.role).toBe('Fullstack Developer / Team Lead')
    expect(enItems.energyLead?.role).toBe('Frontend Developer / Team Lead')
    expect(enItems.educationLead?.desc).toContain('mentoring')
    expect(ruItems.energyLead?.desc).toContain('code review')
    expect(ids.every((id) => (ruItems[id]?.desc.length ?? 0) > 100)).toBe(true)
    expect(ids.every((id) => (enItems[id]?.desc.length ?? 0) > 100)).toBe(true)
    expect(ids.map((id) => ruItems[id]?.desc).join(' ')).not.toMatch(
      /SIGMA-IT|Afterlogic|MOEX|IRLIX|BACCASOFT/
    )
  })

  it('keeps the timeline current and shows collaboration at every career stage', () => {
    type ExperienceCopy = { period: string; role: string; desc: string }
    const ruItems = ru.experience.items as Record<string, ExperienceCopy>
    const enItems = en.experience.items as Record<string, ExperienceCopy>
    const ids = timeline.map(({ id }) => id)

    expect(ruItems.fullstack?.role).toBe('Fullstack Developer / Team Lead')
    expect(enItems.fullstack?.role).toBe('Fullstack Developer / Team Lead')
    expect(ruItems.educationLead?.period).toContain('2024')
    expect(enItems.educationLead?.period).toBe('June — November 2024, March 2025 — February 2026')
    // The timeline must reach today, not stop at the last finished project.
    expect(enItems.current?.period).toContain('present')
    expect(
      ids.every((id) => /\u043a\u043e\u043c\u0430\u043d\u0434/i.test(ruItems[id]?.desc ?? ''))
    ).toBe(true)
    expect(ids.every((id) => /team|developers|collaborat/i.test(enItems[id]?.desc ?? ''))).toBe(
      true
    )
  })
})
