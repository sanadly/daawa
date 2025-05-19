// Remove 'use client'; from here if it was added, RootLayout can be a Server Component
// if it doesn't use client-side hooks directly anymore.

import React from 'react'; // Import React for Suspense
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import TranslationsProvider from "@/components/providers/TranslationsProvider";
import "./globals.css";
import HtmlLangDirUpdater from "@/components/layout/HtmlLangDirUpdater"; // Import the new component
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider from the correct path
import Navbar from '@/components/layout/Navbar'; // Import Navbar
import { getTranslations } from '@/lib/i18n'; // Corrected: Using getTranslations
import i18nConfig from '../i18n.config'; // Corrected path

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic", "latin"],
  weight: ['400', '500', '700'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daawa - Effortless Event Management",
  description: "Manage event invitations, guest lists, and QR check-in with Daawa.",
  // Note: For truly dynamic lang/dir for SEO & initial render, advanced Next.js patterns
  // for internationalized routing and server-side lang detection might be needed.
  // This approach primarily handles client-side updates for SPA-like interactions.
};

// Add a simple getLocale function inline since we can't find the imported one
function getLocale(params?: { lng?: string }) {
  return params?.lng || i18nConfig.defaultLocale;
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params?: { lng: string }; 
}>) {
  const locale = getLocale(params);
  // We need to pass the i18n instance's resource store data
  const { i18n } = await getTranslations(locale, i18nConfig.defaultNS);

  return (
    // Set initial lang/dir for non-JS or pre-hydration. Client component will update.
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-theme="winter"> 
      <body
        className={`${ibmPlexSansArabic.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <AuthProvider>
          <TranslationsProvider
            locale={locale}
            namespaces={[i18nConfig.defaultNS]}
            resources={i18n.services.resourceStore.data}
          >
            <HtmlLangDirUpdater /> {/* Add the updater component here */}
            <React.Suspense fallback={<div style={{fontSize: '20px', padding: '20px'}}>Loading...</div>}> 
              <Navbar /> {/* Add Navbar here */}
              {children}
            </React.Suspense>
          </TranslationsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
