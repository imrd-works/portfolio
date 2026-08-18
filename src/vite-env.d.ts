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
}

declare module 'virtual:svg-icons-register' {
  const component: unknown
  export default component
}
