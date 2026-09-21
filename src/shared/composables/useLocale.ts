import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { localeFromPath, type AppLocale } from '@/app/config/site'

export type { AppLocale }

/**
 * The URL is the single source of truth for language: `/` is Russian, `/en/`
 * is English. Each version is linkable, shareable, crawlable and cacheable,
 * and a shared link opens in the language it was shared in.
 */
export function useLocale() {
  const route = useRoute()

  const locale = computed<AppLocale>(() => localeFromPath(route.path))

  return { locale }
}
