import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../lib/api';

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath);
  const isRTL = language === 'ar';
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    setMessage('');
    try {
      await api.post('/auth/forgot-password', data);
      setMessage(t('auth.forgotPassword.successMessage'));
    } catch (error: any) {
      console.error('Forgot password error:', error);
      setError('root', {
        type: 'manual',
        message: t('auth.errors.passwordResetFailed'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('auth.forgotPassword.title')}</h2>
          <p className="text-gray-600">{t('auth.forgotPassword.subtitle')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {message ? (
            <div className="text-center">
              <p className="text-primary-600">{message}</p>
              <Link to={getLocalizedPath('/auth/login')} className="link mt-4 inline-block">{t('auth.forgotPassword.backToLogin')}</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.email')}</label>
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
                  className={`w-full input ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={t('auth.placeholders.email')}
                  disabled={isLoading}
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
              </div>

              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.root.message}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn btn-primary"
              >
                {isLoading ? t('auth.forgotPassword.sending') : t('auth.forgotPassword.sendResetLink')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 