import {
  OG_LOCALE,
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  localeUrlPath,
  type AppLocale,
} from '@/app/config/site'
import { contactChannels, sameAs } from '@/shared/config/contacts'
import { projects } from '../model/portfolio'

export interface PersonSchemaInput {
  locale: AppLocale
  pageTitle: string
  pageDescription: string
  personName: string
  alternateName: string
  jobTitle: string
  locality: string
  region: string
  /** Localised project copy, in the order the Work section renders it. */
  works: { name: string; description: string }[]
}

/**
 * Fields a search engine or an AI answer engine can lift straight out of the
 * page. Everything here is also visible in the rendered document — no claims
 * exist only in the markup.
 */
const KNOWS_ABOUT = [
  'Vue.js',
  'Nuxt',
  'TypeScript',
  'JavaScript',
  'Frontend architecture',
  'Domain-Driven Design',
  'Feature-Sliced Design',
  'Data visualization',
  'Pinia',
  'GraphQL',
  'REST API',
  'Docker',
  'CI/CD',
  'Next.js',
  'Team leadership',
]

export function buildPortfolioSchema(input: PersonSchemaInput): Record<string, unknown> {
  const personId = `${SITE_URL}/#person`
  const websiteId = `${SITE_URL}/#website`
  const canonical = absoluteUrl(localeUrlPath(input.locale))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': personId,
        name: input.personName,
        alternateName: input.alternateName,
        url: canonical,
        image: absoluteUrl('/avatar.webp'),
        jobTitle: input.jobTitle,
        description: input.pageDescription,
        email: `mailto:${contactChannels.email}`,
        sameAs,
        knowsAbout: KNOWS_ABOUT,
        knowsLanguage: [
          { '@type': 'Language', name: 'Russian', alternateName: 'ru' },
          { '@type': 'Language', name: 'English', alternateName: 'en' },
        ],
        address: {
          '@type': 'PostalAddress',
          addressLocality: input.locality,
          addressRegion: input.region,
          addressCountry: 'RU',
        },
        hasOccupation: {
          '@type': 'Occupation',
          name: input.jobTitle,
          occupationalCategory: '15-1254.00',
          skills: KNOWS_ABOUT.join(', '),
        },
      },
      {
        '@type': 'WebSite',
        '@id': websiteId,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: OG_LOCALE[input.locale].replace('_', '-'),
        publisher: { '@id': personId },
      },
      {
        '@type': 'ProfilePage',
        '@id': `${canonical}#webpage`,
        url: canonical,
        name: input.pageTitle,
        description: input.pageDescription,
        inLanguage: OG_LOCALE[input.locale].replace('_', '-'),
        isPartOf: { '@id': websiteId },
        about: { '@id': personId },
        mainEntity: { '@id': personId },
        primaryImageOfPage: absoluteUrl(`/og-${input.locale}.jpg`),
      },
      {
        '@type': 'ItemList',
        '@id': `${canonical}#work`,
        name: input.pageTitle,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: input.works.length,
        itemListElement: input.works.map((work, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          item: {
            '@type': 'CreativeWork',
            name: work.name,
            description: work.description,
            creator: { '@id': personId },
            keywords: projects[index]?.tags.join(', '),
            inLanguage: OG_LOCALE[input.locale].replace('_', '-'),
          },
        })),
      },
    ],
  }
}
