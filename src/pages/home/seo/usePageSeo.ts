import { useI18n } from 'vue-i18n'
import { useSeoMeta } from '@/composables/useSeo'

export function usePageSeo() {
  const { t } = useI18n()

  useSeoMeta({
    title: () => t('home.meta.title'),
    description: () => t('home.meta.description'),
    ogTitle: () => t('home.meta.title'),
    ogDescription: () => t('home.meta.description'),
    ogType: 'website',
  })
}
