/** @type {import('next-i18next').UserConfig} */
module.exports = {
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'ar'],
    localeDetection: true, // Automatically detect user's preferred language
  },
  /**
   * @link https://github.com/i18next/next-i18next#6-advanced-configuration
   */
  // localePath: path.resolve('./public/locales'), // Not needed if locales are in public/locales
  reloadOnPrerender: process.env.NODE_ENV === 'development',
}; 