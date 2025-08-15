// CASCADE_HINT: astro-i18n config kept minimal
import { defineAstroI18nConfig } from 'astro-i18n'

export default defineAstroI18nConfig({
  primaryLocale: 'en',
  secondaryLocales: ['es', 'ru'],
  fallbackLocale: 'en',
  showPrimaryLocale: false,
  trailingSlash: 'never',
})
