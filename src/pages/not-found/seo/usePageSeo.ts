import { useI18n } from 'vue-i18n'
import { useSiteSeo } from '@/app/seo/useSiteSeo'
import { useLocale } from '@/composables/useLocale'

export function usePageSeo() {
  const { t } = useI18n()
  const { locale } = useLocale()

  // `noindex` so a stray deep link never competes with the real page in
  // search results, and no hreflang alternates: 404 is not a translated page.
  useSiteSeo(() => ({
    locale: locale.value,
    title: `404 — ${t('notFound.title')}`,
    description: t('notFound.text'),
    canonicalPath: '/404',
    ogImagePath: `/og-${locale.value}.jpg`,
    ogImageAlt: t('notFound.title'),
    alternates: false,
    robots: 'noindex, follow',
    jsonLd: null,
  }))
}
