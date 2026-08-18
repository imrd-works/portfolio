import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEFAULT_LOCALE, localeFromPath, localeUrlPath, type AppLocale } from '@/app/config/site'

export type { AppLocale }

/**
 * The URL is the single source of truth for language: `/` is Russian, `/en/`
 * is English. Switching languages is a navigation, not hidden client state —
 * so each version is linkable, shareable, crawlable and cacheable, and a
 * shared link opens in the language it was shared in.
 */
export function useLocale() {
  const route = useRoute()
  const router = useRouter()

  const locale = computed<AppLocale>(() => localeFromPath(route.path))
  const other = computed<AppLocale>(() => (locale.value === 'ru' ? 'en' : 'ru'))

  /**
   * Same page, other language — the current section anchor is preserved.
   * Uses the canonical form (`/en/`, with the trailing slash) so the address
   * bar matches `rel=canonical` and what static hosting actually serves.
   */
  function pathFor(target: AppLocale): string {
    return `${localeUrlPath(target)}${route.hash}`
  }

  function setLocale(target: AppLocale): void {
    if (target === locale.value) return
    void router.push(pathFor(target))
  }

  function toggle(): void {
    setLocale(other.value)
  }

  return { locale, other, defaultLocale: DEFAULT_LOCALE, pathFor, setLocale, toggle }
}
