'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { fetchUserProfile } from '@/services/apiProfile';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { User } from '@/types/auth';
import { useTranslation } from 'react-i18next';
import { Shield, Bell, History, Link as LinkIcon } from 'lucide-react';

export default function ProfilePage() {
  const { t } = useTranslation('common');
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('integrations');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const userData = await fetchUserProfile();
        setProfileData(userData);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        toast.error(t('profile_fetch_error', 'Failed to load your profile. Please try again.'));
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, router, t]);

  // These functions would be implemented with real APIs in a complete app
  const handleNotificationUpdate = async () => {
    toast.info(t('feature_coming_soon', 'This feature is coming soon!'));
    // Example API call: await updateNotificationSettings(settings);
  };

  const handleSecurityUpdate = async () => {
    toast.info(t('feature_coming_soon', 'This feature is coming soon!'));
    // Example API call: await updateSecuritySettings(settings);
  };

  if (loading && !profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-8 mb-8">
        <div className="md:w-1/4">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body items-center text-center">
              <div className="avatar placeholder mb-4">
                <div className="bg-primary text-primary-content rounded-full w-24">
                  <span className="text-3xl">
                    {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
                  </span>
                </div>
              </div>
              <h2 className="card-title">{user?.username || user?.email}</h2>
              <p className="text-sm badge badge-primary">{user?.role}</p>
              <p className="text-sm mt-2">{t('member_since', 'Member since:')} {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="md:w-3/4">
          <h1 className="text-2xl font-bold mb-6">{t('profile_management', 'Profile Management')}</h1>

          <div className="tabs tabs-boxed mb-6">
            <button
              className={`tab ${activeTab === 'integrations' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('integrations')}
            >
              <LinkIcon size={16} className="mr-2" /> {t('tab_integrations', 'Integrations')}
            </button>
            <button
              className={`tab ${activeTab === 'notifications' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              <Bell size={16} className="mr-2" /> {t('tab_notifications', 'Notifications')}
            </button>
            <button
              className={`tab ${activeTab === 'security' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <Shield size={16} className="mr-2" /> {t('tab_security', 'Security')}
            </button>
            <button
              className={`tab ${activeTab === 'activity' ? 'tab-active' : ''}`}
              onClick={() => setActiveTab('activity')}
            >
              <History size={16} className="mr-2" /> {t('tab_activity', 'Activity')}
            </button>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">              
              {activeTab === 'integrations' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('integrations_title', 'External Integrations')}</h3>
                  <div className="alert alert-info mb-6">
                    <div>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-current flex-shrink-0 w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>{t('integrations_coming_soon', 'Integrations with external services will be available soon.')}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card bg-base-200 shadow-sm">
                      <div className="card-body opacity-60">
                        <h2 className="card-title">{t('google_calendar', 'Google Calendar')}</h2>
                        <p>{t('google_calendar_description', 'Sync your events with Google Calendar')}</p>
                        <div className="card-actions justify-end">
                          <button className="btn btn-primary btn-sm" disabled>{t('connect', 'Connect')}</button>
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200 shadow-sm">
                      <div className="card-body opacity-60">
                        <h2 className="card-title">{t('outlook_calendar', 'Outlook Calendar')}</h2>
                        <p>{t('outlook_calendar_description', 'Sync your events with Outlook Calendar')}</p>
                        <div className="card-actions justify-end">
                          <button className="btn btn-primary btn-sm" disabled>{t('connect', 'Connect')}</button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'notifications' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('notification_preferences', 'Notification Preferences')}</h3>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">{t('email_notifications', 'Email Notifications')}</span> 
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">{t('event_notifications', 'Event Notifications')}</span> 
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">{t('system_notifications', 'System Notifications')}</span> 
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </label>
                  </div>
                  <button 
                    className="btn btn-primary mt-4"
                    onClick={() => handleNotificationUpdate()}
                  >
                    {t('save_notification_settings', 'Save Notification Settings')}
                  </button>
                </div>
              )}
              
              {activeTab === 'security' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('security_settings', 'Security Settings')}</h3>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">{t('two_factor_auth', 'Two-factor Authentication')}</span> 
                      <input type="checkbox" className="toggle toggle-primary" />
                    </label>
                  </div>
                  <div className="form-control">
                    <label className="label cursor-pointer">
                      <span className="label-text">{t('login_alerts', 'Login Alerts')}</span> 
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </label>
                  </div>
                  <button 
                    className="btn btn-primary mt-4"
                    onClick={() => handleSecurityUpdate()}
                  >
                    {t('save_security_settings', 'Save Security Settings')}
                  </button>
                </div>
              )}
              
              {activeTab === 'activity' && (
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('account_activity', 'Account Activity')}</h3>
                  <div className="overflow-x-auto">
                    <table className="table table-zebra">
                      <thead>
                        <tr>
                          <th>{t('action', 'Action')}</th>
                          <th>{t('date', 'Date')}</th>
                          <th>{t('ip_address', 'IP Address')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>{t('activity_login', 'Login')}</td>
                          <td>{new Date().toLocaleString()}</td>
                          <td>192.168.1.1</td>
                        </tr>
                        <tr>
                          <td>{t('activity_password_change', 'Password Changed')}</td>
                          <td>{new Date(Date.now() - 86400000).toLocaleString()}</td>
                          <td>192.168.1.1</td>
                        </tr>
                        <tr>
                          <td>{t('activity_profile_update', 'Profile Updated')}</td>
                          <td>{new Date(Date.now() - 172800000).toLocaleString()}</td>
                          <td>192.168.1.1</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 