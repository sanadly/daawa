import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import Button from './ui/Button';
import Input from './ui/Input';
import { useTranslation } from 'react-i18next';

type FormValues = {
  email: string;
  password: string;
};

const LoginForm = () => {
  const { t } = useTranslation('common');
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);
    
    try {
      await login(data.email, data.password);
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Development bypass function for quick testing
  const handleDevBypass = async () => {
    if (process.env.NODE_ENV !== 'development') return;
    
    setError(null);
    setIsLoading(true);
    
    try {
      // Mock successful login with admin privileges
      const mockUserData = {
        id: 1,
        email: 'admin@example.com',
        role: 'ADMIN',
        name: 'Admin User'
      };
      
      // Store a fake token in localStorage for development
      localStorage.setItem('auth_token', 'dev-bypass-token');
      localStorage.setItem('user_data', JSON.stringify(mockUserData));
      
      // Use the auth context to update state
      await login('admin@example.com', 'admin123', true); // Pass true as bypass flag
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: unknown) {
      console.error('Dev bypass error:', err);
      setError(err instanceof Error ? err.message : 'Development bypass failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card w-full bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title text-2xl font-bold mb-6 text-center justify-center">
          {t('login_title', 'Login')}
        </h2>
        
        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-control">
            <label htmlFor="email" className="label">
              <span className="label-text">{t('email_label', 'Email')}</span>
            </label>
            <Input
              id="email"
              type="email"
              className="input input-bordered w-full"
              {...register('email', { 
                required: t('email_required', 'Email is required'),
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: t('email_invalid', 'Invalid email address')
                }
              })}
              error={errors.email?.message}
            />
          </div>
          
          <div className="form-control">
            <label htmlFor="password" className="label">
              <span className="label-text">{t('password_label', 'Password')}</span>
            </label>
            <Input
              id="password"
              type="password"
              className="input input-bordered w-full"
              {...register('password', { required: t('password_required', 'Password is required') })}
              error={errors.password?.message}
            />
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="text-sm">
              <Link href="/forgot-password" className="link link-primary">
                {t('forgot_password', 'Forgot your password?')}
              </Link>
            </div>
            <div className="text-sm">
              <Link href="/register" className="link link-primary">
                {t('create_account', 'Create an account')}
              </Link>
            </div>
          </div>
          
          <div className="form-control mt-6">
            <Button type="submit" isLoading={isLoading} className="btn-primary btn-block">
              {t('login_button', 'Login')}
            </Button>
            
            {process.env.NODE_ENV === 'development' && (
              <Button 
                type="button" 
                onClick={handleDevBypass} 
                variant="secondary" 
                className="mt-2 btn-block"
              >
                {t('dev_bypass', 'DEV: Login as Admin')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginForm; 