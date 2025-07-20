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

// Menu items
const platformItems = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Events", url: "/events", icon: Calendar },
  { title: "Guests", url: "/guests", icon: Users },
  { title: "Passes", url: "/passes", icon: FileText },
  { title: "QR Scanner", url: "/qr-test", icon: QrCode },
  { title: "Reports", url: "/reports", icon: BarChart3 },
]

const settingsItems = [
  { title: "Profile", url: "/profile", icon: Settings },
  { title: "Company", url: "/company", icon: Building2 },
]

interface AppSidebarProps {
  className?: string
}

export function AppSidebar({ className }: AppSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const handleNavigation = (url: string) => {
    const langPrefix = `/${language}`
    const fullUrl = `${langPrefix}${url}`
    navigate(fullUrl)
    setIsOpen(false) // Close mobile sidebar after navigation
  }

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang as 'en' | 'ar')
    // Update URL with new language
    const currentPath = location.pathname
    const pathWithoutLang = currentPath.replace(/^\/[a-z]{2}/, '')
    navigate(`/${newLang}${pathWithoutLang}`)
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
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white shadow-lg
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
        ${className}
      `}>
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Daawa</h2>
          <p className="text-sm text-gray-600 mt-1">Welcome, {user?.name}</p>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Platform Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Platform
            </h3>
            <nav className="space-y-1">
              {platformItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.title}
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
                    {item.title}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Settings Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Settings
            </h3>
            <nav className="space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.title}
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
                    {item.title}
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Language Switcher */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Language
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${language === 'en'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('ar')}
                className={`
                  px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${language === 'ar'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                العربية
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  )
} 