import React from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../hooks/useLanguage'

const ReportsPage: React.FC = () => {
  const { t } = useTranslation()
  const language = useLanguage((state) => state.language)
  const isRTL = language === 'ar'
  
  return (
    <div dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="heading-2 mb-6">{t('navigation.reports')}</h1>
      <p>Reports page coming soon...</p>
    </div>
  )
}

export default ReportsPage 