'use client'; // Required for useTranslation hook

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
// No longer importing custom Button component
// import Navbar from '@/components/layout/Navbar'; // Removed Navbar import
import { UsersRound, Ticket, QrCode } from 'lucide-react'; // Import Lucide icons

export default function HomePage() {
  const { t } = useTranslation('common');
  const [isClient, setIsClient] = useState(false);

  // Use useEffect to update state after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      {/* --- Hero Section --- */}
      <div className="hero min-h-[60vh] bg-gradient-to-br from-primary to-secondary">
        <div className="hero-content text-center text-neutral-content">
          <div className="max-w-lg">
            <h1 className="text-5xl font-bold">
              {isClient ? t('hero_title_refined') : "Your Event, Simplified"}
            </h1>
            <p className="py-6">
              {isClient ? t('hero_description_refined') : "Create, manage, and share your events effortlessly. Send beautiful invitations and track RSVPs with ease."}
            </p>
            <button className="btn btn-primary" onClick={() => alert(t('get_started_alert'))}>
              {isClient ? t('hero_button_create_event') : "Create Your First Event"}
            </button>
          </div>
        </div>
      </div>

      {/* --- Features Section --- */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">
          {isClient ? t('features_heading_refined') : "Everything You Need for Seamless Event Management"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature Card 1 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <UsersRound size={48} className="mb-4 text-primary" strokeWidth={1.5} />
              <h3 className="card-title">
                {isClient ? t('feature_1_title_refined') : "Flexible Guest Management"}
              </h3>
              <p>
                {isClient ? t('feature_1_desc_refined') : "Easily manage +N guest allowances, offer self-registration via shareable links, and import existing guest lists."}
              </p>
            </div>
          </div>
          {/* Feature Card 2 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <Ticket size={48} className="mb-4 text-primary" strokeWidth={1.5} />
              <h3 className="card-title">
                {isClient ? t('feature_2_title_refined') : "Customizable Digital Passes"}
              </h3>
              <p>
                {isClient ? t('feature_2_desc_refined') : "Design beautiful, branded digital passes for PDF, Apple Wallet, and Google Wallet, all from a unified interface."}
              </p>
            </div>
          </div>
          {/* Feature Card 3 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center">
              <QrCode size={48} className="mb-4 text-primary" strokeWidth={1.5} />
              <h3 className="card-title">
                {isClient ? t('feature_3_title_refined') : "Smooth QR Code Check-in"}
              </h3>
              <p>
                {isClient ? t('feature_3_desc_refined') : "Utilize any smartphone or tablet for fast QR code scanning with our web-based check-in module. No extra hardware needed."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* --- Call to Action Section --- */}
      <div className="bg-neutral text-neutral-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {isClient ? t('cta_heading_refined') : "Simplify Your Next Event with Daawa"}
          </h2>
          <p className="mb-8">
            {isClient ? t('cta_desc_refined') : "Focus on your event, not the logistics. Start exploring Daawa's features today in 'Draft' mode – no commitment required."}
          </p>
          <button className="btn btn-primary">
            {isClient ? t('cta_button_get_started_free') : "Get Started for Free"}
          </button>
        </div>
      </div>

      {/* --- Footer Section --- */}
      <footer className="footer p-10 bg-base-300 text-base-content">
        <nav>
          <h6 className="footer-title">{isClient ? t('footer_title_services') : "Services"}</h6>
          <a className="link link-hover">{isClient ? t('footer_link_features') : "Features"}</a>
          <a className="link link-hover">{isClient ? t('footer_link_pricing') : "Pricing"}</a>
          <a className="link link-hover">{isClient ? t('footer_link_how_it_works') : "How it Works"}</a>
        </nav>
        <nav>
          <h6 className="footer-title">{isClient ? t('footer_title_company') : "Company"}</h6>
          <a className="link link-hover">{isClient ? t('footer_link_about_us') : "About Us"}</a>
          <a className="link link-hover">{isClient ? t('footer_link_contact') : "Contact"}</a>
          <a className="link link-hover">{isClient ? t('footer_link_blog') : "Blog"}</a>
        </nav>
        <nav>
          <h6 className="footer-title">{isClient ? t('footer_title_legal') : "Legal"}</h6>
          <a className="link link-hover">{isClient ? t('footer_link_terms') : "Terms of Service"}</a>
          <a className="link link-hover">{isClient ? t('footer_link_privacy') : "Privacy Policy"}</a>
        </nav>
      </footer>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content border-t border-base-content border-opacity-10">
        <aside>
          <p>{isClient ? t('footer_copyright') : "© 2023 Daawa App. All rights reserved."}</p>
        </aside>
      </footer>
    </div>
  );
}

// Explicitly set the display name for the component
HomePage.displayName = 'HomePage';
