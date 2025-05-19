'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation'; // For App Router
// If using Pages Router, you'd use: import { useRouter } from 'next/router';
import { useTranslation } from 'react-i18next'; // Changed from next-i18next

// You might need a service function to call your backend
// Similar to how you have loginUser in apiAuth.ts
// Example: create a verifyEmailToken function in daawa/services/apiAuth.ts
// that makes a GET request to /auth/verify-email?token=...

// Assuming you add this to apiAuth.ts:
/*
// In daawa/services/apiAuth.ts
export const verifyEmailTokenOnBackend = async (token: string): Promise<{ message: string }> => {
  return fetchApi(`/auth/verify-email?token=${token}`, { method: 'GET' });
};
*/
import { verifyEmailTokenOnBackend } from '@/services/apiAuth'; // Adjust import if needed

const VerifyEmailPage: React.FC = () => {
  const router = useRouter(); // For navigation
  const searchParams = useSearchParams(); // For App Router to get query params
  const token = searchParams ? searchParams.get('token') : null;
  const { t } = useTranslation('common'); // Initialized

  const [message, setMessage] = useState<string>(t('verify_email_verifying_message', 'Verifying your email, please wait...'));
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Added loading state

  useEffect(() => {
    if (token) {
      setIsLoading(true);
      verifyEmailTokenOnBackend(token)
        .then((response) => {
          // Assuming backend returns something like { message: "Email verified successfully." }
          setMessage(response.message || t('verify_email_success_message', 'Email verified successfully!'));
          setIsError(false);
          // Optional: redirect to login after a few seconds
          setTimeout(() => router.push('/login'), 3000);
        })
        .catch((err) => {
          setMessage(err.message || t('verify_email_error_message', 'Email verification failed. The link may be invalid or expired.'));
          setIsError(true);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setMessage(t('verify_email_token_not_found', 'Verification token not found. Please check the link or request a new one.'));
      setIsError(true);
      setIsLoading(false);
    }
  }, [token, router, t]); // Added t to dependency array

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body items-center text-center">
          <h1 className="card-title text-2xl font-bold mb-4">{t('verify_email_page_title', 'Email Verification')}</h1>
          
          {isLoading ? (
            <div className="space-y-4">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-lg">{message}</p>
            </div>
          ) : (
            <>
              <p className={`text-lg mb-6 ${isError ? 'text-error' : 'text-success'}`}>
                {message}
              </p>
              {!isError && message.includes(t('verify_email_success_keyword', 'successfully')) && (
                <button 
                  onClick={() => router.push('/login')} 
                  className="btn btn-primary w-full"
                >
                  {t('verify_email_go_to_login_button', 'Go to Login')}
                </button>
              )}
              {isError && (
                <button 
                  onClick={() => router.push('/resend-verification')} // Assuming you have a /resend-verification route
                  className="btn btn-secondary w-full mt-2"
                >
                  {t('verify_email_resend_button', 'Resend Verification Email')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage; 