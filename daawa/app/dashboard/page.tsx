'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

const DashboardPage: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const { t } = useTranslation('common');

  useEffect(() => {
    console.log('DashboardPage: Auth state - isLoading:', isLoading, 'isAuthenticated:', isAuthenticated);
    if (!isLoading && !isAuthenticated) {
      router.push('/login'); // Redirect to login if not authenticated and not loading
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
    // This case should ideally be handled by the useEffect redirect,
    // but it's a fallback or for when redirect hasn't happened yet.
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>{t('dashboard_redirecting', 'Redirecting to login...')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{t('dashboard_title', 'Dashboard')}</h1>
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">{t('dashboard_welcome', 'Welcome')}, {user?.username || user?.email || t('dashboard_user_fallback', 'User')}!</h2>
            <p>{t('dashboard_login_success_message', 'You have successfully logged in.')}</p>
            <p>{t('dashboard_auth_status_label', 'Your Authentication Status:')} {isAuthenticated ? t('dashboard_auth_status_authenticated', 'Authenticated') : t('dashboard_auth_status_not_authenticated', 'Not Authenticated')}</p>
            {user && (
              <div className="mt-4">
                <p><strong>{t('dashboard_user_id_label', 'User ID:')}</strong> {user.id}</p>
                <p><strong>{t('dashboard_user_email_label', 'Email:')}</strong> {user.email}</p>
                {/* Add other user details you might have in UserData */}
              </div>
            )}
            <div className="card-actions justify-end mt-4">
              <button onClick={() => router.push('/')} className="btn">{t('dashboard_go_to_homepage_button', 'Go to Homepage')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage; 