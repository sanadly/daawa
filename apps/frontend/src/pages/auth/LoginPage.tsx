import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const language = useLanguage((state) => state.language);
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath);
  const isRTL = language === 'ar';

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      await login(data);
      navigate(`/${language}/dashboard`);
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.response?.status === 401) {
        setError('root', { 
          type: 'manual', 
          message: t('auth.errors.invalidCredentials') 
        });
      } else {
        setError('root', { 
          type: 'manual', 
          message: t('auth.errors.loginFailed') 
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-800 mb-2">
            {t('common.siteName')}
          </h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {t('auth.login.title')}
          </h2>
          <p className="text-gray-600">
            {t('auth.login.subtitle')}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.fields.email')}
              </label>
              <input
                type="email"
                id="email"
                {...register('email', {
                  required: t('auth.validation.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('auth.validation.emailInvalid'),
                  },
                })}
                className={`
                  w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors
                  ${errors.email ? 'border-red-500' : 'border-gray-300'}
                `}
                placeholder={t('auth.placeholders.email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('auth.fields.password')}
              </label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'} ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 px-4 py-3 focus:outline-none flex-shrink-0 border-0"
                  disabled={isLoading}
                  aria-label={showPassword ? t('auth.login.hidePassword') : t('auth.login.showPassword')}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414L8.464 8.464m5.656 5.656l1.415 1.415m-1.415-1.415l1.415 1.415" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.543 7-1.275 4.057-5.065 7-9.543 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  dir="ltr"
                  {...register('password', {
                    required: t('auth.validation.passwordRequired'),
                    minLength: {
                      value: 8,
                      message: t('auth.validation.passwordMinLength', {min: 8}),
                    },
                  })}
                  className={`flex-1 bg-transparent px-4 py-3 focus:outline-none border-0 text-gray-900 ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('auth.placeholders.password')}
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* General Error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">
                  {errors.root.message}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? t('auth.login.signingIn') : t('auth.login.signIn')}
            </button>

            {/* Forgot Password Link */}
            <div className="text-center">
              <Link
                to={getLocalizedPath('/forgot-password')}
                className="text-sm text-primary-600 hover:text-primary-800 transition-colors"
              >
                {t('auth.login.forgotPassword')}
              </Link>
            </div>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 text-center border-t pt-6">
            <p className="text-sm text-gray-600">
              {t('auth.login.noAccount')}{' '}
              <Link
                to={getLocalizedPath('/signup')}
                className="text-primary-600 hover:text-primary-800 font-medium transition-colors"
              >
                {t('auth.login.signUpLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 