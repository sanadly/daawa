'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getUsers, deleteUser } from '@/services/apiUserManagement';
import { User, Role } from '@/types/auth';
import UserFormModal from '@/components/admin/UserFormModal';
import { Trash2, Edit, UserPlus } from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';

export default function UsersManagementPage() {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.dir() === 'rtl';
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError(t('users_load_error', 'Failed to load users. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = (savedUser: User) => {
    if (editingUser) {
      // Update existing user in the list
      setUsers(prev => prev.map(u => u.id === savedUser.id ? savedUser : u));
    } else {
      // Add new user to the list
      setUsers(prev => [...prev, savedUser]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteClick = (userId: number) => {
    setShowConfirmDelete(userId);
  };

  const handleDeleteConfirm = async (userId: number) => {
    try {
      setLoading(true);
      const result = await deleteUser(userId);
      if (result.success) {
        setUsers(prev => prev.filter(user => user.id !== userId));
      } else {
        setError(result.message || t('delete_user_error', 'Failed to delete user'));
      }
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError(t('delete_user_error', 'Failed to delete user'));
    } finally {
      setLoading(false);
      setShowConfirmDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowConfirmDelete(null);
  };

  const getRoleLabel = (role: Role): string => {
    switch (role) {
      case Role.ADMIN:
        return t('role_admin', 'Admin');
      case Role.STAFF:
        return t('role_staff', 'Staff');
      case Role.ORGANIZER:
        return t('role_organizer', 'Organizer');
      case Role.USER:
        return t('role_user', 'User');
      default:
        return role;
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <h1 className="text-3xl font-bold text-base-content">
            {t('user_management', 'User Management')}
          </h1>
          <button
            onClick={handleCreateUser}
            className="btn btn-primary flex items-center gap-2"
          >
            <UserPlus size={20} />
            {t('create_user', 'Create User')}
          </button>
        </div>

        <div className={`alert alert-warning mb-6 ${isRtl ? 'text-right' : ''}`}> 
          <span className="font-bold">{t('role_change_warning', 'Changing a user\'s role can dramatically alter their permissions and access to the system. Please be careful when modifying user roles.')}</span>
        </div>

        {error && (
          <div className={`alert alert-error mb-6 ${isRtl ? 'text-right' : ''}`}>
            <span>{error}</span>
          </div>
        )}

        <div className="card bg-base-100 shadow-md">
          <div className="card-body p-0">
            <div className="overflow-x-auto">
              <table className={`table w-full ${isRtl ? 'text-right' : ''}`}> 
                <thead>
                  <tr>
                    <th>{t('username', 'Username')}</th>
                    <th>{t('email', 'Email')}</th>
                    <th>{t('role', 'Role')}</th>
                    <th className="text-center">{t('actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                      </td>
                    </tr>
                  )}
                  {!loading && users.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-8">
                        {t('no_users_found', 'No users found')}
                      </td>
                    </tr>
                  )}
                  {!loading && users.map(user => (
                    <tr key={user.id}>
                      <td className="font-medium">{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`badge ${
                          user.role === Role.ADMIN
                            ? 'badge-error'
                            : user.role === Role.STAFF
                            ? 'badge-warning'
                            : user.role === Role.ORGANIZER
                            ? 'badge-info'
                            : 'badge-neutral'
                        }`}>
                          {getRoleLabel(user.role)}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className={`flex gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="btn btn-sm btn-ghost"
                            title={t('edit_user', 'Edit User')}
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(user.id)}
                            className="btn btn-sm btn-ghost btn-error"
                            title={t('delete_user', 'Delete User')}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        {showConfirmDelete === user.id && (
                          <div className={`mt-2 flex gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="text-sm">{t('confirm_delete', 'Are you sure?')}</span>
                            <button
                              onClick={() => handleDeleteConfirm(user.id)}
                              className="btn btn-xs btn-error"
                            >
                              {t('yes', 'Yes')}
                            </button>
                            <button
                              onClick={handleDeleteCancel}
                              className="btn btn-xs btn-ghost"
                            >
                              {t('no', 'No')}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <UserFormModal
          user={editingUser}
          isOpen={isModalOpen}
          isRtl={isRtl}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveUser}
        />
      </div>
    </AdminLayout>
  );
} 