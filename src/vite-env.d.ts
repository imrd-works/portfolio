/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Base URL of the contact-form backend (Yandex Cloud Function).
  // Unset -> the form runs in demo mode (no real delivery).
  readonly VITE_CONTACT_API_URL?: string
  // Canonical origin of the deployed site. Drives canonical URLs, hreflang,
  // Open Graph, JSON-LD, robots.txt and the sitemap.
  readonly VITE_SITE_URL?: string
  // Ownership tokens for Google Search Console / Yandex Webmaster. Optional:
  // the meta tag is emitted only when the variable is set.
  readonly VITE_GOOGLE_SITE_VERIFICATION?: string
  readonly VITE_YANDEX_VERIFICATION?: string
  /** Yandex Metrica's counter number; without it no analytics loads. */
  readonly VITE_YANDEX_METRIKA_ID?: string
  /** Google Analytics 4 measurement ID (`G-…`); without it the tag does not load. */
  readonly VITE_GA_MEASUREMENT_ID?: string
}

declare module 'virtual:svg-icons-register' {
  const component: unknown
  export default component
}
