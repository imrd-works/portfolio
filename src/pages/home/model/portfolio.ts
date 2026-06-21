// Static, non-translatable portfolio data. Human-readable copy lives in the
// locale files; here we keep only language-neutral values (latin tech names,
// percentages, links, accent colours) referenced by id from the views.

export interface SkillBar {
  label: string
  value: number
}

export const coreSkills: SkillBar[] = [
  { label: 'Vue 3 / Nuxt 3–4', value: 95 },
  { label: 'TypeScript', value: 92 },
  { label: 'Complex UI / Data Viz', value: 90 },
  { label: 'DDD / FSD / Team Lead', value: 88 },
  { label: 'React / Next.js', value: 70 },
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
  id: 'years' | 'projects' | 'tech'
  value: number
  suffix: string
}

export const stats: StatItem[] = [
  { id: 'years', value: 5, suffix: '+' },
  { id: 'projects', value: 20, suffix: '+' },
  { id: 'tech', value: 50, suffix: '+' },
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

export type ServiceId =
  | 'vue'
  | 'systems'
  | 'landing'
  | 'product'
  | 'integrations'
  | 'leadership'
export const services: ServiceId[] = [
  'vue',
  'systems',
  'landing',
  'product',
  'integrations',
  'leadership',
]

export interface SocialLink {
  label: string
  href?: string
}

export const socials: SocialLink[] = [{ label: 'GitHub', href: 'https://github.com/imrd-works' }]

// Primary contact channels surfaced in the hero and contact section.
export const contactChannels = {
  telegramUrl: 'https://t.me/IIMRD',
  telegramHandle: '@IIMRD',
  email: 'imld.works@yandex.ru',
  resumeUrl: '/Rassomakhin_CV.pdf',
}

// Anchor targets used by the in-page navigation.
export const sectionNav = ['about', 'skills', 'work', 'path', 'contact'] as const
export type SectionId = (typeof sectionNav)[number]
