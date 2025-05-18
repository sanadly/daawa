'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { resendVerificationEmail } from '@/services/apiAuth'; // Adjust import if needed
import { useTranslation } from 'react-i18next'; // Changed from next-i18next

const ResendVerificationPage: React.FC = () => {
  const { t } = useTranslation('common'); // Initialized
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    if (!email) {
      setMessage(t('resend_verification_email_required', 'Email is required.'));
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      await resendVerificationEmail(email);
      setMessage(t('resend_verification_email_sent', 'If your email is registered and unverified, a new verification link has been sent.'));
      setIsError(false);
      setEmail(''); // Clear email field on success
      // Optionally redirect or show a persistent success message
    } catch (err) {
      let errorMessage = t('resend_verification_failed_to_resend', 'Failed to resend email. Please try again.');
      if (err instanceof Error) {
        errorMessage = err.message; // Backend message might be more specific
      }
      setMessage(errorMessage);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-2xl font-bold mb-6 text-center">{t('resend_verification_page_title', 'Resend Verification Email')}</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                <span className="label-text">{t('resend_verification_email_label', 'Email Address')}</span>
              </label>
              <input
                type="email"
                id="email"
                placeholder={t('resend_verification_email_placeholder', 'your.email@example.com')}
                className="input input-bordered w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className={`text-sm ${isError ? 'text-error' : 'text-success'} text-center`}>
                {message} {/* Backend messages might not need t() if already translated */}
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
                  t('resend_verification_submit_button', 'Resend Email')
                )}
              </button>
            </div>
          </form>

          <div className="text-center mt-4">
            <button 
              onClick={() => router.back()} 
              className="link link-hover text-sm"
            >
              {t('resend_verification_go_back_button', 'Go back')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ResendVerificationPage; 