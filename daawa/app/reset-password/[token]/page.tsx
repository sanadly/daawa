'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation'; // Corrected import for App Router
import { useTranslation } from 'next-i18next'; // Uncommented
import { fetchApi } from '@/services/apiAuth'; // Assuming apiAuth.ts is in @/services

const resetPasswordApiCall = async (token: string, newPassword: string): Promise<{ message: string }> => {
  // Actual API call to your backend.
  return fetchApi('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
};

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation('common'); // Initialized
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === 'string' ? params.token : null;

  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isError, setIsError] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null); // null = validating, true = valid, false = invalid

  // Optional: Validate token on component mount (basic check or call backend)
  useEffect(() => {
    if (token) {
      // Here you could add a backend call to validate the token immediately upon page load
      // For now, we'll just assume it's valid until form submission
      // e.g., validateToken(token).then(setIsValidToken).catch(() => setIsValidToken(false));
      setIsValidToken(true); // Simplified: Assume valid if token exists
    } else {
      setIsValidToken(false);
      setMessage(t('reset_password_no_token_error', 'No reset token provided or token is invalid.'));
      setIsError(true);
    }
  }, [token, t]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    if (!password || !confirmPassword) {
      setMessage(t('reset_password_passwords_required', 'Both password fields are required.'));
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t('reset_password_passwords_do_not_match', 'Passwords do not match.'));
      setIsError(true);
      setIsLoading(false);
      return;
    }

    if (!token) {
      setMessage(t('reset_password_invalid_token_error', 'Invalid or missing reset token.'));
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      await resetPasswordApiCall(token, password);
      setMessage(t('reset_password_success_message', 'Your password has been successfully reset. You can now log in.'));
      setIsError(false);
      router.push('/login');
    } catch (err) {
      setMessage((err as Error).message || t('reset_password_generic_error', 'Failed to reset password. The link may be invalid or expired.'));
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
        <span className="loading loading-dots loading-lg"></span>
        <p>{t('reset_password_validating_token', 'Validating reset link...')}</p>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
        <div className="card w-full max-w-md shadow-xl bg-base-100">
          <div className="card-body">
            <h1 className="card-title text-2xl font-bold mb-6 text-center">{t('reset_password_invalid_link_title', 'Invalid Link')}</h1>
            <p className="text-center text-error">{message || t('reset_password_invalid_token_message', 'This password reset link is invalid or has expired.')}</p>
            <button onClick={() => router.push('/forgot-password')} className="btn btn-primary mt-4">
              {t('reset_password_request_new_link_button', 'Request a New Link')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <div className="card-body">
          <h1 className="card-title text-2xl font-bold mb-6 text-center">{t('reset_password_page_title', 'Reset Your Password')}</h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="label">
                <span className="label-text">{t('reset_password_new_password_label', 'New Password')}</span>
              </label>
              <input
                type="password"
                id="password"
                placeholder={t('reset_password_new_password_placeholder', 'Enter new password')}
                className="input input-bordered w-full"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="label">
                <span className="label-text">{t('reset_password_confirm_new_password_label', 'Confirm New Password')}</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                placeholder={t('reset_password_confirm_new_password_placeholder', 'Confirm new password')}
                className="input input-bordered w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {message && (
              <p className={`text-sm ${isError ? 'text-error' : 'text-success'} text-center`}>
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
                  t('reset_password_submit_button', 'Reset Password')
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 