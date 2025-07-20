import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

enum AccountType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

enum UserRole {
  COMPANY_ORGANIZER = 'company_organizer',
  INDIVIDUAL_ORGANIZER = 'individual_organizer',
  STAFF = 'staff',
}

interface SignupFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  account_type: AccountType;
  company_name?: string;
  job_title?: string;
  phone?: string;
  company_location?: string;
  company_description?: string;
  company_events_per_month?: number;
  company_staff_needed?: number;
}

const SignupPage: React.FC = () => {
  const { t } = useTranslation();
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const language = useLanguage((state) => state.language);
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath);
  const isRTL = language === 'ar';

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
    setError,
  } = useForm<SignupFormData>({
    defaultValues: {
      account_type: AccountType.INDIVIDUAL,
    },
  });

  const accountType = watch('account_type');

  const onSubmit = async (data: SignupFormData) => {
    setIsLoading(true);
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: t('auth.validation.passwordsDoNotMatch'),
      });
      setIsLoading(false);
      return;
    }

    try {
      const role =
        data.account_type === AccountType.COMPANY
          ? UserRole.COMPANY_ORGANIZER
          : UserRole.INDIVIDUAL_ORGANIZER;
          
      await signup({ ...data, role });
      navigate(`/${language}/dashboard`);
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.response?.status === 409) {
        setError('root', {
          type: 'manual',
          message: t('auth.errors.emailConflict'),
        });
      } else {
        setError('root', {
          type: 'manual',
          message: t('auth.errors.signupFailed'),
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
            {t('auth.signup.title')}
          </h2>
          <p className="text-gray-600">
            {t('auth.signup.subtitle')}
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Account Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">{t('auth.fields.accountType')}</label>
              <Controller
                name="account_type"
                control={control}
                render={({ field }) => (
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => field.onChange(AccountType.INDIVIDUAL)}
                      className={`
                        flex-1 py-3 px-4 border rounded-lg text-sm font-medium transition-all
                        ${field.value === AccountType.INDIVIDUAL ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {t('auth.accountTypes.individual')}
                    </button>
                    <button
                      type="button"
                      onClick={() => field.onChange(AccountType.COMPANY)}
                      className={`
                        flex-1 py-3 px-4 border rounded-lg text-sm font-medium transition-all
                        ${field.value === AccountType.COMPANY ? 'bg-primary-600 text-white border-primary-600 shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-50'}
                      `}
                    >
                      {t('auth.accountTypes.company')}
                    </button>
                  </div>
                )}
              />
            </div>
            
            {/* Company Name (conditional) */}
            {accountType === AccountType.COMPANY && (
              <div>
                <label 
                  htmlFor="company_name" 
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {t('auth.fields.companyName')}
                </label>
                <input
                  type="text"
                  id="company_name"
                  {...register('company_name', {
                    required: t('auth.validation.companyNameRequired'),
                  })}
                  className={`w-full input ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`}
                  placeholder={t('auth.placeholders.companyName')}
                  disabled={isLoading}
                />
                {errors.company_name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.company_name.message}
                  </p>
                )}
              </div>
            )}

            {/* Company-specific fields */}
            {accountType === AccountType.COMPANY && (
              <>
                {/* Company Location */}
                <div className="mt-4">
                  <label htmlFor="company_location" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.signup.companyFields.location')}
                  </label>
                  <input
                    type="text"
                    id="company_location"
                    {...register('company_location', {
                      required: accountType === AccountType.COMPANY ? t('auth.validation.fieldRequired') : false,
                    })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-shadow duration-300 ${errors.company_location ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.company_location && <p className="text-red-500 text-xs mt-1">{errors.company_location.message}</p>}
                </div>

                {/* Company Description */}
                <div className="mt-4">
                  <label htmlFor="company_description" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.signup.companyFields.description')}
                  </label>
                  <textarea
                    id="company_description"
                    {...register('company_description')}
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-shadow duration-300 border-gray-300"
                    rows={3}
                  ></textarea>
                </div>

                {/* Events Per Month */}
                <div className="mt-4">
                  <label htmlFor="company_events_per_month" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.signup.companyFields.eventsPerMonth')}
                  </label>
                  <input
                    type="number"
                    id="company_events_per_month"
                    {...register('company_events_per_month', {
                      valueAsNumber: true,
                      min: { value: 0, message: t('auth.validation.positiveNumberRequired') }
                    })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-shadow duration-300 ${errors.company_events_per_month ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.company_events_per_month && <p className="text-red-500 text-xs mt-1">{errors.company_events_per_month.message}</p>}
                </div>

                {/* Staff Needed */}
                <div className="mt-4">
                  <label htmlFor="company_staff_needed" className="block text-sm font-medium text-gray-700 mb-2">
                    {t('auth.signup.companyFields.staffNeeded')}
                  </label>
                  <input
                    type="number"
                    id="company_staff_needed"
                    {...register('company_staff_needed', {
                      valueAsNumber: true,
                      min: { value: 0, message: t('auth.validation.positiveNumberRequired') }
                    })}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500/50 focus:border-green-500 transition-shadow duration-300 ${errors.company_staff_needed ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {errors.company_staff_needed && <p className="text-red-500 text-xs mt-1">{errors.company_staff_needed.message}</p>}
                </div>
              </>
            )}

            {/* Full Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.fullName')}</label>
              <input
                type="text"
                id="name"
                {...register('name', { required: t('auth.validation.nameRequired') })}
                className={`w-full input ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('auth.placeholders.fullName')}
                disabled={isLoading}
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>

            {/* Email Field */}
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
            
            {/* Job Title (conditional) */}
            {accountType === AccountType.COMPANY && (
              <div>
                <label htmlFor="job_title" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.jobTitle')}</label>
                <input
                  type="text"
                  id="job_title"
                  {...register('job_title')}
                  className={`w-full input border-gray-300`}
                  placeholder={t('auth.placeholders.jobTitle')}
                  disabled={isLoading}
                />
              </div>
            )}
            
            {/* Phone Number */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.phone')}</label>
              <input
                type="tel"
                id="phone"
                {...register('phone', {
                  pattern: {
                    value: /^[+]?[1-9][\d\s\-()]+$/,
                    message: t('auth.validation.phoneInvalid') || 'Please provide a valid phone number',
                  },
                })}
                className={`w-full input ${errors.phone ? 'border-red-500' : 'border-gray-300'} ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={t('auth.placeholders.phone')}
                disabled={isLoading}
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.password')}</label>
              <div className={`flex items-center border rounded-lg focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-primary-500 transition-colors ${errors.password ? 'border-red-500' : 'border-gray-300'} ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}> 
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 px-3 py-2 focus:outline-none flex-shrink-0 border-0"
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
                    minLength: { value: 8, message: t('auth.validation.passwordMinLength', { min: 8 }) },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                      message: t('auth.validation.passwordComplexity') || 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                    },
                  })}
                  className={`flex-1 bg-transparent px-3 py-2 focus:outline-none border-0 text-neutral-900 placeholder-neutral-400 ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('auth.placeholders.password')}
                  disabled={isLoading}
                />
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">{t('auth.fields.confirmPassword')}</label>
              <input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword', {
                  required: t('auth.validation.confirmPasswordRequired'),
                })}
                className={`w-full input ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder={t('auth.placeholders.confirmPassword')}
                disabled={isLoading}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
            </div>

            {/* General Error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary"
            >
              {isLoading ? t('auth.signup.creatingAccount') : t('auth.signup.createAccount')}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center border-t pt-6">
            <p className="text-sm text-gray-600">
              {t('auth.signup.haveAccount')}{' '}
              <Link to={getLocalizedPath('/login')} className="link">
                {t('auth.signup.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage; 