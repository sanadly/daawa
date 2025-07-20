import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './components/ProtectedRoute'
import { AppSidebar } from './components/AppSidebar'
import { useLanguage } from './hooks/useLanguage'
import { useEffect } from 'react'

// Pages
import LoginPage from './pages/auth/LoginPage'
import SignupPage from './pages/auth/SignupPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import DashboardPage from './pages/DashboardPage'
import EventsPage from './pages/EventsPage'
import EventCreatePage from './pages/EventCreatePage'
import EventDetailsPage from './pages/EventDetailsPage'
import ProfilePage from './pages/ProfilePage'
import CompanyPage from './pages/CompanyPage'
import QRTestPage from './pages/QRTestPage'
import ReportsPage from './pages/ReportsPage'
import LandingPage from './pages/LandingPage'
import NotFoundPage from './pages/NotFoundPage'

// Language initializer component
function LanguageInitializer() {
  const { language, isRTL } = useLanguage();
  
  useEffect(() => {
    // Ensure document direction is set immediately
    const direction = isRTL ? 'rtl' : 'ltr';
    document.documentElement.dir = direction;
    document.documentElement.lang = language;
    console.log('LanguageInitializer: Set document direction to', direction, 'for language:', language);
  }, [language, isRTL]);
  
  return null;
}

// Public layout wrapper
function PublicLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Outlet />
    </div>
  )
}

// Protected layout wrapper
function ProtectedLayout() {
  console.log('ProtectedLayout rendering')
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AppSidebar />
      <main className="flex-1 lg:ml-0 overflow-auto">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <LanguageInitializer />
      <Routes>
        {/* Redirect root to English */}
        <Route path="/" element={<Navigate to="/en" replace />} />
        
        {/* Public routes */}
        <Route path="/:lang" element={<PublicLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
        </Route>
        
        {/* Protected routes */}
        <Route path="/:lang" element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="events" element={<EventsPage />} />
            <Route path="events/create" element={<EventCreatePage />} />
            <Route path="events/:id" element={<EventDetailsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="company" element={<CompanyPage />} />
            <Route path="qr-test" element={<QRTestPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>
        </Route>
        
        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  )
}

export default App