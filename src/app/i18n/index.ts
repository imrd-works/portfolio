import { createI18n } from 'vue-i18n'
import type { I18n } from 'vue-i18n'
import type { WritableComputedRef } from 'vue'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import homeEn from '@/pages/home/locales/en.json'
import homeRu from '@/pages/home/locales/ru.json'
import notFoundEn from '@/pages/not-found/locales/en.json'
import notFoundRu from '@/pages/not-found/locales/ru.json'
import privacyEn from '@/pages/privacy/locales/en.json'
import privacyRu from '@/pages/privacy/locales/ru.json'
import { DEFAULT_LOCALE, type AppLocale } from '@/app/config/site'
import { typographMessages } from '@/shared/lib/typograph'

type Messages = Record<string, unknown>

function mergeMessages(base: Messages, pages: Messages): Messages {
  return { ...base, ...pages }
}

// Both locales are tiny and ship together so the RU/EN switch is instant with
// no async loading or flash of fallback copy. The line-break rules are applied
// here, once, so every string follows them and the locale files stay plain.
const messages = {
  en: typographMessages(
    mergeMessages(en as Messages, { home: homeEn, notFound: notFoundEn, privacy: privacyEn }),
    'en'
  ),
  ru: typographMessages(
    mergeMessages(ru as Messages, { home: homeRu, notFound: notFoundRu, privacy: privacyRu }),
    'ru'
  ),
}

// A factory, not a singleton: the prerender step builds one app per locale in
// the same Node process, and a shared instance would leak state between them.
export function createAppI18n(locale: AppLocale = DEFAULT_LOCALE): I18n {
  return createI18n({
    legacy: false,
    locale,
    fallbackLocale: DEFAULT_LOCALE,
    messages: messages as Parameters<typeof createI18n>[0]['messages'],
  })
}

/** Switches the active language on a `legacy: false` i18n instance. */
export function setI18nLocale(i18n: I18n, locale: AppLocale): void {
  const active = i18n.global.locale as unknown as WritableComputedRef<string>
  if (active.value !== locale) active.value = locale
}
