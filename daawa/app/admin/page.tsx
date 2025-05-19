'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Permission } from '@/types/auth';

/**
 * Admin dashboard page that serves as the entry point to admin features.
 * Currently redirects to role management which is the main admin feature.
 */
export default function AdminPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to role management page which is the main admin feature
    router.push('/admin/role-management');
  }, [router]);

  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_ROLES} fallbackUrl="/dashboard">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <p>Redirecting to Role Management...</p>
      </div>
    </ProtectedRoute>
  );
} 