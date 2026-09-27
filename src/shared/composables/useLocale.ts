import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { localeFromPath, localizedPath, type AppLocale } from '@/app/config/site'

export type { AppLocale }

/**
 * The URL is the single source of truth for language: `/` is Russian, `/en/`
 * is English. Each version is linkable, shareable, crawlable and cacheable,
 * and a shared link opens in the language it was shared in. Switching is a
 * navigation between the two.
 */
export function useLocale() {
  const route = useRoute()

  const locale = computed<AppLocale>(() => localeFromPath(route.path))
  const other = computed<AppLocale>(() => (locale.value === 'ru' ? 'en' : 'ru'))

  /**
   * The same page in `target`, in its canonical form (`/en/`, with the slash, as
   * `rel=canonical` and static hosting have it), the open painting kept.
   */
  function pathFor(target: AppLocale): string {
    return `${localizedPath(route.path, target)}${route.hash}`
  }

  return { locale, other, pathFor }
}
