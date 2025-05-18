'use client';

import React from 'react'; // Removed useState, useEffect
import { I18nextProvider } from 'react-i18next';
import i18nInstance from 'i18next'; // Renamed to avoid conflict if i18n is used as prop name
import HttpApi from 'i18next-http-backend'; // Backend to load translations over http
import LanguageDetector from 'i18next-browser-languagedetector'; // Detect user language
import { initReactI18next } from 'react-i18next';

// Function to construct loadPath safely for client-side
const getLoadPath = () => {
  if (typeof window !== 'undefined') {
    // Ensure no double slashes if window.location.origin ends with one
    const origin = window.location.origin.endsWith('/') 
                   ? window.location.origin.slice(0, -1) 
                   : window.location.origin;
    return `${origin}/locales/{{lng}}/{{ns}}.json`;
  }
  // Fallback for SSR or environments where window is not defined, though HttpApi is client-side.
  // This path might not be used if HttpApi only runs client-side.
  return '/locales/{{lng}}/{{ns}}.json'; 
};

// Initialize i18next only once
if (!i18nInstance.isInitialized) {
  i18nInstance
    .use(HttpApi) // Use http backend to load translations
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // Passes i18n down to react-i18next
    .init({
      // Configuration based on next-i18next.config.js (adjust if needed)
      supportedLngs: ['en', 'ar'],
      fallbackLng: 'en',
      detection: {
        order: ['querystring', 'cookie', 'localStorage', 'sessionStorage', 'navigator', 'htmlTag'],
        caches: ['cookie'], // Cache detected language in cookies
      },
      backend: {
        loadPath: getLoadPath(), // Use the function here
      },
      ns: ['common'], // Default namespace(s)
      defaultNS: 'common',
      interpolation: {
        escapeValue: false, // React already safes from xss
      },
      react: {
        useSuspense: true, // This remains crucial
      },
      debug: process.env.NODE_ENV === 'development', // Enable debug logs in dev
    });
}

interface I18nProviderProps {
  children: React.ReactNode;
}

const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  // With useSuspense: true, React Suspense should handle loading states.
  // The i18nInstance is initialized at the module level.
  // console.log("I18nProvider: Rendering simplified provider with instance:", i18nInstance.language, i18nInstance.isInitialized);
  return <I18nextProvider i18n={i18nInstance}>{children}</I18nextProvider>;
};

export default I18nProvider; 