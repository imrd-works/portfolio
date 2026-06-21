import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import ru from '@/locales/ru.json'
import homeEn from '@/pages/home/locales/en.json'
import homeRu from '@/pages/home/locales/ru.json'
import notFoundEn from '@/pages/not-found/locales/en.json'
import notFoundRu from '@/pages/not-found/locales/ru.json'

type Messages = Record<string, unknown>

function mergeMessages(base: Messages, pages: Messages): Messages {
  return { ...base, ...pages }
}

// Both locales are tiny and ship together so the RU/EN switch is instant with
// no async loading or flash of fallback copy.
const messages = {
  en: mergeMessages(en as Messages, { home: homeEn, notFound: notFoundEn }),
  ru: mergeMessages(ru as Messages, { home: homeRu, notFound: notFoundRu }),
}

export const i18n = createI18n({
  legacy: false,
  locale: 'ru',
  fallbackLocale: 'en',
  messages: messages as Parameters<typeof createI18n>[0]['messages'],
})
