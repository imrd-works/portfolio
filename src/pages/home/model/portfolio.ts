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

// The chip groups mirror the "Key skills" table of the CV, plus the stacks
// named under the projects listed below. Nothing here is on the site but
// absent from the CV: a recruiter reading both documents side by side should
// not find a single technology that only one of them claims.

export const frontendChips: string[] = [
  'Vue 3',
  'Vue 2 / 2.7',
  'Nuxt 3 / 4',
  'Nuxt 2',
  'React',
  'Next.js',
  'TypeScript',
  'JavaScript ES6+',
  'HTML5',
  'CSS3',
  'SCSS / SASS',
  'Pug',
  'Pinia',
  'Vuex',
  'Vue Router',
  'Vue Query',
  'VueUse',
  'Vee-validate / Yup',
  'Vuelidate',
  'Vuetify',
  'Tailwind CSS',
  'TipTap',
  'GSAP',
  'Lottie',
  'Anime.js',
  'Swiper',
]

export const dataChips: string[] = [
  'REST API',
  'OpenAPI / Swagger',
  'Apollo (GraphQL)',
  'Axios',
  'i18n',
  'CryptoPro',
  'Highcharts',
  'ECharts',
  'Chart.js',
  'SVG Data Viz',
  'Yandex Metrica',
  'reCAPTCHA',
  'HubSpot',
]

export const platformChips: string[] = [
  'Node',
  'Sanity',
  'Symfony',
  'Twig',
  'PHP / Yii2',
  'WordPress',
  'Shopify',
  'PostgreSQL',
  'Vite',
  'Webpack',
  'npm / Yarn / PNPM',
  'ESLint / Prettier',
  'PostCSS',
  'Vitest',
  'Docker',
  'CI/CD',
  'GitHub Actions / GitLab CI',
  'Vercel',
  'Nginx',
  'Traefik',
  'MinIO (S3)',
]

export const toolsChips: string[] = [
  'DDD',
  'FSD',
  'BEM',
  'Responsive / Cross-browser',
  'Code review',
  'Legacy refactoring',
  'Git (GitHub / GitLab)',
  'Figma',
  'Adobe XD',
  'Postman',
  'Cursor',
  'GitHub Copilot',
  'Codex / Claude',
  'Agile / Scrum / Kanban',
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

export type ProjectKind = 'system' | 'product' | 'landing'

export interface Project {
  id: 'sigma' | 'education' | 'bitcoin' | 'moex' | 'irlix' | 'baccasoft'
  kind: ProjectKind
  /** Years of work on it, as shown on the sheet. */
  years: string
  /**
   * A sumi-e painting standing in for the product (the real screens are under
   * NDA), served from `public/work/`.
   */
  art: string
  /** Latin stack names, identical in both locales; `main` are shown inked. */
  tools: { main: string[]; rest: string[] }
}

export const projectKinds: ProjectKind[] = ['system', 'product', 'landing']

export const projects: Project[] = [
  {
    id: 'sigma',
    kind: 'system',
    years: '2025–2026',
    art: '/work/energy.webp',
    tools: {
      main: ['Vue 3', 'TypeScript'],
      rest: ['Pinia', 'ECharts', 'CryptoPro', 'REST API', 'Vite', 'Vitest'],
    },
  },
  {
    id: 'education',
    kind: 'product',
    years: '2024–2026',
    art: '/work/education.webp',
    tools: {
      main: ['Nuxt 3 / 4', 'TypeScript'],
      rest: ['Vue 3', 'Pinia', 'DDD', 'Highcharts', 'WYSIWYG', 'Vitest', 'REST API'],
    },
  },
  {
    id: 'bitcoin',
    kind: 'landing',
    years: '2026',
    art: '/work/bitcoin.webp',
    tools: {
      main: ['Next.js', 'GSAP'],
      rest: ['Sanity CMS', 'TypeScript', 'SEO', 'Analytics', 'Docker', 'CI/CD'],
    },
  },
  {
    id: 'moex',
    kind: 'system',
    years: '2022–2023',
    art: '/work/monitoring.webp',
    tools: { main: ['Vue 3', 'GraphQL'], rest: ['TypeScript', 'SVG', 'Data Viz', 'Pinia'] },
  },
  {
    id: 'irlix',
    kind: 'system',
    years: '2022–2023',
    art: '/work/documents.webp',
    tools: { main: ['Vue 3', 'Pinia'], rest: ['TypeScript', 'Highcharts', 'REST API'] },
  },
  {
    id: 'baccasoft',
    kind: 'system',
    years: '2022–2023',
    art: '/work/process.webp',
    tools: { main: ['Vue 2.7', 'Pinia'], rest: ['TypeScript', 'REST API', 'WebSocket'] },
  },
]

export interface TimelineEntry {
  id:
    | 'current'
    | 'fullstack'
    | 'energyLead'
    | 'educationLead'
    | 'complexSystems'
    | 'commercialStart'
  dot: string
}

// Reverse chronological. Periods here mirror the CV exactly — a recruiter
// comparing the two documents should find the same dates in both.
export const timeline: TimelineEntry[] = [
  { id: 'current', dot: 'var(--color-accent)' },
  { id: 'fullstack', dot: '#9a8ae8' },
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
