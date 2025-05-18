'use client';

import React, { useState } from 'react';
import UserRoleManagement from '@/components/RoleManagement/UserRoleManagement';
import RolePermissions from '@/components/RoleManagement/RolePermissions';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Role, Permission } from '@/types/auth';
import { getAllRoles } from '@/services/apiRoleManagement';

export default function RoleManagementPage() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all roles when component mounts
  React.useEffect(() => {
    const fetchRoles = async () => {
      try {
        setLoading(true);
        const allRoles = await getAllRoles();
        setRoles(allRoles);
        
        // Select the first role by default
        if (allRoles.length > 0 && !selectedRole) {
          setSelectedRole(allRoles[0]);
        }
      } catch (error) {
        console.error('Failed to fetch roles:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoles();
  }, [selectedRole]);

  return (
    <ProtectedRoute requiredPermission={Permission.MANAGE_ROLES} fallbackUrl="/dashboard">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Role Management</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">View Role Permissions</h2>
            
            {loading ? (
              <p>Loading roles...</p>
            ) : (
              <>
                <div className="mb-6">
                  <label htmlFor="roleSelect" className="block text-sm font-medium text-gray-700 mb-2">
                    Select Role
                  </label>
                  <select
                    id="roleSelect"
                    value={selectedRole || ''}
                    onChange={(e) => setSelectedRole(e.target.value as Role)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="" disabled>Select a role</option>
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedRole && (
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-600 mb-2">
                      View detailed permissions for the {selectedRole} role.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            {selectedRole ? (
              <RolePermissions selectedRole={selectedRole} />
            ) : (
              <div className="p-6">
                <p className="text-gray-500">Select a role to view its permissions</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow">
          <UserRoleManagement />
        </div>
      </div>
    </ProtectedRoute>
  );
} 