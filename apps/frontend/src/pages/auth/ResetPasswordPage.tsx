import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';
import api from '../../lib/api';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordPage: React.FC = () => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath);
  const isRTL = language === 'ar';
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setErrorState] = useState('');
  const [isTokenValid, setTokenValid] = useState<boolean | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<ResetPasswordFormData>();

  useEffect(() => {
    const validateToken = async () => {
      try {
        await api.post('/auth/validate-reset-token', { token });
        setTokenValid(true);
      } catch (err) {
        setTokenValid(false);
        setErrorState(t('auth.errors.invalidOrExpiredToken'));
      }
    };
    validateToken();
  }, [token, t]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: t('auth.validation.passwordsDoNotMatch'),
      });
      return;
    }
    
    setIsLoading(true);
    setMessage('');
    setErrorState('');

    try {
      await api.post('/auth/reset-password', { token, newPassword: data.newPassword });
      setMessage(t('auth.resetPassword.successMessage'));
      setTimeout(() => navigate(getLocalizedPath('/auth/login')), 3000);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setErrorState(t('auth.errors.passwordResetFailed'));
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isTokenValid === null) {
      return <div className="min-h-screen flex items-center justify-center">{t('common.loading')}</div>
  }

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{t('auth.resetPassword.title')}</h2>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {!isTokenValid ? (
            <div className="text-center text-red-600">
              <p>{error}</p>
              <Link to={getLocalizedPath('/auth/forgot-password')} className="link mt-4 inline-block">{t('auth.resetPassword.requestAgain')}</Link>
            </div>
          ) : message ? (
            <div className="text-center text-green-600">
              <p>{message}</p>
              <Link to={getLocalizedPath('/auth/login')} className="link mt-4 inline-block">{t('auth.resetPassword.backToLogin')}</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.newPassword')}</label>
                <input
                  type="password"
                  id="newPassword"
                  {...register('newPassword', { required: t('auth.validation.passwordRequired'), minLength: { value: 8, message: t('auth.validation.passwordMinLength', { min: 8 }) } })}
                  className={`w-full input ${errors.newPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={t('auth.placeholders.password')}
                />
                {errors.newPassword && <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>}
              </div>

              {/* Confirm New Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.confirmPassword')}</label>
                <input
                  type="password"
                  id="confirmPassword"
                  {...register('confirmPassword', { required: t('auth.validation.confirmPasswordRequired') })}
                  className={`w-full input ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={t('auth.placeholders.confirmPassword')}
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
              </div>
              
              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={isLoading} className="w-full btn btn-primary">
                {isLoading ? t('auth.resetPassword.resetting') : t('auth.resetPassword.resetPassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage; 