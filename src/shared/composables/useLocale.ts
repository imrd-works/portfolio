import { watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useLocalStorage } from '@vueuse/core'

export type AppLocale = 'ru' | 'en'

const STORAGE_KEY = 'app-locale'

function syncDocumentLang(value: AppLocale) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = value
  }
}

// Bilingual switch for the portfolio. Wraps vue-i18n's `locale` with
// localStorage persistence and keeps `<html lang>` in sync for a11y / SEO.
export function useLocale() {
  const { locale } = useI18n()
  const stored = useLocalStorage<AppLocale>(STORAGE_KEY, 'ru')

  if (locale.value !== stored.value) {
    locale.value = stored.value
  }
  syncDocumentLang(stored.value)

  watch(locale, (value) => {
    const next = value as AppLocale
    stored.value = next
    syncDocumentLang(next)
  })

  function toggle() {
    locale.value = locale.value === 'ru' ? 'en' : 'ru'
  }

  function setLocale(value: AppLocale) {
    locale.value = value
  }

  return { locale, toggle, setLocale }
}
