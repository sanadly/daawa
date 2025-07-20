import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.tsx'
import { useLanguage } from '../hooks/useLanguage.ts'

interface DashboardStats {
  totalEvents: number
  activeEvents: number
  totalGuests: number
  checkedIn: number
}

interface RecentActivity {
  id: string
  type: string
  message: string
  timestamp: string
  user?: string
}

interface QuickAction {
  title: string
  description: string
  icon: string
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

  const quickActions: QuickAction[] = [
    {
      title: t('dashboard.quickActions.createEvent'),
      description: 'Start planning your next event',
      icon: '🎉',
      href: getLocalizedPath('/events/create'),
      color: 'bg-primary-500'
    },
    {
      title: t('dashboard.quickActions.viewAllEvents'),
      description: 'Manage all your events',
      icon: '📅',
      href: getLocalizedPath('/events'),
      color: 'bg-blue-500'
    },
    {
      title: t('dashboard.quickActions.manageGuests'),
      description: 'View and manage guest lists',
      icon: '👥',
      href: getLocalizedPath('/guests'),
      color: 'bg-green-500'
    },
    {
      title: 'Check-in Dashboard',
      description: 'Monitor event check-ins',
      icon: '✅',
      href: getLocalizedPath('/checkin'),
      color: 'bg-purple-500'
    }
  ]

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        
        // Mock data for now - replace with actual API calls
        const mockStats: DashboardStats = {
          totalEvents: 12,
          activeEvents: 3,
          totalGuests: 248,
          checkedIn: 156
        }
        
        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'event_created',
            message: 'New event "Summer Wedding" created',
            timestamp: '2 hours ago',
            user: 'You'
          },
          {
            id: '2',
            type: 'guest_registered',
            message: '5 new guests registered for "Corporate Dinner"',
            timestamp: '4 hours ago'
          },
          {
            id: '3',
            type: 'event_published',
            message: 'Event "Birthday Celebration" published',
            timestamp: '1 day ago',
            user: 'You'
          },
          {
            id: '4',
            type: 'checkin_completed',
            message: '25 guests checked in for "Conference 2024"',
            timestamp: '2 days ago'
          }
        ]
        
        setStats(mockStats)
        setRecentActivity(mockActivity)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  const StatCard: React.FC<{ title: string; value: number; icon: string; color: string }> = ({ 
    title, 
    value, 
    icon, 
    color 
  }) => (
    <div className="bg-white rounded-xl shadow-soft p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-neutral-900">{value.toLocaleString()}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          <span className="text-white text-xl">{icon}</span>
        </div>
      </div>
    </div>
  )

  const ActivityItem: React.FC<{ activity: RecentActivity }> = ({ activity }) => (
    <div className={`flex items-start ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'} p-3 hover:bg-neutral-50 rounded-lg transition-colors`}>
      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-primary-600 text-sm">
          {activity.type === 'event_created' && '🎉'}
          {activity.type === 'guest_registered' && '👥'}
          {activity.type === 'event_published' && '📢'}
          {activity.type === 'checkin_completed' && '✅'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 font-medium">{activity.message}</p>
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} mt-1`}>
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          {t('dashboard.welcome', { name: user?.email?.split('@')[0] || user?.name || 'User' })}
        </h1>
        <p className="text-primary-100 text-lg">
          {isRTL ? 'إدارة فعالياتك بسهولة وكفاءة' : 'Manage your events with ease and efficiency'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.stats.totalEvents')}
          value={stats.totalEvents}
          icon="📊"
          color="bg-blue-500"
        />
        <StatCard
          title={t('dashboard.stats.activeEvents')}
          value={stats.activeEvents}
          icon="🎯"
          color="bg-green-500"
        />
        <StatCard
          title={t('dashboard.stats.totalGuests')}
          value={stats.totalGuests}
          icon="👥"
          color="bg-purple-500"
        />
        <StatCard
          title={t('dashboard.stats.checkedIn')}
          value={stats.checkedIn}
          icon="✅"
          color="bg-orange-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <h2 className="text-xl font-semibold text-neutral-900 mb-6">
              {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.href}
                  className="group p-4 border border-neutral-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
                >
                  <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-3' : 'space-x-3'}`}>
                    <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <span className="text-white text-lg">{action.icon}</span>
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
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-soft p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-neutral-900">
                {isRTL ? 'النشاط الأخير' : 'Recent Activity'}
              </h2>
              <Link
                to={getLocalizedPath('/activity')}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                {isRTL ? 'عرض الكل' : 'View all'}
              </Link>
            </div>
            <div className="space-y-2">
              {recentActivity.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-xl shadow-soft p-6">
        <h2 className="text-xl font-semibold text-neutral-900 mb-6">
          {isRTL ? 'رؤى سريعة' : 'Quick Insights'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {((stats.checkedIn / stats.totalGuests) * 100).toFixed(1)}%
            </div>
            <p className="text-sm text-neutral-600">
              {isRTL ? 'معدل الحضور' : 'Attendance Rate'}
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {(stats.totalGuests / stats.totalEvents).toFixed(0)}
            </div>
            <p className="text-sm text-neutral-600">
              {isRTL ? 'متوسط الضيوف لكل فعالية' : 'Avg. Guests per Event'}
            </p>
          </div>
          <div className="text-center p-4 bg-neutral-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 mb-2">
              {stats.activeEvents}
            </div>
            <p className="text-sm text-neutral-600">
              {isRTL ? 'فعاليات نشطة' : 'Active Events'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage 