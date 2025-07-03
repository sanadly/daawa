import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import Providers from './providers';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { LanguageSwitcher } from './components/LanguageSwitcher';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Daawa - Event Management System',
  description: 'Comprehensive event management platform for organizing and managing events',
  keywords: ['event', 'management', 'organizing', 'tickets', 'registration'],
  authors: [{ name: 'Daawa Team' }],
  creator: 'Daawa Team',
  publisher: 'Daawa',
  openGraph: {
    title: 'Daawa - Event Management System',
    description: 'Comprehensive event management platform for organizing and managing events',
    type: 'website',
    locale: 'en_US',
    siteName: 'Daawa',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Daawa - Event Management System',
    description: 'Comprehensive event management platform for organizing and managing events',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

type RootLayoutProps = {
  children: React.ReactNode;
  params: { locale: string };
};

export default async function RootLayout({ children, params: { locale } }: RootLayoutProps) {
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} data-theme="daawa">
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <LanguageSwitcher />
            <div className="min-h-screen bg-base-100">{children}</div>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}