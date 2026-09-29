/**
 * The shape of the privacy policy: its sections in order, and what each one
 * has besides its title (the copy itself is in the locale files, `privacy.*`).
 * Change what the site collects, and this page with it.
 */

export interface PolicySection {
  id: string
  /** A paragraph, `privacy.sections.<id>.text`. */
  text?: boolean
  /** A list, `…items`, one item a line. */
  items?: boolean
  /** A paragraph after the list, `…note`. */
  note?: boolean
  /** Label and text pairs, `…facts.<key>.label` / `.text`, in this order. */
  facts?: string[]
  /** The owner's contacts. */
  contacts?: boolean
  /** The switch of the visitor's consent to analytics, and the services' policies. */
  consent?: boolean
}

export const policySections: PolicySection[] = [
  { id: 'owner', text: true, contacts: true },
  { id: 'data', text: true, items: true, note: true },
  { id: 'form', facts: ['what', 'why', 'how', 'keep', 'basis'] },
  {
    id: 'analytics',
    text: true,
    facts: ['what', 'who', 'cookies', 'basis', 'change'],
    consent: true,
  },
  { id: 'browser', text: true, items: true },
  { id: 'hosting', text: true },
  { id: 'rights', text: true },
  { id: 'changes', text: true },
]

/** The services' own privacy policies (their names: `privacy.sources.<id>`). */
export const serviceSources = [
  { id: 'yandex', href: 'https://yandex.ru/legal/confidential/' },
  { id: 'google', href: 'https://policies.google.com/privacy' },
  { id: 'telegram', href: 'https://telegram.org/privacy' },
]
