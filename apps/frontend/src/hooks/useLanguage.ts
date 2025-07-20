import { create } from 'zustand';
import i18n from '../i18n';

interface LanguageState {
  language: 'en' | 'ar';
  isRTL: boolean;
  setLanguage: (lang: 'en' | 'ar') => void;
  getLocalizedPath: (path: string) => string;
}

export const useLanguage = create<LanguageState>((set, get) => ({
  language: (i18n.language.split('-')[0] as 'en' | 'ar') || 'en',
  isRTL: i18n.dir() === 'rtl',
  setLanguage: (lang) => {
    i18n.changeLanguage(lang);
    set({ language: lang, isRTL: lang === 'ar' });
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  },
  getLocalizedPath: (path) => {
    const lang = get().language;
    // Ensure we don't double-prefix the language
    if (path.startsWith(`/${lang}`)) {
      return path;
    }
    return `/${lang}${path}`;
  },
})); 