// Identity and contact data. Lives in `shared` because both the page sections
// and the app-level SEO layer (JSON-LD `sameAs`, `email`) read from it — one
// place to change a handle.

export interface SocialLink {
  label: string
  href?: string
}

export const socials: SocialLink[] = [{ label: 'GitHub', href: 'https://github.com/imrd-works' }]

/** Primary contact channels surfaced in the hero and contact section. */
export const contactChannels = {
  telegramUrl: 'https://t.me/IIMRD',
  telegramHandle: '@IIMRD',
  email: 'imld.works@yandex.ru',
  resumeUrl: '/Rassomakhin_CV.pdf',
}

/** Profiles a search engine can use to connect the dots (schema.org sameAs). */
export const sameAs: string[] = [
  ...socials.flatMap(({ href }) => (href ? [href] : [])),
  contactChannels.telegramUrl,
]
