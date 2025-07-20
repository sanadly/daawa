import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'

const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  const language = useLanguage((state) => state.language)
  const isRTL = language === 'ar'
  
  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="heading-2 mb-6">{t('navigation.profile')}</h1>
      <p>Profile page coming soon...</p>
    </div>
  )
}

export default ProfilePage 