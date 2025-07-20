import {
  Calendar,
  Users,
  FileText,
  Settings,
  Home,
  Building2,
  Globe,
  LogOut,
  QrCode,
  BarChart3,
  Menu,
  X
} from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { useLanguage } from "../hooks/useLanguage"
import { useState } from "react"
import { LanguageSwitcher } from "./LanguageSwitcher"
import { useTranslation } from "react-i18next"

const platformItems = [
  { key: "dashboard", url: "/dashboard", icon: Home },
  { key: "events", url: "/events", icon: Calendar },
  { key: "guests", url: "/guests", icon: Users },
  { key: "passes", url: "/passes", icon: FileText },
  { key: "qrTest", url: "/qr-test", icon: QrCode },
  { key: "reports", url: "/reports", icon: BarChart3 },
]

const settingsItems = [
  { key: "profile", url: "/profile", icon: Settings },
  { key: "company", url: "/company", icon: Building2 },
]

export function AppSidebar({ className }: { className?: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { language } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const isRTL = language === "ar"

  const handleNavigation = (url: string) => {
    const langPrefix = `/${language}`
    const fullUrl = `${langPrefix}${url}`
    navigate(fullUrl)
    setIsOpen(false)
  }

  const handleLogout = () => {
    logout()
    navigate(`/${language}/login`)
  }

  const isActive = (url: string) => {
    const langPrefix = `/${language}`
    const fullUrl = `${langPrefix}${url}`
    return location.pathname === fullUrl
  }

  return (
    <div
      dir={isRTL ? "rtl" : "ltr"}
      className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-screen
        ${className}
      `}
    >
        {/* Header */}
        <div className="p-6 border-b flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Daawa</h2>
        <p className="text-sm text-gray-600 mt-1">
          {t('sidebar.welcome', { name: user?.name })}
        </p>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <div>
            {/* Platform Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('sidebar.platform')}
              </h3>
              <nav className="space-y-1">
                {platformItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                    key={item.key}
                      onClick={() => handleNavigation(item.url)}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                        transition-colors duration-150 ease-in-out
                        ${isActive(item.url)
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                    <span>
                      {t(`navigation.${item.key}`)}
                    </span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Settings Section */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('sidebar.settings')}
              </h3>
              <nav className="space-y-1">
                {settingsItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                    key={item.key}
                      onClick={() => handleNavigation(item.url)}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
                        transition-colors duration-150 ease-in-out
                        ${isActive(item.url)
                          ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                    <span>
                      {t(`navigation.${item.key}`)}
                    </span>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Language Switcher */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {t('sidebar.language')}
              </h3>
            <LanguageSwitcher />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex-shrink-0 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
          <span>{t('common.logout')}</span>
          </button>
        </div>
      </div>
  )
} 