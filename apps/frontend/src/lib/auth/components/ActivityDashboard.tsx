'use client';

import React, { useState, useEffect } from 'react';
import { accountApi, UserActivity, UserActivitySummary } from '../account-api';

interface ActivityDashboardProps {
  userId?: string; // For admin view
  isAdminView?: boolean;
}

const ActivityDashboard: React.FC<ActivityDashboardProps> = ({ userId, isAdminView = false }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [summary, setSummary] = useState<UserActivitySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadData();
  }, [userId, isAdminView]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [activitiesResponse, summaryResponse] = await Promise.all([
        isAdminView && userId
          ? accountApi.getAdminUserActivity(userId, ITEMS_PER_PAGE, 0)
          : accountApi.getActivityHistory(ITEMS_PER_PAGE, 0),
        isAdminView && userId
          ? accountApi.getAdminUserActivitySummary(userId)
          : accountApi.getActivitySummary(),
      ]);

      setActivities(activitiesResponse.data?.activities || []);
      setSummary(summaryResponse.data?.summary || null);
      setCurrentPage(1);
      setHasMoreData((activitiesResponse.data?.activities?.length || 0) === ITEMS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreActivities = async () => {
    if (!hasMoreData) return;

    try {
      const response = isAdminView && userId
        ? await accountApi.getAdminUserActivity(userId, ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
        : await accountApi.getActivityHistory(ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

      const newActivities = response.data?.activities || [];
      setActivities(prev => [...prev, ...newActivities]);
      setCurrentPage(prev => prev + 1);
      setHasMoreData(newActivities.length === ITEMS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more activities');
    }
  };

  const getActivityIcon = (activityType: string): string => {
    const icons: Record<string, string> = {
      login: '🔑',
      logout: '🚪',
      profile_update: '👤',
      password_change: '🔒',
      email_verification: '📧',
      password_reset: '🔄',
      role_assignment: '👑',
      account_deactivation: '🚫',
      account_reactivation: '✅',
      two_factor_enabled: '🛡️',
      two_factor_disabled: '🔓',
      failed_login: '⚠️',
      account_locked: '🔐',
      account_unlocked: '🔓',
    };
    return icons[activityType] || '📝';
  };

  const getActivityColor = (activityType: string, isSuccessful: boolean): string => {
    if (!isSuccessful) return 'text-red-600 bg-red-50';
    
    const colors: Record<string, string> = {
      login: 'text-green-600 bg-green-50',
      logout: 'text-blue-600 bg-blue-50',
      profile_update: 'text-purple-600 bg-purple-50',
      password_change: 'text-orange-600 bg-orange-50',
      email_verification: 'text-cyan-600 bg-cyan-50',
      password_reset: 'text-yellow-600 bg-yellow-50',
      role_assignment: 'text-indigo-600 bg-indigo-50',
      account_deactivation: 'text-red-600 bg-red-50',
      account_reactivation: 'text-green-600 bg-green-50',
      two_factor_enabled: 'text-green-600 bg-green-50',
      two_factor_disabled: 'text-yellow-600 bg-yellow-50',
      failed_login: 'text-red-600 bg-red-50',
      account_locked: 'text-red-600 bg-red-50',
      account_unlocked: 'text-green-600 bg-green-50',
    };
    return colors[activityType] || 'text-gray-600 bg-gray-50';
  };

  const formatActivityType = (activityType: string): string => {
    return activityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading activity...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <span className="text-red-500 text-xl mr-3">⚠️</span>
          <div>
            <h3 className="text-red-800 font-medium">Error Loading Activity</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isAdminView ? 'User Activity Dashboard' : 'Account Activity'}
        </h2>
        <p className="text-gray-600">
          {isAdminView
            ? 'Monitor user account activity and security events.'
            : 'Track your account activity and security events.'}
        </p>
      </div>

      {/* Activity Summary */}
      {summary && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{summary.totalActivities}</div>
              <div className="text-sm text-gray-600">Total Activities</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{summary.recentLogins}</div>
              <div className="text-sm text-gray-600">Recent Logins</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{summary.profileUpdates}</div>
              <div className="text-sm text-gray-600">Profile Updates</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{summary.passwordChanges}</div>
              <div className="text-sm text-gray-600">Password Changes</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{summary.failedAttempts}</div>
              <div className="text-sm text-gray-600">Failed Attempts</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xs font-bold text-gray-600">
                {summary.lastActivity
                  ? formatDate(summary.lastActivity)
                  : 'Never'}
              </div>
              <div className="text-sm text-gray-600">Last Activity</div>
            </div>
          </div>
        </div>
      )}

      {/* Activity History */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <span className="text-4xl mb-4 block">📝</span>
            <p>No activity recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity) => (
              <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  {/* Activity Icon */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    getActivityColor(activity.activity_type, activity.is_successful)
                  }`}>
                    <span className="text-lg">
                      {getActivityIcon(activity.activity_type)}
                    </span>
                  </div>

                  {/* Activity Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium text-gray-900">
                        {formatActivityType(activity.activity_type)}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          activity.is_successful
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {activity.is_successful ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    
                    {activity.failure_reason && (
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {activity.failure_reason}
                      </p>
                    )}

                    {/* Metadata */}
                    <div className="mt-2 text-xs text-gray-500 space-y-1">
                      {activity.ip_address && (
                        <div>IP: {activity.ip_address}</div>
                      )}
                      {activity.user_agent && (
                        <div className="truncate max-w-md">
                          User Agent: {activity.user_agent}
                        </div>
                      )}
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                            View metadata
                          </summary>
                          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {hasMoreData && activities.length > 0 && (
          <div className="p-6 border-t border-gray-200 text-center">
            <button
              onClick={loadMoreActivities}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load More Activities
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityDashboard; 