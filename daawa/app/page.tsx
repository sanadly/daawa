'use client'; // Required for useTranslation hook

import React from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
// No longer importing custom Button component
// import Navbar from '@/components/layout/Navbar'; // Removed Navbar import
import { UsersRound, Ticket, QrCode } from 'lucide-react'; // Import Lucide icons

// If not using react-i18next provider, initialize i18next manually (less common)
// import i18n from 'i18next';
// import { initReactI18next } from 'react-i18next';
// import HttpApi from 'i18next-http-backend';
// i18n
//   .use(initReactI18next)
//   .use(HttpApi) // Load translations over http (from public/locales)
//   .init({
//     supportedLngs: ['en', 'ar'],
//     fallbackLng: 'en',
//     // detection: { /* options */ },
//     interpolation: {
//       escapeValue: false, // React already safes from xss
//     },
//     backend: {
//       loadPath: '/locales/{{lng}}/{{ns}}.json',
//     },
//     ns: ['common'], // Default namespace
//     defaultNS: 'common',
//   });

export default function HomePage() {
  const { t } = useTranslation('common'); // i18n instance not needed here anymore
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar removed from here */}

      {/* --- Hero Section --- */}
      <div className="hero min-h-[60vh] bg-gradient-to-br from-primary to-secondary">
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold">{t('hero_title_refined')}</h1>
            <p className="py-6">{t('hero_description_refined')}</p>
            {/* Removed language display and switcher buttons from here */}
            <button className="btn btn-primary" onClick={() => router.push('/events/create')}>
              {t('hero_button_create_event')}
            </button>
          </div>
        </div>
      </div>

      {/* --- Features Section --- */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">{t('features_heading_refined')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <UsersRound size={48} className="mb-4 text-primary" strokeWidth={1.5} />
              <h3 className="card-title">{t('feature_1_title_refined')}</h3>
              <p>{t('feature_1_desc_refined')}</p>
            </div>
          </div>
          {/* Feature Card 2 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <Ticket size={48} className="mb-4 text-primary" strokeWidth={1.5} />
              <h3 className="card-title">{t('feature_2_title_refined')}</h3>
              <p>{t('feature_2_desc_refined')}</p>
            </div>
          </div>
          {/* Feature Card 3 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <QrCode size={48} className="mb-4 text-primary" strokeWidth={1.5} />
              <h3 className="card-title">{t('feature_3_title_refined')}</h3>
              <p>{t('feature_3_desc_refined')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Call to Action Section --- */}
      <div className="bg-neutral text-neutral-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">{t('cta_heading_refined')}</h2>
          <p className="mb-8">{t('cta_desc_refined')}</p>
          <button className="btn btn-primary">{t('cta_button_get_started_free')}</button>
        </div>
      </div>

      {/* --- Footer Section --- */}
      <footer className="footer p-10 bg-base-300 text-base-content">
        <nav>
          <h6 className="footer-title">{t('footer_title_services')}</h6>
          <a className="link link-hover">{t('footer_link_features')}</a>
          <a className="link link-hover">{t('footer_link_pricing')}</a>
          <a className="link link-hover">{t('footer_link_how_it_works')}</a>
        </nav>
        <nav>
          <h6 className="footer-title">{t('footer_title_company')}</h6>
          <a className="link link-hover">{t('footer_link_about_us')}</a>
          <a className="link link-hover">{t('footer_link_contact')}</a>
          <a className="link link-hover">{t('footer_link_blog')}</a>
        </nav>
        <nav>
          <h6 className="footer-title">{t('footer_title_legal')}</h6>
          <a className="link link-hover">{t('footer_link_terms')}</a>
          <a className="link link-hover">{t('footer_link_privacy')}</a>
        </nav>
      </footer>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content border-t border-base-content border-opacity-10">
        <aside>
          <p>{t('footer_copyright')}</p>
        </aside>
      </footer>

    </div>
  );
}

// Explicitly set the display name for the component
HomePage.displayName = 'HomePage';
