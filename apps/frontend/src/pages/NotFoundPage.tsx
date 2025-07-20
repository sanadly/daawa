import React from 'react'
import { useTranslation } from 'react-i18next'

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="heading-1 mb-4">{t('errors.404.title')}</h1>
        <p className="text-neutral-600">{t('errors.404.message')}</p>
      </div>
    </div>
  )
}

export default NotFoundPage 