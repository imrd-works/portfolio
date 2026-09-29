// Static, non-translatable portfolio data. Human-readable copy lives in the
// locale files; here we keep only language-neutral values (latin tech names,
// links, accent colours) referenced by id from the views.

export interface CoreSkill {
  /** i18n keys: the strength's name and what it gives the one who hires. */
  id: 'vue' | 'typescript' | 'dataviz' | 'architecture' | 'react'
}

// Deliberately no percentages: "Vue 95%" is a number nobody can verify and
// everybody has seen on a template. Each strength says what it gives instead
// — a result a client can hold the work to — and the names are localised,
// because "Architecture and team" says more to a recruiter than "DDD / FSD".
export const coreSkills: CoreSkill[] = [
  { id: 'vue' },
  { id: 'typescript' },
  { id: 'dataviz' },
  { id: 'architecture' },
  { id: 'react' },
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
          'Zustand',
          'React Router',
          'TanStack Query',
          'Axios',
        ],
      },
      {
        id: 'forms',
        chips: ['Vee-validate / Yup', 'Zod', 'Vuelidate', 'React Hook Form', 'TipTap'],
      },
      {
        id: 'markup',
        chips: [
          'HTML5',
          'CSS3',
          'SCSS / SASS',
          'PostCSS',
          'PostHTML',
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

/**
 * The core stack, worked with all the time (not all of it in every project):
 * inked solid; the rest, used in projects when needed, are outlines. The legend
 * under the tabs says so.
 */
export const strongChips: string[] = [
  'Vue 3',
  'Nuxt 3 / 4',
  'Nitro',
  'SSR / SSG / ISR',
  'TypeScript',
  'JavaScript ES6+',
  'Vite',
  'Pinia',
  'TanStack Query',
  'Axios',
  'VueUse',
  'Vee-validate / Yup',
  'REST API',
  'OpenAPI / Swagger',
  'HTML5',
  'CSS3',
  'SCSS / SASS',
  'PostCSS',
  'BEM',
  'GSAP',
  'Responsive / Cross-browser',
  'Pixel-perfect',
  'Figma',
  'DDD',
  'FSD',
  'ESLint / Prettier',
  'Stylelint',
  'Husky / lint-staged',
  'Git (GitHub / GitLab)',
  'npm / Yarn / PNPM',
  'CI/CD (GitHub Actions / GitLab CI)',
  'SEO (sitemap, robots, Open Graph)',
  'Lighthouse',
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

/** Two kinds: a system (a platform, a product, the logic behind it) or a website. */
export type ProjectKind = 'system' | 'site'

export interface Project {
  /** Neutral: it is in the painting's address (#/work/<id>), and the clients are under NDA. */
  id: 'corporate' | 'energy' | 'education' | 'finance' | 'monitoring' | 'documents' | 'processes'
  kind: ProjectKind
  /** Years of work on it, as shown on the sheet. */
  years: string
  /**
   * A sumi-e painting standing in for the product (the real screens are under
   * NDA), served from `public/work/`.
   */
  art: string
  /**
   * Latin stack names, identical in both locales. `main`, shown inked, is what the project
   * is written in: its framework and language, the same way for every project; the rest
   * comes by group, each under its caption (`home.work.toolGroups.*`).
   */
  tools: { main: string[]; groups: Partial<Record<ToolGroup, string[]>> }
}

/** The groups a project's tools are shown in, in this order. */
export type ToolGroup =
  | 'data'
  | 'ui'
  | 'visual'
  | 'styles'
  | 'design'
  | 'signature'
  | 'api'
  | 'backend'
  | 'architecture'
  | 'content'
  | 'build'
  | 'quality'
  | 'seo'
  | 'delivery'
  | 'repo'

export const toolGroups: ToolGroup[] = [
  'data',
  'ui',
  'visual',
  'styles',
  'design',
  'signature',
  'api',
  'backend',
  'architecture',
  'content',
  'build',
  'quality',
  'seo',
  'delivery',
  'repo',
]

export const projectKinds: ProjectKind[] = ['system', 'site']

export const projects: Project[] = [
  {
    id: 'corporate',
    kind: 'site',
    years: '2026',
    art: '/work/corporate.webp',
    tools: {
      main: ['Nuxt 3', 'Vue 3', 'TypeScript'],
      groups: {
        data: ['Vee-validate', 'Yup', 'libphonenumber-js'],
        ui: ['@nuxt/image', 'nuxt-svgo', 'nuxt-viewport', '@nuxtjs/device'],
        visual: ['GSAP', 'Anime.js', 'Lenis', 'WebGL'],
        styles: ['SCSS'],
        design: ['Figma', 'Pixel Perfect'],
        api: ['reCAPTCHA v3'],
        backend: ['PHP', 'nginx'],
        content: ['Sanity CMS'],
        build: ['pnpm', 'Vitest', 'Playwright'],
        quality: ['ESLint', 'Prettier'],
        seo: ['SEO', 'Lighthouse', 'Google Analytics', 'Yandex Metrica'],
        delivery: ['GitHub Actions', 'CI/CD'],
        repo: ['GitHub'],
      },
    },
  },
  {
    id: 'energy',
    kind: 'system',
    years: '2025–2026',
    art: '/work/energy.webp',
    tools: {
      main: ['Vue 3', 'TypeScript'],
      groups: {
        data: ['Pinia', 'Vue Query', 'VueUse', 'Vuelidate'],
        visual: ['ECharts', 'GSAP'],
        styles: ['SCSS', 'BEM'],
        design: ['Figma', 'Pixel Perfect'],
        signature: ['CryptoPro'],
        api: ['REST API', 'Axios', 'OpenAPI', 'Swagger', 'Postman'],
        build: ['Vite', 'Vitest'],
        quality: ['ESLint', 'Prettier', 'Stylelint', 'Husky'],
        repo: ['GitLab'],
      },
    },
  },
  {
    id: 'education',
    kind: 'system',
    years: '2024–2025',
    art: '/work/education.webp',
    tools: {
      main: ['Nuxt 3 / 4', 'Vue 3', 'TypeScript'],
      groups: {
        data: ['Pinia', 'Vue Query', 'VueUse', 'Vee-validate / Yup'],
        ui: ['Vuetify', 'Vue Cal', 'Vue Datepicker', 'Vuedraggable', 'Maska'],
        visual: ['Highcharts'],
        styles: ['SCSS', 'BEM'],
        design: ['Figma', 'Pixel Perfect'],
        api: ['REST API', 'OpenAPI', 'Swagger', 'Nuxt Auth'],
        backend: [
          'Node.js',
          'Ts.ED',
          'Express',
          'TypeORM',
          'PostgreSQL',
          'Redis',
          'BullMQ',
          'MinIO',
          'JWT',
        ],
        architecture: ['DDD → FSD'],
        content: ['TipTap', 'KaTeX'],
        build: ['Vitest', 'Playwright'],
        quality: ['ESLint', 'Prettier', 'Stylelint'],
        delivery: ['Docker', 'Docker Compose', 'GitLab CI'],
        repo: ['GitLab'],
      },
    },
  },
  {
    id: 'finance',
    kind: 'site',
    years: '2026',
    art: '/work/finance.webp',
    tools: {
      main: ['Next.js', 'React', 'TypeScript'],
      groups: {
        visual: ['GSAP', 'Lottie', 'Swiper'],
        styles: ['SCSS', 'CSS Modules', 'BEM'],
        design: ['Figma', 'Pixel Perfect'],
        content: ['Sanity CMS', 'Portable Text'],
        quality: ['ESLint', 'Prettier'],
        seo: ['SEO', 'Google Tag Manager', 'Google Analytics', 'Microsoft Clarity', 'HubSpot'],
        delivery: ['Vercel', 'CI/CD', 'Telegram Bot API'],
        repo: ['GitHub'],
      },
    },
  },
  {
    id: 'monitoring',
    kind: 'system',
    years: '2022–2023',
    art: '/work/monitoring.webp',
    tools: {
      main: ['Vue 3', 'JavaScript'],
      groups: {
        data: ['Pinia', 'Vee-validate'],
        visual: ['SVG', 'Data Viz'],
        styles: ['SCSS', 'BEM'],
        design: ['Figma', 'Pixel Perfect'],
        api: ['GraphQL'],
        quality: ['ESLint', 'Prettier'],
        repo: ['GitLab'],
      },
    },
  },
  {
    id: 'documents',
    kind: 'system',
    years: '2022–2023',
    art: '/work/documents.webp',
    tools: {
      main: ['Vue 3', 'TypeScript'],
      groups: {
        data: ['Pinia', 'Vee-validate / Yup'],
        ui: ['Vuedraggable'],
        visual: ['Highcharts'],
        styles: ['SCSS', 'BEM'],
        design: ['Figma', 'Pixel Perfect'],
        api: ['REST API', 'Axios'],
        architecture: ['Component-based'],
        quality: ['ESLint', 'Prettier'],
        repo: ['GitHub'],
      },
    },
  },
  {
    id: 'processes',
    kind: 'system',
    years: '2022–2023',
    art: '/work/process.webp',
    tools: {
      main: ['Vue 2.7', 'JavaScript → TypeScript'],
      groups: {
        data: ['Vuex → Pinia', 'VueUse', 'Vee-validate / Yup'],
        styles: ['Sass', 'BEM'],
        design: ['Figma', 'Pixel Perfect'],
        api: ['REST API', 'Axios', 'Swagger', 'WebSocket'],
        architecture: ['Component-based', 'Options API → Composition API'],
        quality: ['ESLint', 'Prettier'],
        repo: ['GitLab'],
      },
    },
  },
]

/** A project's tools by group, in the order the groups are always shown; empty ones left out. */
export function toolGroupsOf(project: Project): { id: ToolGroup; tools: string[] }[] {
  return toolGroups
    .map((id) => ({ id, tools: project.tools.groups[id] ?? [] }))
    .filter((g) => g.tools.length)
}

/** Every tool of a project, the main ones first (the structured data's keywords). */
export function allToolsOf(project: Project): string[] {
  return [...project.tools.main, ...toolGroupsOf(project).flatMap((g) => g.tools)]
}

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
