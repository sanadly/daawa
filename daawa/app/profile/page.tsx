'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, fetchUserProfile } from '@/services/apiProfile';
import ProfileForm from '@/components/profile/ProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-toastify';

export default function ProfilePage() {
  const { isAuthenticated, user: authUser } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

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
        toast.error('Failed to load your profile. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [isAuthenticated, router]);

  const handleProfileUpdate = async (formData) => {
    try {
      setLoading(true);
      const updatedProfile = await updateProfile(formData);
      setProfileData(updatedProfile);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (passwordData) => {
    try {
      setLoading(true);
      await updateProfile(passwordData);
      toast.success('Password changed successfully');
    } catch (error) {
      console.error('Failed to update password:', error);
      toast.error(
        error.response?.data?.message || 'Failed to update password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
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
      <h1 className="text-2xl font-bold mb-6">Profile Management</h1>

      <div className="tabs mb-6">
        <button
          className={`tab tab-lifted ${activeTab === 'profile' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile Information
        </button>
        <button
          className={`tab tab-lifted ${activeTab === 'password' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('password')}
        >
          Change Password
        </button>
      </div>

      <div className="bg-base-200 p-6 rounded-lg shadow-md">
        {activeTab === 'profile' ? (
          <ProfileForm
            initialData={profileData}
            onSubmit={handleProfileUpdate}
            loading={loading}
          />
        ) : (
          <ChangePasswordForm onSubmit={handlePasswordChange} loading={loading} />
        )}
      </div>
    </div>
  );
} 