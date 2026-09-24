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

export type StackId = 'frontend' | 'backend' | 'devops' | 'fullstack'

export interface StackRow {
  /** Names the part a tool plays here: framework, state, charts, hosting… */
  id: string
  chips: string[]
}

export interface StackGroup {
  id: StackId
  rows: StackRow[]
}

/**
 * The same technologies as the CV, on two levels: the direction a client hires
 * for, and the job each tool does inside it. Nothing is dropped, and a client
 * reading "we need charts" finds one short row instead of a wall of names.
 */
export const stackGroups: StackGroup[] = [
  {
    id: 'frontend',
    rows: [
      {
        id: 'frameworks',
        chips: ['Vue 2 / 2.7', 'Vue 3', 'Nuxt 2', 'Nuxt 3 / 4', 'React', 'Next.js'],
      },
      {
        id: 'state',
        chips: [
          'Pinia',
          'Vuex',
          'Vue Router',
          'VueUse',
          'Redux / Redux Toolkit',
          'React Router',
          'TanStack Query',
          'Axios',
        ],
      },
      { id: 'forms', chips: ['Vee-validate / Yup', 'Vuelidate', 'React Hook Form', 'TipTap'] },
      {
        id: 'markup',
        chips: [
          'HTML5',
          'CSS3',
          'SCSS / SASS',
          'PostCSS',
          'Pug',
          'BEM',
          'Tailwind CSS',
          'styled-components',
          'Vuetify',
          'Material UI',
          'vue-sonner',
          'nuxt-svgo',
          'nuxt-viewport',
          'opentype.js',
          'Responsive / Cross-browser',
          'Pixel-perfect',
        ],
      },
      { id: 'charts', chips: ['Highcharts', 'ECharts', 'Chart.js', 'SVG Data Viz'] },
      { id: 'motion', chips: ['GSAP', 'Lottie', 'Anime.js', 'Swiper'] },
      { id: 'analytics', chips: ['Yandex Metrica', 'Google Analytics'] },
      {
        id: 'perf',
        chips: [
          '@nuxt/image',
          'Lighthouse',
          'PageSpeed Insights',
          'Core Web Vitals',
          'SEO (sitemap, robots, Open Graph)',
        ],
      },
    ],
  },
  {
    id: 'backend',
    rows: [
      { id: 'languages', chips: ['Symfony', 'PHP / Yii2', 'Twig'] },
      { id: 'databases', chips: ['PostgreSQL'] },
    ],
  },
  {
    id: 'devops',
    rows: [
      { id: 'delivery', chips: ['CI/CD (GitHub Actions / GitLab CI)', 'FTP / SFTP deploy'] },
      { id: 'hosting', chips: ['Nginx', 'Traefik', 'Vercel'] },
      { id: 'storage', chips: ['MinIO (S3)'] },
    ],
  },
  {
    id: 'fullstack',
    rows: [
      {
        id: 'server',
        chips: [
          'SSR / SSG / ISR',
          'Nitro',
          'h3 server routes',
          'h3-compression',
          'Next.js API routes',
          'Server middleware and auth',
        ],
      },
      { id: 'architecture', chips: ['DDD', 'FSD', 'Atomic Design', 'Legacy refactoring'] },
      {
        id: 'quality',
        chips: [
          'Vitest',
          'Vue Test Utils / Nuxt Test Utils',
          'Playwright (E2E)',
          'ESLint / Prettier',
          'Stylelint',
          'Husky / lint-staged',
          'Git (GitHub / GitLab)',
          'GitKraken / Sourcetree / GitHub Desktop',
          'Code review',
        ],
      },
      {
        id: 'teamwork',
        chips: ['Agile / Scrum / Kanban', 'Jira', 'ClickUp', 'Notion', 'Toggl'],
      },
      { id: 'services', chips: ['i18n', 'HubSpot'] },
      {
        id: 'tools',
        chips: [
          'WebStorm',
          'VS Code',
          'Chrome DevTools',
          'Vue DevTools',
          'Postman',
          'Figma',
          'Adobe XD',
          'Cursor',
          'GitHub Copilot',
          'Codex / Claude',
        ],
      },
    ],
  },
]

/**
 * Tools that work on both sides. They live on the fullstack tab — standing
 * there says by itself that they are used in more than one direction.
 */
export const sharedRows: StackRow[] = [
  { id: 'languages', chips: ['TypeScript', 'JavaScript ES6+', 'Node'] },
  {
    id: 'api',
    chips: ['REST API', 'OpenAPI / Swagger', 'Apollo (GraphQL)', 'CryptoPro', 'reCAPTCHA'],
  },
  { id: 'cms', chips: ['Sanity', 'WordPress', 'Shopify', '1C-Bitrix'] },
  { id: 'build', chips: ['Vite', 'Webpack', 'npm / Yarn / PNPM', 'Docker'] },
]

/** Which direction a tool is filed under. */
export const homeOf = (chip: string): StackId | undefined =>
  sharedRows.some((row) => row.chips.includes(chip))
    ? 'fullstack'
    : stackGroups.find(({ rows }) => rows.some((row) => row.chips.includes(chip)))?.id

/** What a tab shows: its own rows, plus the shared ones under fullstack. */
export const rowsFor = (id: StackId): StackRow[] => {
  const own = stackGroups.find((group) => group.id === id)?.rows ?? []
  return id === 'fullstack' ? [...sharedRows, ...own] : own
}

/** How many technologies a tab shows. */
export const stackCount = (id: StackId): number =>
  rowsFor(id).reduce((total, row) => total + row.chips.length, 0)

/** Every technology on the page, in one list. */
export const allChips: string[] = (
  ['frontend', 'backend', 'devops', 'fullstack'] as StackId[]
).flatMap((id) => rowsFor(id).flatMap(({ chips }) => chips))

/** Worked with day to day: these are inked solid, the rest are outlines. */
export const strongChips: string[] = [
  'Vue 3',
  'Nuxt 3 / 4',
  'SSR / SSG / ISR',
  'TypeScript',
  'Pinia',
  'TanStack Query',
  'SCSS / SASS',
  'Highcharts',
  'ECharts',
  'SVG Data Viz',
  'REST API',
  'Node',
  'PostgreSQL',
  'Docker',
  'CI/CD (GitHub Actions / GitLab CI)',
  'DDD',
  'FSD',
  'Code review',
]

export interface StatItem {
  id: 'systems' | 'launches' | 'lead'
  value: number
  suffix: string
}

// Countable facts, as the author counts them over the whole path. Work shows
// a selection of six of the systems, so it can never list more than there
// are; the team lead years add up the lead periods in Path: June to November
// 2024, March 2025 to February 2026 and March to June 2026, 22 months.
export const stats: StatItem[] = [
  { id: 'systems', value: 25, suffix: '+' },
  { id: 'launches', value: 13, suffix: '' },
  { id: 'lead', value: 2, suffix: '' },
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
  id: 'current' | 'energyLead' | 'educationLead' | 'complexSystems' | 'commercialStart' | 'startups'
}

// Reverse chronological, one step per print on the river: the startups before
// the first job, then junior, middle, senior and lead, and fullstack / DevOps
// today. The periods follow the CV; the two senior steps are split where they
// used to overlap, and the startup years and the grades come from the author.
export const timeline: TimelineEntry[] = [
  { id: 'current' },
  { id: 'energyLead' },
  { id: 'educationLead' },
  { id: 'complexSystems' },
  { id: 'commercialStart' },
  { id: 'startups' },
]

// Contacts live in `shared/config` — the app-level SEO layer reads them too.
export { contactChannels, socials, sameAs } from '@/shared/config/contacts'
export type { SocialLink } from '@/shared/config/contacts'
