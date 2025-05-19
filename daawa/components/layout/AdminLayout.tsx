'use client';

import React from 'react';
import Sidebar from '@/components/layout/Sidebar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/auth';
import { useTranslation } from 'react-i18next';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout for the admin section that provides consistent UI and permission protection
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';

  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_USERS} fallbackUrl="/dashboard">
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className={`flex-1 ${isRtl ? 'mr-64' : 'ml-64'}`}>
          <main>
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}; 