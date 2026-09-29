import { useI18n } from 'vue-i18n'
import { useSiteSeo } from '@/app/seo/useSiteSeo'
import { useLocale } from '@/composables/useLocale'
import { PRIVACY_PATH, localizedPath } from '@/app/config/site'

export function usePageSeo() {
  const { t } = useI18n()
  const { locale } = useLocale()

  // Linked from every page and there for anyone to read, but nothing to find in
  // search: `noindex`, and it stays out of the sitemap.
  useSiteSeo(() => ({
    locale: locale.value,
    title: t('privacy.meta.title'),
    description: t('privacy.meta.description'),
    canonicalPath: localizedPath(PRIVACY_PATH, locale.value),
    ogImagePath: '/og.jpg',
    ogImageAlt: t('privacy.title'),
    alternates: {
      ru: localizedPath(PRIVACY_PATH, 'ru'),
      en: localizedPath(PRIVACY_PATH, 'en'),
    },
    robots: 'noindex, follow',
    jsonLd: null,
  }))
}
