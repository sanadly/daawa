'use client'; // Add this at the top if not already present

import React, { useState, useEffect } from 'react'; // Added useState, useEffect
import Link from 'next/link'; // Import Link for navigation
import { useAuth } from '@/contexts/AuthContext'; // Import useAuth
import { useRouter } from 'next/navigation'; // For logout redirect
import { useTranslation } from 'react-i18next'; // Changed from next-i18next
// If Navbar text needs translation, import useTranslation
// import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth(); // Get auth state and logout function
  const router = useRouter();
  const { t, i18n } = useTranslation('common'); // Get i18n instance

  // State to hold the language once client-side detection is complete
  const [effectiveLanguage, setEffectiveLanguage] = useState<string | undefined>(undefined);
  const [isClient, setIsClient] = useState(false);
  // console.log('Navbar render, isClient:', isClient, 'effectiveLanguage:', effectiveLanguage);

  useEffect(() => {
    // console.log('Navbar useEffect for setIsClient firing');
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient) {
      // console.log('Navbar isClient true, setting effectiveLanguage from i18n.language:', i18n.language);
      setEffectiveLanguage(i18n.language);
      const handleLanguageChanged = (lng: string) => {
        // console.log('Navbar languageChanged event, new lng:', lng);
        setEffectiveLanguage(lng);
      };
      i18n.on('languageChanged', handleLanguageChanged);
      return () => {
        i18n.off('languageChanged', handleLanguageChanged);
      };
    }
  }, [isClient, i18n]); // Add i18n to dependency array as it's used

  const handleLogout = async () => {
    try {
      // await logoutUser(); // Assuming you have a logoutUser API call in apiAuth.ts
      logout(); // Call context logout
      router.push('/login'); // Redirect to login page
    } catch (error) {
      console.error('Logout failed:', error);
      // Handle logout error (e.g., show a notification)
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  // const { t } = useTranslation('common'); // Uncomment if using t()

  return (
    <div className="navbar bg-base-100 shadow-lg px-4 sm:px-6 lg:px-8">
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl normal-case">
          {t('app_name', 'Daawa App')}
        </Link>
      </div>
      {/* <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li><Link href="/#features"><a>{t('nav_features', 'Features')}</a></Link></li> 
          <li><Link href="/#pricing"><a>{t('nav_pricing', 'Pricing')}</a></Link></li> 
        </ul>
      </div> */}
      <div className="navbar-end space-x-2">
        {isClient && effectiveLanguage && ( // Only render dropdown once client is mounted and language is determined
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-sm">
              {effectiveLanguage === 'ar' ? t('language_arabic_long', '🇸🇦 العربية') : t('language_english_long', '🇺🇸 English')}
              <svg className="fill-current h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
            </label>
            <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-40 z-[1]">
              <li>
                <button onClick={() => changeLanguage('en')} className={`btn btn-ghost btn-sm w-full justify-start ${effectiveLanguage === 'en' ? 'btn-active' : ''}`}>
                  {t('language_english_long', '🇺🇸 English')}
                </button>
              </li>
              <li>
                <button onClick={() => changeLanguage('ar')} className={`btn btn-ghost btn-sm w-full justify-start ${effectiveLanguage === 'ar' ? 'btn-active' : ''}`}>
                  {t('language_arabic_long', '🇸🇦 العربية')}
                </button>
              </li>
            </ul>
          </div>
        )}

        {isAuthenticated ? (
          <>
            {user && (
              <span className="text-sm hidden md:inline">{t('welcome', 'Welcome')}, {user.email || user.username}</span>
            )}
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              {t('dashboard_link', 'Dashboard')}
            </Link>
            <button onClick={handleLogout} className="btn btn-ghost btn-sm">
              {t('logout_button', 'Logout')}
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="btn btn-ghost btn-sm">
              {t('login_link', 'Login')}
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              {t('signup_link', 'Sign Up')}
            </Link>
          </>
        )}
        {/* Placeholder for mobile menu dropdown if needed later
        <div className="dropdown dropdown-end lg:hidden">
          <label tabIndex={0} className="btn btn-ghost">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </label>
          <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
            <li><Link href="/#features"><a>{t('nav_features', 'Features')}</a></Link></li>
            <li><Link href="/#pricing"><a>{t('nav_pricing', 'Pricing')}</a></Link></li>
            <li className="mt-2"><button className="btn btn-ghost btn-sm w-full">{t('navbar_login_button', 'Login')}</button></li>
            <li><button className="btn btn-primary btn-sm w-full">{t('navbar_signup_button', 'Sign Up')}</button></li>
          </ul>
        </div>
        */}
      </div>
    </div>
  );
};

export default Navbar; 