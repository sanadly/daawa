import React from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useLanguage } from '../hooks/useLanguage'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

const LandingPage: React.FC = () => {
  const { t } = useTranslation()
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath)
  const language = useLanguage((state) => state.language)
  const isRTL = language === 'ar'

  const features = [
    {
      title: t('landing.features.design.title'),
      description: t('landing.features.design.description'),
      icon: '🎨'
    },
    {
      title: t('landing.features.manage.title'),
      description: t('landing.features.manage.description'),
      icon: '👥'
    },
    {
      title: t('landing.features.checkin.title'),
      description: t('landing.features.checkin.description'),
      icon: '📱'
    },
    {
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
      icon: '📊'
    }
  ]

  return (
    <div dir={isRTL ? "rtl" : "ltr"} className="min-h-screen bg-gradient-to-br from-primary-50 to-neutral-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-neutral-200">
        <div className="container-custom">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">د</span>
              </div>
              <span className="ml-2 text-xl font-bold text-neutral-900">
                {t('common.appName')}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center space-x-4">
              <LanguageSwitcher compact={true} />
              
              <Link
                to={getLocalizedPath('/auth/login')}
                className="text-sm font-medium text-neutral-600 hover:text-primary-500 transition-colors"
              >
                {t('common.login')}
              </Link>
              
              <Link
                to={getLocalizedPath('/auth/signup')}
                className="btn btn-primary"
              >
                {t('common.signup')}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="section">
        <div className="container-custom">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="heading-1 mb-6 gradient-text">
                {t('landing.hero.title')}
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-2xl mx-auto">
                {t('landing.hero.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={getLocalizedPath('/auth/signup')}
                  className="btn btn-primary px-8 py-3 text-lg"
                >
                  {t('landing.hero.cta.getStarted')}
                </Link>
                <button className="btn btn-outline px-8 py-3 text-lg">
                  {t('landing.hero.cta.learnMore')}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section bg-white">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="heading-2 mb-4">
              {t('landing.features.title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card card-hover text-center"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-neutral-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-neutral-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-12">
        <div className="container-custom">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">د</span>
              </div>
              <span className="ml-2 text-xl font-bold">
                {t('common.appName')}
              </span>
            </div>
            <p className="text-neutral-400">
              {t('common.appTagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage 