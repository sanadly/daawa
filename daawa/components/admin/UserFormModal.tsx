import React, { useState, useEffect } from 'react';
import { User, Role } from '@/types/auth';
import { createUser, updateUser } from '@/services/apiUserManagement';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

interface UserFormModalProps {
  user: User | null;
  isOpen: boolean;
  isRtl: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
}

const UserFormModal: React.FC<UserFormModalProps> = ({
  user,
  isOpen,
  isRtl,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation('common');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: Role.USER,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // When user data changes or modal opens, reset form data
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '', // Don't fill in password for existing users
          role: user.role || Role.USER,
        });
      } else {
        // Reset form for new user creation
        setFormData({
          username: '',
          email: '',
          password: '',
          role: Role.USER,
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'role' ? value as Role : value,
    }));
    // Clear any error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      newErrors.username = t('username_required', 'Username is required');
    }
    
    if (!formData.email.trim()) {
      newErrors.email = t('email_required', 'Email is required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('email_invalid', 'Email is invalid');
    }
    
    // Only validate password for new users
    if (!user && !formData.password) {
      newErrors.password = t('password_required', 'Password is required');
    } else if (!user && formData.password.length < 8) {
      newErrors.password = t('password_too_short', 'Password must be at least 8 characters');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      let savedUser;
      
      if (user) {
        // Update existing user
        const updateData = {
          username: formData.username,
          email: formData.email,
          role: formData.role,
        };
        // Only send password if provided
        if (formData.password) {
          Object.assign(updateData, { password: formData.password });
        }
        savedUser = await updateUser(user.id, updateData);
      } else {
        // Create new user
        savedUser = await createUser(formData);
      }
      
      onSave(savedUser);
    } catch (error: unknown) {
      // Handle specific API errors
      if (error instanceof Error && error.message.includes('email')) {
        setErrors(prev => ({ ...prev, email: t('email_exists', 'Email already exists') }));
      } else {
        console.error('Error saving user:', error);
        // Set general error
        setErrors(prev => ({ 
          ...prev, 
          general: t('error_saving_user', 'An error occurred while saving the user')
        }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`modal-box max-w-md w-full ${isRtl ? 'text-right' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">
            {user ? t('edit_user', 'Edit User') : t('create_user', 'Create User')}
          </h3>
          <button 
            onClick={onClose}
            className="btn btn-sm btn-ghost"
            aria-label={t('close', 'Close')}
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Error message */}
        {errors.general && (
          <div className="alert alert-error mb-4">
            <span>{errors.general}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">{t('username', 'Username')}</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`input input-bordered ${errors.username ? 'input-error' : ''}`}
            />
            {errors.username && (
              <p className="text-error text-sm mt-1">{errors.username}</p>
            )}
          </div>
          
          {/* Email */}
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">{t('email', 'Email')}</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
            />
            {errors.email && (
              <p className="text-error text-sm mt-1">{errors.email}</p>
            )}
          </div>
          
          {/* Password */}
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">
                {user 
                  ? t('password_edit_optional', 'Password (leave blank to keep unchanged)') 
                  : t('password', 'Password')}
              </span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
            />
            {errors.password && (
              <p className="text-error text-sm mt-1">{errors.password}</p>
            )}
          </div>
          
          {/* Role */}
          <div className="form-control mt-2">
            <label className="label">
              <span className="label-text">{t('role', 'Role')}</span>
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="select select-bordered"
            >
              <option value={Role.USER}>{t('role_user', 'User')}</option>
              <option value={Role.STAFF}>{t('role_staff', 'Staff')}</option>
              <option value={Role.ORGANIZER}>{t('role_organizer', 'Organizer')}</option>
              <option value={Role.ADMIN}>{t('role_admin', 'Admin')}</option>
            </select>
          </div>
          
          {/* Submit button */}
          <div className="modal-action mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="btn btn-ghost"
              disabled={isSubmitting}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                user ? t('update', 'Update') : t('create', 'Create')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal; 