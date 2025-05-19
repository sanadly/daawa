'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { updateProfile, fetchUserProfile } from '@/services/apiProfile';
import ProfileForm from '@/components/profile/ProfileForm';
import ChangePasswordForm from '@/components/profile/ChangePasswordForm';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'react-toastify';
import { User } from '@/types/auth';

// Define the type for profile updates
interface ProfileUpdateData {
  name?: string;
  email?: string;
  language?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any; // For any other fields that might be needed
}

// Define password data to match the component prop type
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<User | null>(null);
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

  const handleProfileUpdate = async (formData: ProfileUpdateData) => {
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

  const handlePasswordChange = async (passwordData: PasswordChangeData) => {
    try {
      setLoading(true);
      await updateProfile(passwordData);
      toast.success('Password changed successfully');
    } catch (error: unknown) {
      console.error('Failed to update password:', error);
      const errorMessage = 
        error && typeof error === 'object' && 'response' in error 
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ? (error.response as any)?.data?.message 
          : 'Failed to update password. Please try again.';
      toast.error(errorMessage);
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