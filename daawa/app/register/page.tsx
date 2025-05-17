'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';
import RegisterForm from '@/components/auth/RegisterForm'; // We will create this next

const RegisterPage = () => {
  const { t } = useTranslation('common'); // Or your specific auth namespace
  const router = useRouter();

  const handleRegisterSuccess = () => {
    // After successful registration, you might want to:
    // - Automatically log the user in (if your backend supports it and returns tokens)
    // - Redirect to a "please verify your email" page
    // - Redirect to the login page
    console.log('Registration successful from page, redirecting to login...');
    router.push('/login'); // For now, redirect to login page
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="text-2xl font-bold text-center mb-6">{t('register_title', 'Create Account')}</h1>
          <RegisterForm onSuccess={handleRegisterSuccess} />
          <div className="text-center mt-4">
            <p>
              {t('already_have_account', 'Already have an account?')}{' '}
              <a href="/login" className="link link-primary">
                {t('login_now', 'Login now')}
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 