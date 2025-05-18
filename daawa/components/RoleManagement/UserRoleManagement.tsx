'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUsersWithRoles, updateUserRole } from '@/services/apiRoleManagement';
import { UserRole } from '@/services/apiRoleManagement';
import { Role, Permission } from '@/types/auth';
import Link from 'next/link';

export default function UserRoleManagement() {
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<number, Role>>({});
  const [isSaving, setIsSaving] = useState<Record<number, boolean>>({});
  const [successMessage, setSuccessMessage] = useState<Record<number, string>>({});

  // Check if user has permission to manage roles
  const canManageRoles = hasPermission(Permission.MANAGE_ROLES);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUsersWithRoles();
        setUsers(data);
        
        // Initialize selected roles with current roles
        const initialSelectedRoles: Record<number, Role> = {};
        data.forEach(user => {
          initialSelectedRoles[user.userId] = user.role;
        });
        setSelectedRoles(initialSelectedRoles);
      } catch (err) {
        setError('Failed to load users. Please try again.');
        console.error('Error fetching users:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const handleRoleChange = (userId: number, role: Role) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: role
    }));
    
    // Clear any previous success message
    setSuccessMessage(prev => ({
      ...prev,
      [userId]: ''
    }));
  };

  const handleSaveRole = async (userId: number) => {
    if (!canManageRoles) return;
    
    try {
      setIsSaving(prev => ({
        ...prev,
        [userId]: true
      }));
      
      await updateUserRole(userId, selectedRoles[userId]);
      
      // Update the user in the users array
      setUsers(prev => 
        prev.map(user => 
          user.userId === userId 
            ? { ...user, role: selectedRoles[userId] } 
            : user
        )
      );
      
      setSuccessMessage(prev => ({
        ...prev,
        [userId]: 'Role updated successfully'
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(prev => ({
          ...prev,
          [userId]: ''
        }));
      }, 3000);
    } catch (err) {
      setError(`Failed to update role for user ${userId}`);
      console.error('Error updating role:', err);
    } finally {
      setIsSaving(prev => ({
        ...prev,
        [userId]: false
      }));
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading users...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!canManageRoles) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">User Role Management</h1>
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>You do not have permission to manage user roles.</p>
        </div>
        <Link href="/" className="text-blue-500 hover:underline">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">User Role Management</h1>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b text-left">User ID</th>
              <th className="py-2 px-4 border-b text-left">Username</th>
              <th className="py-2 px-4 border-b text-left">Email</th>
              <th className="py-2 px-4 border-b text-left">Current Role</th>
              <th className="py-2 px-4 border-b text-left">New Role</th>
              <th className="py-2 px-4 border-b text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.userId} className="hover:bg-gray-50">
                <td className="py-2 px-4 border-b">{user.userId}</td>
                <td className="py-2 px-4 border-b">{user.username}</td>
                <td className="py-2 px-4 border-b">{user.email}</td>
                <td className="py-2 px-4 border-b">{user.role}</td>
                <td className="py-2 px-4 border-b">
                  <select
                    value={selectedRoles[user.userId]}
                    onChange={(e) => handleRoleChange(user.userId, e.target.value as Role)}
                    className="border p-1 rounded"
                    disabled={isSaving[user.userId]}
                  >
                    {Object.values(Role).map(role => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="py-2 px-4 border-b">
                  <button
                    onClick={() => handleSaveRole(user.userId)}
                    disabled={user.role === selectedRoles[user.userId] || isSaving[user.userId]}
                    className={`px-3 py-1 rounded text-white ${
                      user.role === selectedRoles[user.userId]
                        ? 'bg-gray-400'
                        : isSaving[user.userId]
                        ? 'bg-blue-300'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    {isSaving[user.userId] ? 'Saving...' : 'Save'}
                  </button>
                  {successMessage[user.userId] && (
                    <span className="ml-2 text-green-600 text-sm">
                      {successMessage[user.userId]}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 