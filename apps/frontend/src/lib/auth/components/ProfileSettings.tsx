'use client';

import React, { useState, useEffect } from 'react';
import { accountApi, UpdateProfileData, AccountSettings } from '../account-api';
import { useAuth } from '../auth-context';

interface ProfileSettingsProps {
  onUpdate?: (updatedUser: AccountSettings) => void;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onUpdate }) => {
  const { user, refreshAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  
  const [formData, setFormData] = useState<UpdateProfileData>({
    name: '',
    email: '',
    preferred_language: 'en',
    phone: '',
    avatar_url: '',
  });

  const [errors, setErrors] = useState<Partial<UpdateProfileData>>({});

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoadingSettings(true);
        const response = await accountApi.getAccountSettings();
        const settings = response.data?.settings;
        if (settings) {
          setSettings(settings);
          setFormData({
            name: settings.name || '',
            email: settings.email || '',
            preferred_language: settings.preferred_language || 'en',
            phone: settings.phone || '',
            avatar_url: settings.avatar_url || '',
          });
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: error instanceof Error ? error.message : 'Failed to load account settings',
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<UpdateProfileData> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (formData.avatar_url && !/^https?:\/\/.+/.test(formData.avatar_url)) {
      newErrors.avatar_url = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const response = await accountApi.updateProfile(formData);
      if (response.data?.user) {
        setSettings(response.data.user);
      }
      setMessage({
        type: 'success',
        text: 'Profile updated successfully!',
      });
      
      // Refresh auth context to update user info
      await refreshAuth();
      
      // Call onUpdate callback if provided
      if (onUpdate && response.data?.user) {
        onUpdate(response.data.user);
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to update profile',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    
    // Clear message when user starts typing
    if (message) {
      setMessage(null);
    }
  };

  if (isLoadingSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Settings</h2>
        <p className="text-gray-600">Manage your account information and preferences.</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' 
            ? 'bg-green-50 border border-green-200 text-green-800' 
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {settings && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Account Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status: </span>
              <span className={`font-medium ${settings.is_active ? 'text-green-600' : 'text-red-600'}`}>
                {settings.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Email Verified: </span>
              <span className={`font-medium ${settings.email_verified ? 'text-green-600' : 'text-yellow-600'}`}>
                {settings.email_verified ? 'Yes' : 'Pending'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Member Since: </span>
              <span className="font-medium text-gray-900">
                {new Date(settings.created_at).toLocaleDateString()}
              </span>
            </div>
            {settings.last_login_at && (
              <div>
                <span className="text-gray-600">Last Login: </span>
                <span className="font-medium text-gray-900">
                  {new Date(settings.last_login_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your full name"
            disabled={isLoading}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your email address"
            disabled={isLoading}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          {settings && !settings.email_verified && formData.email !== settings.email && (
            <p className="mt-1 text-sm text-yellow-600">
              Note: Changing your email will require re-verification.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="preferred_language" className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Language
          </label>
          <select
            id="preferred_language"
            value={formData.preferred_language}
            onChange={(e) => handleInputChange('preferred_language', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
            <option value="fr">Français</option>
            <option value="de">Deutsch</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter your phone number"
            disabled={isLoading}
          />
          {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700 mb-2">
            Avatar URL
          </label>
          <input
            type="url"
            id="avatar_url"
            value={formData.avatar_url}
            onChange={(e) => handleInputChange('avatar_url', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.avatar_url ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com/avatar.jpg"
            disabled={isLoading}
          />
          {errors.avatar_url && <p className="mt-1 text-sm text-red-600">{errors.avatar_url}</p>}
          {formData.avatar_url && !errors.avatar_url && (
            <div className="mt-2">
              <img
                src={formData.avatar_url}
                alt="Avatar preview"
                className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            * Required fields
          </p>
          <button
            type="submit"
            disabled={isLoading}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-colors ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings; 