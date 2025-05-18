'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next'; // Changed from next-i18next
import { fetchApi } from '@/services/apiAuth'; // Assuming apiAuth.ts is in @/services

// Placeholder for the actual API call function
// You will need to create this in @/services/apiAuth.ts
const requestPasswordReset = async (email: string): Promise<{ message: string }> => {
  // Actual API call to your backend
  return fetchApi('/auth/forgot-password', { 
    method: 'POST', 
    body: JSON.stringify({ email }), 
  });
};

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation('common'); // Initialized
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  // An error state here might not be needed if we always show a generic success message
  // const [isError, setIsError] = useState<boolean>(false); 
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    // setIsError(false);

    if (!email) {
      setMessage(t('forgot_password_email_required', 'Email is required.'));
      // setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      await requestPasswordReset(email);
      setMessage(t('forgot_password_email_sent_generic', 'If your email address exists in our system, you will receive a password reset link shortly.'));
      // setIsError(false); 
      // setEmail(''); // Optionally clear email, or leave it for user reference
    } catch (_err) {
      console.warn('Error during requestPasswordReset:', _err); // Log the error
      // Since we give a generic message, front-end errors are less likely from API directly
      // unless it's a network issue or unhandled server error.
      setMessage(t('forgot_password_generic_error', 'An unexpected error occurred. Please try again.'));
      // setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-2xl font-bold mb-6 text-center">{t('forgot_password_page_title', 'Forgot Your Password?')}</h1>
          <p className="text-center text-sm mb-4">
            {t('forgot_password_instructions', 'Enter your email address and we will send you a link to reset your password.')}
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                <span className="label-text">{t('forgot_password_email_label', 'Email Address')}</span>
              </label>
              <input
                type="email"
                id="email"
                placeholder={t('forgot_password_email_placeholder', 'your.email@example.com')}
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              // Always show message as neutral or slightly positive, as per security best practice
              <p className={`text-sm text-info text-center`}> 
                {message}
              </p>
            )}

            <div className="form-control mt-6">
              <button 
                type="submit" 
                className="btn btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  t('forgot_password_submit_button', 'Send Password Reset Link')
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 