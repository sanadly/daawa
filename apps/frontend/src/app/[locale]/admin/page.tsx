'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/auth-context';
import { UserRole } from '../../../lib/auth/types';
import { RoleGuard } from '../../../lib/auth/components/RoleGuard';
import { LoadingSpinner } from '../../../lib/auth/components/LoadingSpinner';
import { adminApi } from '../../../lib/admin/admin-api';
import toast from 'react-hot-toast';

interface DashboardMetrics {
  totalEvents: number;
  pendingApproval: number;
  activeEvents: number;
  totalOrganizers: number;
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  adminUser: string;
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const data = await adminApi.getDashboardMetrics();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
      
      // Fallback to mock data for development
      setMetrics({
        totalEvents: 0,
        pendingApproval: 0,
        activeEvents: 0,
        totalOrganizers: 0,
        recentActivity: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <RoleGuard roles={[UserRole.ADMIN]} fallback={<div>Access denied</div>}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage events and monitor platform activity</p>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard
              title="Total Events"
              value={metrics?.totalEvents || 0}
              icon="📊"
              bgColor="bg-blue-500"
            />
            <MetricCard
              title="Pending Approval"
              value={metrics?.pendingApproval || 0}
              icon="⏳"
              bgColor="bg-yellow-500"
              href="/admin/events?status=pending"
            />
            <MetricCard
              title="Active Events"
              value={metrics?.activeEvents || 0}
              icon="✅"
              bgColor="bg-green-500"
              href="/admin/events?status=active"
            />
            <MetricCard
              title="Organizers"
              value={metrics?.totalOrganizers || 0}
              icon="👥"
              bgColor="bg-purple-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <ActionButton
                  href="/admin/events?status=pending"
                  title="Review Pending Events"
                  description="Review and approve events waiting for activation"
                  icon="📋"
                />
                <ActionButton
                  href="/admin/events"
                  title="Manage All Events"
                  description="View and manage all events in the system"
                  icon="🗂️"
                />
                <ActionButton
                  href="/admin/organizers"
                  title="Manage Organizers"
                  description="View and manage organizer accounts"
                  icon="👤"
                />
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-3">
                {metrics?.recentActivity.map((item) => (
                  <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-600">{item.entity}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(item.timestamp).toLocaleString()} by {item.adminUser}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-4 text-sm text-blue-600 hover:text-blue-800">
                View all activity →
              </button>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}

interface MetricCardProps {
  title: string;
  value: number;
  icon: string;
  bgColor: string;
  href?: string;
}

function MetricCard({ title, value, icon, bgColor, href }: MetricCardProps) {
  const content = (
    <div className={`${bgColor} text-white rounded-lg p-6 shadow-lg transition-transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block">
        {content}
      </a>
    );
  }

  return content;
}

interface ActionButtonProps {
  href: string;
  title: string;
  description: string;
  icon: string;
}

function ActionButton({ href, title, description, icon }: ActionButtonProps) {
  return (
    <a 
      href={href}
      className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
    >
      <div className="text-2xl">{icon}</div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <div className="text-gray-400">→</div>
    </a>
  );
} 