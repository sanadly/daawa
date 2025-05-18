'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPermissionsForRole, getPermissionGroups } from '@/services/apiRoleManagement';
import { Permission as PermissionType } from '@/services/apiRoleManagement';
import { Role, Permission } from '@/types/auth';

interface RolePermissionsProps {
  selectedRole: Role;
}

export default function RolePermissions({ selectedRole }: RolePermissionsProps) {
  const { hasPermission } = useAuth();
  const [rolePermissions, setRolePermissions] = useState<PermissionType[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<Record<string, PermissionType[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user has permission to view role permissions
  const canViewPermissions = hasPermission(Permission.MANAGE_ROLES);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch permissions for the selected role
        const permissions = await getPermissionsForRole(selectedRole);
        setRolePermissions(permissions);
        
        // Fetch permission groups
        const groups = await getPermissionGroups();
        
        // Convert PermissionGroup[] to Record<string, PermissionType[]>
        const groupedPermissions: Record<string, PermissionType[]> = {};
        groups.forEach(group => {
          groupedPermissions[group.name] = group.permissions;
        });
        
        setPermissionGroups(groupedPermissions);
      } catch (err) {
        setError('Failed to load permissions. Please try again.');
        console.error('Error fetching permissions:', err);
      } finally {
        setLoading(false);
      }
    };

    if (selectedRole) {
      fetchData();
    }
  }, [selectedRole]);

  const hasRolePermission = (permissionName: string) => {
    return rolePermissions.some(p => p.name === permissionName);
  };

  if (loading) {
    return <div className="p-4">Loading permissions...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!canViewPermissions) {
    return (
      <div className="p-4">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4">
          <p>You do not have permission to view role permissions.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">
        Permissions for {selectedRole} Role
      </h2>
      
      {Object.keys(permissionGroups).length === 0 ? (
        <p className="text-gray-500">No permission groups found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(permissionGroups).map(([groupName, permissions]) => (
            <div key={groupName} className="border rounded-lg p-4">
              <h3 className="font-medium text-lg mb-2">{groupName}</h3>
              <ul className="space-y-2">
                {permissions.map(permission => (
                  <li 
                    key={permission.name} 
                    className="flex items-start"
                  >
                    <div className={`mr-2 mt-0.5 w-5 h-5 flex items-center justify-center rounded-full ${
                      hasRolePermission(permission.name) 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-200'
                    }`}>
                      {hasRolePermission(permission.name) && (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{permission.name}</div>
                      {permission.description && (
                        <div className="text-sm text-gray-600">{permission.description}</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      
      {rolePermissions.length === 0 && (
        <p className="text-yellow-600 mt-4">
          This role has no assigned permissions.
        </p>
      )}
    </div>
  );
} 