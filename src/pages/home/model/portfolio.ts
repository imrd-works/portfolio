// Static, non-translatable portfolio data. Human-readable copy lives in the
// locale files; here we keep only language-neutral values (latin tech names,
// links, accent colours) referenced by id from the views.

export interface CoreSkill {
  /** i18n key for the localised "how long / on what" line. */
  id: 'vue' | 'typescript' | 'dataviz' | 'architecture' | 'react'
  /** Latin stack name — identical in both locales. */
  label: string
}

// Deliberately no percentages: "Vue 95%" is a number nobody can verify and
// everybody has seen on a template. Each entry carries the years and the
// systems it was used on instead — claims that match the projects below.
export const coreSkills: CoreSkill[] = [
  { id: 'vue', label: 'Vue 3 / Nuxt 3–4' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'dataviz', label: 'Complex UI / Data Viz' },
  { id: 'architecture', label: 'DDD / FSD / Team Lead' },
  { id: 'react', label: 'React / Next.js' },
]

export const frontendChips: string[] = [
  'Vue 3',
  'Vue 2.7',
  'Nuxt 3 / 4',
  'TypeScript',
  'JavaScript ES6+',
  'HTML5 / CSS3',
  'SCSS / SASS',
  'Pinia',
  'Vuex',
  'Vue Router',
  'Vue Query',
  'VueUse',
  'Vee-validate / Yup',
  'Vuelidate',
  'Vuetify',
  'Tailwind CSS',
  'Bootstrap',
  'Material Design',
  'TipTap',
  'GSAP',
  'React / Next.js',
]

export const backendChips: string[] = [
  'REST / OpenAPI',
  'GraphQL / Apollo',
  'Axios / Fetch',
  'WebSocket / Socket.io',
  'Postman',
  'CryptoPro',
  'i18n',
  'Highcharts',
  'ECharts',
  'Chart.js',
  'SVG Data Viz',
  'Vite',
  'Webpack',
  'ESLint / Prettier',
  'PostCSS',
  'BEM',
  'Vitest',
  'Docker',
  'CI/CD',
  'GitHub Actions / GitLab CI',
  'Vercel',
  'Git',
  'Node / PHP · Yii2',
  'Sanity · Shopify · WP',
]

export const toolsChips: string[] = [
  'Figma',
  'Adobe XD',
  'Photoshop',
  'Storybook',
  'Cursor / Copilot',
  'Jira',
  'Notion',
  'ClickUp',
  'Agile / Scrum',
]

export const techMarquee: string[] = [
  'Vue 3',
  'Nuxt 4',
  'TypeScript',
  'Pinia',
  'Vue Query',
  'Highcharts',
  'Docker',
  'CI/CD',
]

export interface StatItem {
  id: 'systems' | 'launches' | 'lead'
  value: number
  suffix: string
}

// Countable facts that map onto the sections below — six systems are listed
// in Work, the team lead years line up with the timeline in Path. Round
// "20+ projects / 50+ technologies" badges say nothing and check out against
// nothing.
export const stats: StatItem[] = [
  { id: 'systems', value: 6, suffix: '' },
  { id: 'launches', value: 2, suffix: '' },
  { id: 'lead', value: 3, suffix: '+' },
]

export interface Project {
  id: 'sigma' | 'education' | 'bitcoin' | 'moex' | 'irlix' | 'baccasoft'
  tags: string[]
  image?: string
  href?: string
}

export const projects: Project[] = [
  {
    id: 'sigma',
    tags: ['Vue 3', 'TypeScript', 'CryptoPro · ECharts'],
    image: '/altai.webp',
  },
  {
    id: 'education',
    tags: ['Nuxt 3 / 4', 'TypeScript', 'DDD · Highcharts'],
    image: '/academy.webp',
  },
  {
    id: 'bitcoin',
    tags: ['Next.js', 'Sanity', 'GSAP · Vercel'],
    image: '/twoprime.webp',
  },
  {
    id: 'moex',
    tags: ['Vue 3', 'GraphQL', 'SVG · Data Viz'],
    image: '/moex.webp',
  },
  {
    id: 'irlix',
    tags: ['Vue 3', 'TypeScript', 'Highcharts · Pinia'],
  },
  {
    id: 'baccasoft',
    tags: ['Vue 2.7', 'TypeScript', 'Pinia · REST'],
    image: '/transport.webp',
  },
]

export interface TimelineEntry {
  id: 'fullstack' | 'energyLead' | 'educationLead' | 'complexSystems' | 'commercialStart'
  dot: string
}

export const timeline: TimelineEntry[] = [
  { id: 'fullstack', dot: 'var(--color-accent)' },
  { id: 'energyLead', dot: '#8b7be0' },
  { id: 'educationLead', dot: '#6c66c8' },
  { id: 'complexSystems', dot: '#555196' },
  { id: 'commercialStart', dot: '#46427e' },
]

export type ServiceId = 'vue' | 'systems' | 'landing' | 'product' | 'integrations' | 'leadership'
export const services: ServiceId[] = [
  'vue',
  'systems',
  'landing',
  'product',
  'integrations',
  'leadership',
]

// Contacts live in `shared/config` — the app-level SEO layer reads them too.
export { contactChannels, socials, sameAs } from '@/shared/config/contacts'
export type { SocialLink } from '@/shared/config/contacts'

// Anchor targets used by the in-page navigation.
export const sectionNav = ['about', 'skills', 'work', 'path', 'contact'] as const
export type SectionId = (typeof sectionNav)[number]
