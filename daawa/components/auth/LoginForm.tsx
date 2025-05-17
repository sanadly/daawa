'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser, type LoginCredentials } from '@/services/apiAuth';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';

interface LoginFormProps {
  onSuccess?: () => void; // Optional callback for successful login
}

// Define a type for the expected API error structure
interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string | string[]; // Message can be a string or an array of strings (e.g., class-validator)
      error?: string;
      statusCode?: number;
    };
  };
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation('common'); // Or your specific auth namespace
  const auth = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = React.useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const response = await loginUser(credentials);
      auth.login(response.user, response.tokens);

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard'); // Changed from '/' to '/dashboard'
      }
    } catch (err) {
      let errorMessage = t('login_failed_unknown', 'An unknown error occurred during login.');
      const apiError = err as ApiErrorResponse; // Type assertion

      if (typeof apiError?.response?.data?.message === 'string') {
        const apiErrorMessageString = apiError.response.data.message as string;
        if (apiErrorMessageString === 'Please verify your email address before logging in.') {
          errorMessage = t('error_api_email_not_verified', 'Your email address is not verified. Please check your inbox for a verification link or request a new one.');
        } else {
          errorMessage = apiErrorMessageString || t('login_failed', 'Login failed. Please try again.');
        }
      } else if (Array.isArray(apiError?.response?.data?.message) && apiError.response.data.message.length > 0) {
        // Handle case where message is an array (e.g., from class-validator)
        errorMessage = apiError.response.data.message.join(', '); // Simple join, could be more sophisticated
      } else if (err instanceof Error) {
        errorMessage = err.message || t('login_failed', 'Login failed. Please try again.');
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div role="alert" className="alert alert-error shadow-lg mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          <span>{error}</span>
        </div>
      )}
      <div>
        <label htmlFor="email" className="label">
          <span className="label-text">{t('email', 'Email')}</span>
        </label>
        <input 
          type="email" 
          id="email"
          name="email"
          placeholder={t('email_placeholder', 'Enter your email') || ''}
          className="input input-bordered w-full"
          value={credentials.email}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">
          <span className="label-text">{t('password', 'Password')}</span>
        </label>
        <input 
          type="password" 
          id="password"
          name="password"
          placeholder={t('password_placeholder', 'Enter your password') || ''}
          className="input input-bordered w-full"
          value={credentials.password}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
        {/* TODO: Add "Forgot password?" link */}
      </div>
      <div className="form-control mt-6">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            t('login_button', 'Login')
          )}
        </button>
      </div>
    </form>
  );
};

export default LoginForm; 