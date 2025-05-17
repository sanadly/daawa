'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function HtmlLangDirUpdater() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const currentLang = i18n.language;
    const direction = i18n.dir(currentLang); // Use i18n.dir() for reliability

    document.documentElement.lang = currentLang;
    document.documentElement.dir = direction;
  }, [i18n.language, i18n]); // Rerun effect when language changes

  return null; // This component doesn't render anything itself
} 