'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { loginUser, type LoginCredentials } from '@/services/apiAuth';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'next-i18next';

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const auth = useAuth();
  const router = useRouter();
  const [credentials, setCredentials] = React.useState<LoginCredentials>({
    email: '',
    password: '',
  });
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  // Add a development mode check
  const isDevelopment = process.env.NODE_ENV === 'development';

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
        router.push('/dashboard');
      }
    } catch (err) {
      let errorMessage = t('login_failed_unknown', 'An unknown error occurred during login.');
      
      if (err instanceof Error && err.message) {
        if (err.message.includes('401') || err.message.includes('Invalid credentials')) {
          errorMessage = t('login_failed_invalid', 'Invalid email or password. Please try again.');
        } else if (err.message.includes('verify your email')) {
          errorMessage = t('login_failed_unverified', 'Please verify your email address before logging in.');
        } else if (err.message.includes('Connection')) {
          errorMessage = t('login_failed_connection', 'Unable to connect to the server. Please check your connection and try again.');
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle dev bypass login
  const handleDevBypass = () => {
    // Load the inject-auth.js script
    const script = document.createElement('script');
    script.src = '/inject-auth.js';
    script.onload = () => {
      console.log('Auth tokens injected successfully');
      // Redirect to dashboard or home page
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    };
    document.body.appendChild(script);
  };

  return (
    <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-lg dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div role="alert" className="alert alert-error shadow-lg mb-4">
            <div className="flex">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">{t('email', 'Email')}</span>
          </label>
          <input
            type="email"
            name="email"
            placeholder={t('email_placeholder', 'youremail@example.com')}
            className="input input-bordered w-full"
            value={credentials.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-control w-full">
          <label className="label">
            <span className="label-text">{t('password', 'Password')}</span>
          </label>
          <input
            type="password"
            name="password"
            placeholder={t('password_placeholder', '••••••••')}
            className="input input-bordered w-full"
            value={credentials.password}
            onChange={handleChange}
            required
          />
          <label className="label">
            <a href="#" className="label-text-alt link link-hover">
              {t('forgot_password', 'Forgot password?')}
            </a>
          </label>
        </div>

        <div className="form-control mt-6">
          <button
            type="submit"
            className={`btn btn-primary w-full ${isLoading ? 'loading' : ''}`}
            disabled={isLoading}
          >
            {isLoading
              ? t('logging_in', 'Logging in...')
              : t('login', 'Log in')}
          </button>
        </div>
      </form>
      
      {/* Add DEV mode authentication bypass at the bottom */}
      {isDevelopment && (
        <div className="mt-4 border-t pt-4">
          <button
            type="button"
            onClick={handleDevBypass}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-500 rounded-md hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            DEV: Bypass Authentication
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Development mode only. Uses pre-generated tokens.
          </p>
        </div>
      )}
    </div>
  );
};

export default LoginForm; 