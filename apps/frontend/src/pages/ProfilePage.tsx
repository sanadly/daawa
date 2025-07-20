import React from 'react'
import { useTranslation } from 'react-i18next'

const ProfilePage: React.FC = () => {
  const { t } = useTranslation()
  return <div><h1 className="heading-2 mb-6">{t('navigation.profile')}</h1><p>Profile page coming soon...</p></div>
}

export default ProfilePage 