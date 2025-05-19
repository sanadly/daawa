'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/auth';
import { useTranslation } from 'react-i18next';

// Required permission for the admin section
const REQUIRED_PERMISSION = Permission.MANAGE_ROLES;

/**
 * Layout for the admin section that provides consistent UI and permission protection
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <ProtectedRoute requiredPermission={REQUIRED_PERMISSION} fallbackUrl="/dashboard">
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className={`flex-1 ${isRtl ? 'mr-64' : 'ml-64'}`}> {/* Conditional margin based on direction */}
          <main className="p-4">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
} 