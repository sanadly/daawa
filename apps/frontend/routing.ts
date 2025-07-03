import {defineRouting} from 'next-intl/routing';
 
export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ['en', 'ar'],
 
  // Used when no locale matches
  defaultLocale: 'en',

  // The `pathnames` object maps pathnames to locales
  pathnames: {
    '/': '/',
    '/about': {
      en: '/about',
      ar: '/حول'
    },
    '/events': {
      en: '/events', 
      ar: '/الأحداث'
    },
    '/login': {
      en: '/login',
      ar: '/تسجيل-الدخول'
    },
    '/signup': {
      en: '/signup',
      ar: '/التسجيل'
    },
    '/dashboard': {
      en: '/dashboard',
      ar: '/لوحة-التحكم'
    },
    '/admin': {
      en: '/admin',
      ar: '/المدير'
    }
  }
});
 
export type Pathnames = keyof typeof routing.pathnames;
export type Locale = (typeof routing.locales)[number];