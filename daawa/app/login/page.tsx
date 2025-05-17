'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next'; 
import LoginForm from '@/components/auth/LoginForm'; // Import the LoginForm component

const LoginPage = () => {
  const { t } = useTranslation('common');
  const router = useRouter();

  const handleLoginSuccess = () => {
    // Potentially show a success message or perform other actions before redirecting
    console.log('Login successful from page, redirecting...');
    router.push('/'); // Redirect to homepage or dashboard
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-6">{t('login_title', 'Login')}</h1>
          <LoginForm onSuccess={handleLoginSuccess} />
          <div className="text-center mt-4 space-y-2">
            <p>
              {t('dont_have_account', "Don't have an account?")}{' '}
              <a href="/register" className="link link-primary">
                {t('register_now', 'Register now')}
              </a>
            </p>
            <p>
              <a href="/forgot-password" className="link link-hover text-sm">
                {t('forgot_password', 'Forgot Password?')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 