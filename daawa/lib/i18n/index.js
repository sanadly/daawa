import { createInstance } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';
import i18nConfig from '../../i18n.config'; // Corrected path

export async function initServerI18next(lng, ns) {
  const i18nInstance = createInstance();
  await i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language, namespace) => 
      import(`../../public/locales/${language}/${namespace}.json`)
    ))
    .init({
      lng,
      ns,
      defaultNS: i18nConfig.defaultNS,
      fallbackLng: i18nConfig.defaultLocale,
      supportedLngs: i18nConfig.locales,
      preload: typeof window === 'undefined' ? i18nConfig.locales : [],
      interpolation: {
        escapeValue: false, // React already safes from xss
      },
    });
  return i18nInstance;
}

export async function getTranslations(lng, ns = i18nConfig.defaultNS, options = {}) {
  const i18nextInstance = await initServerI18next(lng, ns);
  return {
    t: i18nextInstance.getFixedT(lng, Array.isArray(ns) ? ns[0] : ns, options.keyPrefix),
    i18n: i18nextInstance,
  };
} 