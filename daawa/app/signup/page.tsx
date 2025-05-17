'use client';

import RegisterForm from '@/components/auth/RegisterForm';
import { useRouter } from 'next/navigation'; // Or 'next/router' if using Pages Router
import { useTranslation } from 'next-i18next';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation('common');

  const handleRegistrationSuccess = () => {
    // Redirect to login page or a "check your email" page after successful registration
    // For now, let's redirect to login as an example
    router.push('/login'); 
    // You might also want to show a success message before redirecting
    // For example, using a toast notification library or a simple alert.
    // alert('Registration successful! Please check your email to verify your account.');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-2xl bg-base-100">
        <div className="card-body">
          <h1 className="text-3xl font-bold text-center mb-4">{t('signup_page_title', 'Sign Up')}</h1>
          <RegisterForm onSuccess={handleRegistrationSuccess} />
          <p className="text-center mt-4">
            {t('signup_already_have_account', 'Already have an account?')}{' '}
            <a href="/login" className="link link-primary">
              {t('signup_login_link', 'Login')}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

SignupPage.displayName = 'SignupPage'; 