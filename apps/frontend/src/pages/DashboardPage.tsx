import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  CheckSquare, 
  BarChart3, 
  Plus, 
  Eye, 
  UserCheck,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth.tsx'
import { useLanguage } from '../hooks/useLanguage.ts'
import api from '../lib/api'
import Loading from '../components/ui/loading'
import ApiErrorHandler from '../components/ApiErrorHandler'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalGuests: number
  checkedIn: number
}

interface RecentActivity {
  id: string
  type: 'event_created' | 'guest_registered' | 'event_published' | 'checkin_completed'
  message: string
  timestamp: string
  user?: string
}

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  color: string
}

const DashboardPage: React.FC = () => {
  const { t } = useTranslation()
  const { user } = useAuth()
  const getLocalizedPath = useLanguage((state) => state.getLocalizedPath)
  const language = useLanguage((state) => state.language)
  const isRTL = language === 'ar'
  
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeEvents: 0,
    totalGuests: 0,
    checkedIn: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)
  
  // Add refs to prevent multiple API calls
  const mountedRef = useRef(false)
  const isFetchingRef = useRef(false)
  const hasInitializedRef = useRef(false)

  const quickActions: QuickAction[] = [
    {
      title: t('dashboard.quickActions.createEvent'),
      description: t('dashboard.startPlanning'),
      icon: Plus,
      href: getLocalizedPath('/events/create'),
      color: 'bg-primary-600'
    },
    {
      title: t('dashboard.quickActions.viewAllEvents'),
      description: t('dashboard.manageAllEvents'),
      icon: Calendar,
      href: getLocalizedPath('/events'),
      color: 'bg-primary-600'
    },
    {
      title: t('dashboard.quickActions.manageGuests'),
      description: t('dashboard.manageGuestLists'),
      icon: Users,
      href: getLocalizedPath('/guests'),
      color: 'bg-primary-600'
    },
    {
      title: t('dashboard.checkinDashboard'),
      description: t('dashboard.monitorEventCheckins'),
      icon: CheckSquare,
      href: getLocalizedPath('/checkin'),
      color: 'bg-primary-600'
    }
  ]

  const fetchDashboardData = async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      console.log('Dashboard: Skipping fetch - already in progress')
      return
    }
    
    // Prevent calls if component is unmounted
    if (!mountedRef.current) {
      console.log('Dashboard: Skipping fetch - component not mounted')
      return
    }

    // Prevent multiple initializations
    if (hasInitializedRef.current) {
      console.log('Dashboard: Skipping fetch - already initialized')
      return
    }

    try {
      console.log('Dashboard: Starting fetch')
      isFetchingRef.current = true
      hasInitializedRef.current = true
      setLoading(true)
      setError(null)
      
      // Fetch dashboard statistics - use the user-specific endpoint
      const statsResponse = await api.get('/events/dashboard/stats')
      const backendData = statsResponse.data.data || {}
      
      // Map backend data to frontend expected format
      const statsData: DashboardStats = {
        totalEvents: backendData.totalEvents || 0,
        activeEvents: backendData.activeEvents || 0,
        totalGuests: backendData.totalGuests || 0,
        checkedIn: backendData.checkedIn || 0
      }
      
      // For now, set empty activity since there's no activity endpoint
      // We can implement this later or use a different approach
      const activityData: RecentActivity[] = []
      
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setStats(statsData)
        setRecentActivity(activityData)
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard data:', err)
      if (mountedRef.current) {
        setError(err)
        // Set default values on error
        setStats({
          totalEvents: 0,
          activeEvents: 0,
          totalGuests: 0,
          checkedIn: 0
        })
        setRecentActivity([])
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
      isFetchingRef.current = false
    }
  }

  useEffect(() => {
    console.log('Dashboard: Component mounted')
    mountedRef.current = true
    fetchDashboardData()
    
    return () => {
      console.log('Dashboard: Component unmounted')
      mountedRef.current = false
      hasInitializedRef.current = false
    }
  }, [])

  const StatCard: React.FC<{ title: string; value: number; icon: React.ComponentType<{ className?: string }>; color: string }> = ({ 
    title, 
    value, 
    icon: Icon, 
    color 
  }) => (
    <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <Icon className="text-white w-6 h-6" />
        </div>
      </div>
    </div>
  )

  const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => (
    <div className="flex items-start space-x-3 p-3 hover:bg-neutral-50 rounded-lg transition-colors">
      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-primary-600">
          {activity.type === 'event_created' && <Plus className="w-4 h-4" />}
          {activity.type === 'guest_registered' && <Users className="w-4 h-4" />}
          {activity.type === 'event_published' && <Eye className="w-4 h-4" />}
          {activity.type === 'checkin_completed' && <CheckSquare className="w-4 h-4" />}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 font-medium">{activity.message}</p>
        <div className="flex items-center space-x-2 mt-1">
          <p className="text-xs text-neutral-500">{activity.timestamp}</p>
          {activity.user && (
            <>
              <span className="text-xs text-neutral-300">•</span>
              <p className="text-xs text-neutral-500">{activity.user}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <Loading />
  }

  return (
    <ApiErrorHandler 
      error={error} 
      isLoading={loading}
      onRetry={fetchDashboardData}
    >
      <div dir={isRTL ? "rtl" : "ltr"} className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            {t('dashboard.welcome', { name: user?.email?.split('@')[0] || user?.name || 'User' })}
          </h1>
          <p className="text-primary-100 text-lg">
                {t('dashboard.subtitle')}
          </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t('dashboard.stats.totalEvents')}
            value={stats.totalEvents}
            icon={BarChart3}
            color="bg-primary-600"
          />
          <StatCard
            title={t('dashboard.stats.activeEvents')}
            value={stats.activeEvents}
            icon={Activity}
            color="bg-primary-600"
          />
          <StatCard
            title={t('dashboard.stats.totalGuests')}
            value={stats.totalGuests}
            icon={Users}
            color="bg-primary-600"
          />
          <StatCard
            title={t('dashboard.stats.checkedIn')}
            value={stats.checkedIn}
            icon={CheckSquare}
            color="bg-primary-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-soft p-6">
              <h2 className="text-xl font-semibold text-neutral-900 mb-6">
                {t('dashboard.quickActionsHeader')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon
                  return (
                    <Link
                      key={index}
                      to={action.href}
                      className="group p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
                    >
                      <div className="flex items-center space-x-3"> 
                        <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <Icon className="text-white w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-neutral-900 group-hover:text-primary-600 transition-colors">
                            {action.title}
                          </h3>
                          <p className="text-sm text-neutral-600 mt-1">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              {t('dashboard.recentActivity')}
            </h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                  <ActivityItem key={activity.id} activity={activity} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-neutral-500 text-sm">
                  {t('dashboard.noRecentActivity')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Events */}
        <div className="bg-white rounded-xl shadow-soft p-6">
          <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              {t('dashboard.upcomingEvents')}
          </h2>
            <div className="space-y-4">
              <div className="text-center py-8">
                <p className="text-sm text-neutral-600">
                  {t('dashboard.noUpcomingEvents')}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6"> 
              {t('dashboard.quickStats')}
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">
                  {t('dashboard.avgEventDuration')}
                </span>
                <span className="text-sm font-medium text-neutral-900">
                  {t('dashboard.notAvailable')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">
                  {t('dashboard.avgGuestsPerEvent')}
                </span>
                <span className="text-sm font-medium text-neutral-900">
                  {t('dashboard.notAvailable')}
                </span>
            </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-600">
                  {t('dashboard.checkinRate')}
                </span>
                <span className="text-sm font-medium text-neutral-900">
                  {t('dashboard.notAvailable')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ApiErrorHandler>
  )
}

export default DashboardPage 