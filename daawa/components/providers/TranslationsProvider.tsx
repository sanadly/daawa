'use client';

import React, { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18next from 'i18next';
import HttpApi from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import i18nConfig from '../../i18n.config';

const getLoadPath = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin.endsWith('/') 
                   ? window.location.origin.slice(0, -1) 
                   : window.location.origin;
    return `${origin}/locales/{{lng}}/{{ns}}.json`;
  }
  return '/locales/{{lng}}/{{ns}}.json'; 
};

let i18nInitialized = false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const initializeClientI18next = (lng?: string, initialResources?: any) => {
  if (i18nInitialized && !initialResources && i18next.language === lng) return;

  const activeLng = lng || i18nConfig.defaultLocale;

  i18next
    .use(HttpApi)
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      supportedLngs: i18nConfig.locales,
      fallbackLng: i18nConfig.defaultLocale,
      lng: activeLng,
      ns: [i18nConfig.defaultNS],
      defaultNS: i18nConfig.defaultNS,
      resources: initialResources,
      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
        caches: ['cookie'],
      },
      backend: {
        loadPath: getLoadPath(),
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: true,
      },
      debug: process.env.NODE_ENV === 'development',
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    }, (err, _t) => {
      if (err) return console.error('Error initializing client i18next:', err);
      i18nInitialized = true;
    });
};

interface TranslationsProviderProps {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resources?: any;
}

export default function TranslationsProvider({
  children,
  locale,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  namespaces,
  resources,
}: TranslationsProviderProps) {
  
  if (!i18next.isInitialized || resources || i18next.language !== locale) {
    initializeClientI18next(locale, resources);
  }
  
  useEffect(() => {
    if (i18next.language !== locale) {
      i18next.changeLanguage(locale);
    }
  }, [locale]);

  return <I18nextProvider i18n={i18next}>{children}</I18nextProvider>;
} 