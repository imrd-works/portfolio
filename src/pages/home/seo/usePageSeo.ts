import { useI18n } from 'vue-i18n'
import { useSiteSeo } from '@/app/seo/useSiteSeo'
import { useLocale } from '@/composables/useLocale'
import { localeUrlPath } from '@/app/config/site'
import { projects } from '../model/portfolio'
import { buildPortfolioSchema } from './schema'

export function usePageSeo() {
  const { t } = useI18n()
  const { locale } = useLocale()

  useSiteSeo(() => {
    const active = locale.value
    const works = projects.map((project) => ({
      name: t(`home.work.items.${project.id}.title`),
      description: t(`home.work.items.${project.id}.desc`),
    }))

    return {
      locale: active,
      title: t('home.meta.title'),
      description: t('home.meta.description'),
      canonicalPath: localeUrlPath(active),
      ogImagePath: `/og-${active}.jpg`,
      ogImageAlt: t('home.meta.ogAlt'),
      ogType: 'profile' as const,
      alternates: true,
      jsonLd: buildPortfolioSchema({
        locale: active,
        pageTitle: t('home.meta.title'),
        pageDescription: t('home.meta.description'),
        personName: t('home.meta.personName'),
        alternateName: t('home.meta.alternateName'),
        jobTitle: t('home.meta.jobTitle'),
        locality: t('home.meta.locality'),
        region: t('home.meta.region'),
        works,
      }),
    }
  })
}
