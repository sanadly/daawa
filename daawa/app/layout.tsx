// Remove 'use client'; from here if it was added, RootLayout can be a Server Component
// if it doesn't use client-side hooks directly anymore.

import React from 'react'; // Import React for Suspense
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Geist_Mono } from "next/font/google";
import I18nProvider from "@/components/providers/I18nProvider";
import "./globals.css";
import HtmlLangDirUpdater from "@/components/layout/HtmlLangDirUpdater"; // Import the new component
import { AuthProvider } from '@/contexts/AuthContext'; // Import AuthProvider
import Navbar from '@/components/layout/Navbar'; // Import Navbar

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Set initial lang/dir for non-JS or pre-hydration. Client component will update.
    <html lang="en" dir="ltr" data-theme="winter"> 
      <body
        className={`${ibmPlexSansArabic.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <I18nProvider>
          <AuthProvider> {/* Wrap children with AuthProvider */}
            <HtmlLangDirUpdater /> {/* Add the updater component here */}
            <React.Suspense fallback={<div style={{fontSize: '40px', color: 'red', background: 'yellow', padding: '20px'}}>SUSPENSE FALLBACK! TRANSLATIONS LOADING...</div>}> {/* Or a proper spinner component */}
              <Navbar /> {/* Add Navbar here */}
              {children}
            </React.Suspense>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
