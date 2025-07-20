import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enTranslations from './locales/en/translation.json'
import arTranslations from './locales/ar/translation.json'

const resources = {
  en: {
    translation: enTranslations
  },
  ar: {
    translation: arTranslations
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false // React already escapes values
    },

    detection: {
      order: ['path', 'localStorage', 'navigator'],
      lookupFromPathIndex: 0,
      caches: ['localStorage'],
    }
  })
  .then(() => {
    // Set document direction after i18n is initialized
    const detectedLang = i18n.language?.split('-')[0] as 'en' | 'ar';
    const finalLang = detectedLang === 'ar' ? 'ar' : 'en';
    
    // Ensure document direction is set immediately
    document.documentElement.dir = finalLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = finalLang;
    
    // Also set the language in i18n if it's different
    if (i18n.language !== finalLang) {
      i18n.changeLanguage(finalLang);
    }
    
    console.log('i18n initialized with language:', finalLang);
  });

export default i18n 