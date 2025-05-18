'use client';

import React, { useState } from 'react';

interface ChangePasswordFormProps {
  onSubmit: (data: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<void>;
  loading: boolean;
}

const ChangePasswordForm: React.FC<ChangePasswordFormProps> = ({
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords don't match");
      return false;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const { confirmPassword, ...passwordData } = formData;
    await onSubmit(passwordData);
    
    // Reset form after submission
    setFormData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Current Password</span>
        </label>
        <input
          type="password"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          className="input input-bordered"
          disabled={loading}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">New Password</span>
        </label>
        <input
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          className="input input-bordered"
          disabled={loading}
          minLength={8}
          required
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Confirm New Password</span>
        </label>
        <input
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="input input-bordered"
          disabled={loading}
          minLength={8}
          required
        />
      </div>

      {error && (
        <div className="alert alert-error shadow-lg">
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="stroke-current flex-shrink-0 h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="form-control mt-6">
        <button
          type="submit"
          className={`btn btn-primary ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          Change Password
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm; 