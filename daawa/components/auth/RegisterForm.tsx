'use client';

import React, { useState } from 'react';
// import { useRouter } from 'next/navigation'; // No longer used here
import { useTranslation } from 'next-i18next';
import { registerUser, type RegisterData } from '@/services/apiAuth';
// You might not need useAuth here unless registration immediately logs the user in
// import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
}

// Assuming RegisterData will be made flexible regarding 'username' (e.g., username?: string)
// or the backend API handles its absence. If not, the apiPayload construction might need adjustment.

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation('common');
  // const router = useRouter(); // No longer used here, redirection handled by parent page
  // const auth = useAuth(); // If auto-login is implemented

  const [formData, setFormData] = useState<Omit<RegisterData, 'username'>>({
    email: '',
    password: '',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (formData.password !== confirmPassword) {
      setError(t('passwords_do_not_match', 'Passwords do not match.'));
      return;
    }

    setIsLoading(true);
    try {
      const apiPayload: Omit<RegisterData, 'username'> = {
        email: formData.email,
        password: formData.password,
      };

      // This line will cause a TypeScript error if RegisterData strictly requires 'username'.
      // You need to ensure RegisterData allows username to be optional (username?: string)
      // or that your backend API can handle requests without it.
      const registeredUser = await registerUser(apiPayload as RegisterData);
      console.log('Registration successful:', registeredUser);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || t('registration_failed', 'Registration failed. Please try again.'));
      } else {
        setError(t('registration_failed_unknown', 'An unknown error occurred during registration.'));
      }
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
          value={formData.email}
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
          placeholder={t('password_placeholder_choose', 'Choose a password') || ''}
          className="input input-bordered w-full"
          value={formData.password!}
          onChange={handleChange}
          required
          disabled={isLoading}
        />
      </div>
      <div>
        <label htmlFor="confirmPassword" className="label">
          <span className="label-text">{t('confirm_password', 'Confirm Password')}</span>
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder={t('confirm_password_placeholder', 'Confirm your password') || ''}
          className="input input-bordered w-full"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading}
        />
      </div>
      <div className="form-control mt-6">
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? <span className="loading loading-spinner"></span> : t('register_button', 'Register')}
        </button>
      </div>
    </form>
  );
};

export default RegisterForm; 