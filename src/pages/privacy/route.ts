import type { RouteRecordRaw } from 'vue-router'
import { PRIVACY_PATH, localizedPath } from '@/app/config/site'

const PrivacyPage = () => import('./views/PrivacyPage.vue')
const PortfolioLayout = () => import('@/layouts/PortfolioLayout.vue')

/**
 * The privacy policy, one record per locale (`/privacy/`, `/en/privacy/`), in the
 * portfolio's layout: the cookie and the settings are in its corner here too.
 */
export const privacyRoutes: RouteRecordRaw[] = (['ru', 'en'] as const).map((locale) => ({
  path: localizedPath(PRIVACY_PATH, locale).replace(/\/$/, ''),
  component: PortfolioLayout,
  children: [
    {
      path: '',
      name: locale === 'ru' ? 'Privacy' : 'PrivacyEn',
      component: PrivacyPage,
      meta: { locale },
    },
  ],
}))
