'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/types/auth';

interface ProfileFormProps {
  initialData: User | null;
  onSubmit: (data: {
    name?: string;
    email?: string;
    language?: string;
  }) => Promise<void>;
  loading: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
  initialData,
  onSubmit,
  loading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    language: 'en',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        language: initialData.language || 'en',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="form-control">
        <label className="label">
          <span className="label-text">Name</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="input input-bordered"
          disabled={loading}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="input input-bordered"
          disabled={loading}
        />
      </div>

      <div className="form-control">
        <label className="label">
          <span className="label-text">Language</span>
        </label>
        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="select select-bordered"
          disabled={loading}
        >
          <option value="en">English</option>
          <option value="ar">Arabic (عربي)</option>
        </select>
      </div>

      <div className="form-control mt-6">
        <button
          type="submit"
          className={`btn btn-primary ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          Update Profile
        </button>
      </div>
    </form>
  );
};

export default ProfileForm; 