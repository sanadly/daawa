import { create } from 'zustand';
import i18n from '../i18n';

interface LanguageState {
  language: 'en' | 'ar';
  isRTL: boolean;
  setLanguage: (lang: 'en' | 'ar') => void;
  getLocalizedPath: (path: string) => string;
}

// Initialize language from various sources
const getInitialLanguage = (): 'en' | 'ar' => {
  // First, check if i18n is already initialized
  if (i18n.isInitialized && i18n.language) {
    const detectedLang = i18n.language.split('-')[0] as 'en' | 'ar';
    console.log('Language detected from i18n:', detectedLang);
    return detectedLang === 'ar' ? 'ar' : 'en';
  }
  
  // Check localStorage for saved language preference
  const savedLang = localStorage.getItem('i18nextLng');
  if (savedLang) {
    const lang = savedLang.split('-')[0] as 'en' | 'ar';
    console.log('Language detected from localStorage:', lang);
    return lang === 'ar' ? 'ar' : 'en';
  }
  
  // Check browser language
  const browserLang = navigator.language.split('-')[0] as 'en' | 'ar';
  if (browserLang === 'ar') {
    console.log('Language detected from browser:', browserLang);
    return 'ar';
  }
  
  // Check URL path for language
  const pathLang = window.location.pathname.split('/')[1];
  if (pathLang === 'ar') {
    console.log('Language detected from URL path:', pathLang);
    return 'ar';
  }
  
  // Default to English
  console.log('Language defaulting to English');
  return 'en';
};

// Set document direction based on language
const setDocumentDirection = (lang: 'en' | 'ar') => {
  const direction = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = direction;
  document.documentElement.lang = lang;
  console.log('Document direction set:', direction, 'for language:', lang);
};

// Initialize with detected language
const initialLanguage = getInitialLanguage();
setDocumentDirection(initialLanguage);

export const useLanguage = create<LanguageState>((set, get) => ({
  language: initialLanguage,
  isRTL: initialLanguage === 'ar',
  setLanguage: (lang) => {
    console.log('Setting language to:', lang);
    i18n.changeLanguage(lang);
    set({ language: lang, isRTL: lang === 'ar' });
    setDocumentDirection(lang);
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

// Update the store when i18n is ready
i18n.on('initialized', () => {
  const detectedLang = i18n.language?.split('-')[0] as 'en' | 'ar';
  const finalLang = detectedLang === 'ar' ? 'ar' : 'en';
  
  console.log('i18n initialized, detected language:', finalLang);
  // Update the store and document direction
  useLanguage.getState().setLanguage(finalLang);
});

// Also listen for language changes from i18n
i18n.on('languageChanged', (lng) => {
  const lang = lng?.split('-')[0] as 'en' | 'ar';
  const finalLang = lang === 'ar' ? 'ar' : 'en';
  
  console.log('i18n language changed to:', finalLang);
  // Only update if different from current
  const currentLang = useLanguage.getState().language;
  if (finalLang !== currentLang) {
    useLanguage.getState().setLanguage(finalLang);
  }
}); 