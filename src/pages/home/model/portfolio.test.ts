import { describe, expect, it } from 'vitest'
import en from '../locales/en.json'
import ru from '../locales/ru.json'
import {
  contactChannels,
  allChips,
  coreSkills,
  homeOf,
  rowsFor,
  sharedRows,
  stackGroups,
  strongChips,
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
      expect((ru.skills.coreName as Record<string, string>)[id]).toBeTruthy()
      expect((en.skills.coreName as Record<string, string>)[id]).toBeTruthy()
    }
  })

  it('lists no technology the CV does not claim', () => {
    const chips = allChips

    expect(stackGroups.map(({ id }) => id)).toEqual(['frontend', 'backend', 'devops', 'fullstack'])
    // every row is named in both locales, and none is left empty
    for (const { rows } of stackGroups) {
      for (const row of rows) {
        expect(row.chips.length).toBeGreaterThan(0)
        expect((ru.skills.rows as Record<string, string>)[row.id]).toBeTruthy()
        expect((en.skills.rows as Record<string, string>)[row.id]).toBeTruthy()
      }
    }
    expect(strongChips.every((chip) => chips.includes(chip))).toBe(true)
    // a shared tool is filed once, on the fullstack tab
    for (const chip of sharedRows.flatMap(({ chips }) => chips)) {
      expect(chips.filter((x) => x === chip)).toHaveLength(1)
      expect(homeOf(chip)).toBe('fullstack')
    }
    // every row is named after what is in it, in both locales, and shown once
    const shown = (['frontend', 'backend', 'devops', 'fullstack'] as const).flatMap((id) =>
      rowsFor(id).flatMap(({ chips }) => chips)
    )
    expect(new Set(shown).size).toBe(shown.length)
    // versions of one tool go up, so Vue 2 stands before Vue 3
    const frameworks = rowsFor('frontend').find(({ id }) => id === 'frameworks')?.chips ?? []

    expect(frameworks.indexOf('Vue 2 / 2.7')).toBeLessThan(frameworks.indexOf('Vue 3'))
    expect(frameworks.indexOf('Nuxt 2')).toBeLessThan(frameworks.indexOf('Nuxt 3 / 4'))
    // the language and the build tools serve both sides
    expect(homeOf('JavaScript ES6+')).toBe('fullstack')
    expect(homeOf('npm / Yarn / PNPM')).toBe('fullstack')
    expect(homeOf('Google Analytics')).toBe('frontend')
    // the framework is named once, on the frontend tab; the server work it
    // carries is filed under fullstack by its own names
    expect(homeOf('Nuxt 3 / 4')).toBe('frontend')
    expect(homeOf('SSR / SSG / ISR')).toBe('fullstack')
    expect(homeOf('Next.js API routes')).toBe('fullstack')
    // a CMS project is the whole site: templates, admin and the data behind it
    expect(homeOf('Sanity')).toBe('fullstack')
    expect(homeOf('WordPress')).toBe('fullstack')
    expect(rowsFor('frontend').flatMap(({ chips }) => chips)).not.toContain('TypeScript')
    expect(rowsFor('fullstack').flatMap(({ chips }) => chips)).toEqual(
      expect.arrayContaining(['TypeScript', 'OpenAPI / Swagger', 'Docker'])
    )
  })

  it('backs the headline numbers with things listed on the page', () => {
    expect(stats.map(({ id }) => id)).toEqual(['systems', 'launches', 'lead'])
    // Work shows a selection: never more systems than the count claims
    expect(stats.find(({ id }) => id === 'systems')?.value).toBeGreaterThanOrEqual(projects.length)
    expect(Object.keys(ru.about.stats)).toEqual(['systems', 'launches', 'lead'])
    expect(Object.keys(en.about.stats)).toEqual(['systems', 'launches', 'lead'])
  })

  it('represents the Vue and Nuxt specialization from the CV', () => {
    expect(coreSkills[0]).toEqual({ id: 'vue' })
    expect(ru.skills.coreName.vue).toBe('Vue / Nuxt')
    const frontend =
      stackGroups.find(({ id }) => id === 'frontend')?.rows.flatMap(({ chips }) => chips) ?? []

    expect(frontend).toEqual(expect.arrayContaining(['Vue 3', 'Nuxt 3 / 4', 'Pinia']))
    expect(ru.meta.title).toContain('Vue / Nuxt')
    expect(en.meta.title).toContain('Vue / Nuxt')
  })

  it('includes six named CV projects with their stacks and full details', () => {
    expect(projects.map(({ id }) => id)).toEqual([
      'sigma',
      'education',
      'bitcoin',
      'moex',
      'irlix',
      'baccasoft',
    ])
    // NDA: the paintings stand in for the products, no screens or links
    expect(projects.map(({ art }) => art)).toEqual([
      '/work/energy.webp',
      '/work/education.webp',
      '/work/bitcoin.webp',
      '/work/monitoring.webp',
      '/work/documents.webp',
      '/work/process.webp',
    ])
    expect(projects.every((p) => !('href' in p) && !('image' in p))).toBe(true)
    expect(projects.find(({ id }) => id === 'bitcoin')?.tools.main).toContain('Next.js')
    expect(projects.find(({ id }) => id === 'baccasoft')?.tools.main).toContain('Vue 2.7')
    for (const locale of [ru, en]) {
      for (const { id, kind } of projects) {
        const item = locale.work.items[id]
        expect(item.about.length).toBeGreaterThan(80)
        expect(item.role).toMatch(/Developer/)
        expect(item.did.split('\n').length).toBeGreaterThanOrEqual(3)
        expect(locale.work.kinds[kind]).toBeTruthy()
      }
    }
    expect(ru.work.items.sigma.about).toContain('CryptoPro')
    expect(en.work.items.moex.about).toContain('monitoring')
  })

  it('uses neutral localized project titles without company names', () => {
    expect(projects.every((project) => !('title' in project))).toBe(true)
    const ruTitles = Object.values(ru.work.items).map(({ title }) => title)

    expect(ruTitles).toHaveLength(projects.length)
    expect(ruTitles.every((title) => /[\u0400-\u04ff]/.test(title))).toBe(true)
    expect(ruTitles.join(' ')).not.toMatch(/SIGMA-IT|Afterlogic|MOEX|IRLIX|BACCASOFT/)
    expect(en.work.items.moex.title).toBe('Financial Monitoring Portal')
  })

  it('shows six steps in reverse chronological order, one per print on the river', () => {
    expect(timeline.map(({ id }) => id)).toEqual([
      'current',
      'energyLead',
      'educationLead',
      'complexSystems',
      'commercialStart',
      'startups',
    ])
  })

  it('describes career growth through projects and responsibilities in both locales', () => {
    type ExperienceCopy = { period: string; role: string; desc: string }
    const ids = timeline.map(({ id }) => id)
    const ruItems = ru.experience.items as Record<string, ExperienceCopy>
    const enItems = en.experience.items as Record<string, ExperienceCopy>

    expect(Object.keys(ruItems)).toEqual(ids)
    expect(Object.keys(enItems)).toEqual(ids)
    // junior, middle, senior and lead, then fullstack and DevOps today
    expect(ids.map((id) => enItems[id]?.role)).toEqual([
      'Fullstack / DevOps Developer',
      'Senior Frontend Developer / Team Lead',
      'Senior Frontend Developer / Team Lead',
      'Middle Frontend Developer',
      'Junior Frontend Developer',
      'Frontend developer in startups',
    ])
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

    expect(ruItems.educationLead?.period).toContain('2024')
    // the two senior steps follow one another instead of overlapping
    expect(enItems.educationLead?.period).toBe('June — November 2024, March — November 2025')
    expect(enItems.energyLead?.period).toBe('December 2025 — February 2026')
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
