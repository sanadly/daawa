import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  compact?: boolean;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher({ compact = false }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const { language, setLanguage } = useLanguage();
  const isRTL = language === 'ar';

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];

  const changeLanguage = (newLanguage: 'en' | 'ar') => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={compact ? "ghost" : "outline"} 
          size={compact ? "sm" : "default"}
          className={`flex items-center gap-2 ${compact ? 'px-2 py-1' : 'px-3 py-2'} ${compact ? '' : 'w-full justify-between'}`}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentLanguage.flag}</span>
            {!compact && (
              <span className="font-medium">
                {currentLanguage.name}
              </span>
            )}
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem 
            key={language.code}
            onClick={() => changeLanguage(language.code as 'en' | 'ar')}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="text-lg">{language.flag}</span>
            <span className="font-medium">
              {language.name}
            </span>
            {currentLanguage.code === language.code && (
              <span className="ml-auto text-blue-600">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 