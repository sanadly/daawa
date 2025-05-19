'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { useTranslation } from 'react-i18next';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Let the useEffect handle the redirect
  }

  return (
    <div className="flex min-h-screen bg-base-200">
      <Sidebar />
      <div className={`flex-1 p-8 ${isRtl ? 'md:pr-72' : 'md:pl-72'}`}> {/* Conditionally apply padding based on language direction */}
        {children}
      </div>
    </div>
  );
} 