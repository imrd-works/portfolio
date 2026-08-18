import { describe, expect, it } from 'vitest'
import { projects } from '../model/portfolio'
import { buildPortfolioSchema } from './schema'

const input = {
  locale: 'en' as const,
  pageTitle: 'Daniel Rassomakhin — Vue / Nuxt Developer and Team Lead',
  pageDescription: 'Senior frontend developer and team lead.',
  personName: 'Daniel Rassomakhin',
  alternateName: 'Rassomakhin (RU)',
  jobTitle: 'Senior Frontend Developer / Team Lead',
  locality: 'Novorossiysk',
  region: 'Krasnodar Krai',
  works: projects.map(({ id }) => ({ name: `Work ${id}`, description: `About ${id}` })),
}

function nodesOf(graph: Record<string, unknown>) {
  const list = graph['@graph'] as { '@type': string }[]
  return Object.fromEntries(list.map((node) => [node['@type'], node])) as Record<
    string,
    Record<string, unknown>
  >
}

describe('portfolio JSON-LD', () => {
  it('describes the person, the site, the page and the project list', () => {
    const nodes = nodesOf(buildPortfolioSchema(input))

    expect(Object.keys(nodes).sort()).toEqual(['ItemList', 'Person', 'ProfilePage', 'WebSite'])
    expect(nodes.Person.name).toBe(input.personName)
    expect(nodes.Person.jobTitle).toBe(input.jobTitle)
    expect(nodes.ItemList.numberOfItems).toBe(projects.length)
  })

  it('points every absolute URL at the locale being rendered', () => {
    const en = nodesOf(buildPortfolioSchema(input))
    const ru = nodesOf(buildPortfolioSchema({ ...input, locale: 'ru' }))

    expect(String(en.ProfilePage.url).endsWith('/en/')).toBe(true)
    expect(String(ru.ProfilePage.url).endsWith('/')).toBe(true)
    expect(en.ProfilePage.inLanguage).toBe('en-US')
    expect(ru.ProfilePage.inLanguage).toBe('ru-RU')
    expect(String(en.ProfilePage.primaryImageOfPage)).toContain('/og-en.jpg')
  })

  it('links the person to reachable profiles only', () => {
    const { Person } = nodesOf(buildPortfolioSchema(input))
    const sameAs = Person.sameAs as string[]

    expect(sameAs.length).toBeGreaterThan(0)
    expect(sameAs.every((url) => url.startsWith('https://'))).toBe(true)
    expect(String(Person.email).startsWith('mailto:')).toBe(true)
  })
})
