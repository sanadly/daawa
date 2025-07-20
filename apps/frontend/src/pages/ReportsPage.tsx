import React from 'react'
import { useTranslation } from 'react-i18next'

const ReportsPage: React.FC = () => {
  const { t } = useTranslation()
  return <div><h1 className="heading-2 mb-6">{t('navigation.reports')}</h1><p>Reports page coming soon...</p></div>
}

export default ReportsPage 