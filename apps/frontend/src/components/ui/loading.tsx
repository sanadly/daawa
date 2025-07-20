import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../../hooks/useLanguage';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullPage?: boolean;
  className?: string;
}

export const Loading: React.FC<LoadingProps> = ({ 
  size = 'md', 
  text, 
  fullPage = true, // Changed default to true for better UX
  className = ''
}) => {
  const { t } = useTranslation();
  const language = useLanguage((state) => state.language);
  const isRTL = language === 'ar';

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-6 w-6';
      case 'lg':
        return 'h-16 w-16';
      default:
        return 'h-12 w-12';
    }
  };

  const containerClasses = fullPage 
    ? 'min-h-screen flex items-center justify-center'
    : 'flex items-center justify-center';

  return (
    <div 
      dir={isRTL ? "rtl" : "ltr"} 
      className={`${containerClasses} ${className}`}
    >
      <div className="text-center">
        <div className={`animate-spin rounded-full ${getSizeClasses()} border-b-2 border-primary mx-auto`}></div>
        <p className="mt-4 text-gray-600">
          {text || t('common.loading')}
        </p>
      </div>
    </div>
  );
};

export default Loading; 