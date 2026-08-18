import { computed, toValue, type MaybeRefOrGetter } from 'vue'
import { useHead } from '@unhead/vue'
import {
  DEFAULT_LOCALE,
  OG_LOCALE,
  SITE_NAME,
  SUPPORTED_LOCALES,
  absoluteUrl,
  localeUrlPath,
  type AppLocale,
} from '@/app/config/site'

const GOOGLE_VERIFICATION = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION
const YANDEX_VERIFICATION = import.meta.env.VITE_YANDEX_VERIFICATION

export interface SiteSeoInput {
  /** Locale this document is rendered in. */
  locale: AppLocale
  title: string
  description: string
  /** Canonical path, e.g. `/` or `/en/`. */
  canonicalPath: string
  /** Absolute-from-root path of the social preview image. */
  ogImagePath: string
  ogImageAlt: string
  ogType?: 'website' | 'profile'
  /** `false` on pages that exist in a single language (404). */
  alternates?: boolean
  robots?: string
  /** schema.org graph, serialised into a single ld+json block. */
  jsonLd?: Record<string, unknown> | null
}

/**
 * The whole head of a document in one place: title, description, canonical,
 * hreflang alternates, Open Graph, Twitter cards, font preloads and JSON-LD.
 *
 * Everything here is emitted during the prerender pass, so a crawler, a
 * Telegram/LinkedIn unfurler or an ATS parser sees it in the raw HTML without
 * running any JavaScript.
 */
export function useSiteSeo(input: MaybeRefOrGetter<SiteSeoInput>) {
  const seo = computed(() => toValue(input))

  const canonical = computed(() => absoluteUrl(seo.value.canonicalPath))
  const ogImage = computed(() => absoluteUrl(seo.value.ogImagePath))

  // Only the subsets a page can actually paint. The English document never
  // touches the Cyrillic files, so it does not pay for them.
  const preloadedFonts = computed(() => {
    const files = ['geologica-latin.woff2', 'manrope-latin.woff2']
    if (seo.value.locale === 'ru') {
      files.unshift('geologica-cyrillic.woff2', 'manrope-cyrillic.woff2')
    }
    return files
  })

  useHead(() => {
    const current = seo.value

    const alternateLinks = current.alternates
      ? [
          ...SUPPORTED_LOCALES.map((locale) => ({
            rel: 'alternate' as const,
            hreflang: locale,
            href: absoluteUrl(localeUrlPath(locale)),
          })),
          {
            rel: 'alternate' as const,
            hreflang: 'x-default',
            href: absoluteUrl(localeUrlPath(DEFAULT_LOCALE)),
          },
        ]
      : []

    return {
      htmlAttrs: {
        lang: current.locale,
      },
      title: current.title,
      link: [
        { rel: 'canonical' as const, href: canonical.value },
        ...alternateLinks,
        ...preloadedFonts.value.map((file) => ({
          rel: 'preload' as const,
          as: 'font' as const,
          type: 'font/woff2',
          href: `/fonts/${file}`,
          crossorigin: 'anonymous' as const,
        })),
      ],
      meta: [
        { name: 'description', content: current.description },
        { name: 'robots', content: current.robots ?? 'index, follow, max-image-preview:large' },
        { name: 'author', content: SITE_NAME },

        // Ownership tokens, emitted only when configured.
        ...(GOOGLE_VERIFICATION
          ? [{ name: 'google-site-verification', content: GOOGLE_VERIFICATION }]
          : []),
        ...(YANDEX_VERIFICATION
          ? [{ name: 'yandex-verification', content: YANDEX_VERIFICATION }]
          : []),

        { property: 'og:type', content: current.ogType ?? 'website' },
        { property: 'og:site_name', content: SITE_NAME },
        { property: 'og:url', content: canonical.value },
        { property: 'og:title', content: current.title },
        { property: 'og:description', content: current.description },
        { property: 'og:image', content: ogImage.value },
        { property: 'og:image:type', content: 'image/jpeg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: current.ogImageAlt },
        { property: 'og:locale', content: OG_LOCALE[current.locale] },
        ...(current.alternates
          ? SUPPORTED_LOCALES.filter((locale) => locale !== current.locale).map((locale) => ({
              property: 'og:locale:alternate',
              content: OG_LOCALE[locale],
            }))
          : []),

        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: current.title },
        { name: 'twitter:description', content: current.description },
        { name: 'twitter:image', content: ogImage.value },
        { name: 'twitter:image:alt', content: current.ogImageAlt },
      ],
      script: current.jsonLd
        ? [
            {
              type: 'application/ld+json',
              innerHTML: JSON.stringify(current.jsonLd),
            },
          ]
        : [],
    }
  })
}
