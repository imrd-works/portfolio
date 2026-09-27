// Single source of truth for everything the SEO layer needs to build absolute
// URLs. `VITE_SITE_URL` is injected at build time (a GitHub Actions secret in
// CI, `.env` locally), so moving to a custom domain is a one-variable change.

export const SUPPORTED_LOCALES = ['ru', 'en'] as const

export type AppLocale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: AppLocale = 'ru'

/** Route paths, as vue-router matches them (no trailing slash). */
export const LOCALE_ROUTE_PATH: Record<AppLocale, string> = {
  ru: '/',
  en: '/en',
}

/**
 * Canonical URLs, always with a trailing slash for the non-default locale:
 * static hosting resolves `/en/` to `/en/index.html`, and one canonical form
 * keeps crawlers from seeing `/en` and `/en/` as two pages.
 */
const LOCALE_CANONICAL_PATH: Record<AppLocale, string> = {
  ru: '/',
  en: '/en/',
}

/** `og:locale` values (underscore form, per the Open Graph spec). */
export const OG_LOCALE: Record<AppLocale, string> = {
  ru: 'ru_RU',
  en: 'en_US',
}

const RAW_SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:4173'

/** Origin without a trailing slash, e.g. `https://rassomakhin.dev`. */
export const SITE_URL = RAW_SITE_URL.replace(/\/+$/, '')

export const SITE_NAME = 'Daniel Rassomakhin'

/** Build an absolute URL from an app path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/** Canonical path for a locale's home page (`/` or `/en/`). */
export function localeUrlPath(locale: AppLocale): string {
  return LOCALE_CANONICAL_PATH[locale]
}

/** The privacy policy, in the default locale (`localizedPath` gives the others). */
export const PRIVACY_PATH = '/privacy/'

/** A page's path in its canonical form: always with a trailing slash. */
function withSlash(path: string): string {
  return path.endsWith('/') ? path : `${path}/`
}

/**
 * The same page in `locale`, in its canonical form: `/privacy` in English is
 * `/en/privacy/`, `/en/` in Russian is `/`.
 */
export function localizedPath(path: string, locale: AppLocale): string {
  const page = withSlash(localeFromPath(path) === 'en' ? path.slice(3) || '/' : path)
  return locale === DEFAULT_LOCALE ? page : `/${locale}${page}`
}

/** `/en`, `/en/`, `/en/foo` -> `en`; anything else -> the default locale. */
export function localeFromPath(path: string): AppLocale {
  return path === '/en' || path.startsWith('/en/') ? 'en' : DEFAULT_LOCALE
}
