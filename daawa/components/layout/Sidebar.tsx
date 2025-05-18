import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PermissionGate from '@/components/auth/PermissionGate';
import { Permission } from '@/types/auth';

interface SidebarLinkProps {
  href: string;
  label: string;
  icon?: React.ReactNode;
  active?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, label, icon, active }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
        active
          ? 'bg-blue-100 text-blue-800'
          : 'hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname();
  
  return (
    <aside className="w-64 h-screen bg-white shadow-md fixed left-0 top-16 p-4">
      <div className="space-y-1">
        <SidebarLink
          href="/dashboard"
          label="Dashboard"
          active={pathname === '/dashboard'}
        />
        <SidebarLink
          href="/events"
          label="Events"
          active={pathname === '/events'}
        />
        <SidebarLink
          href="/profile"
          label="My Profile"
          active={pathname === '/profile'}
        />
        
        {/* Admin Section - Only shown to users with proper permissions */}
        <PermissionGate requiredPermission={Permission.MANAGE_ROLES}>
          <div className="pt-4 mt-4 border-t border-gray-200">
            <h3 className="px-4 mb-2 text-xs font-semibold text-gray-500 uppercase">
              Administration
            </h3>
            <SidebarLink
              href="/admin/role-management"
              label="Role Management"
              active={pathname === '/admin/role-management'}
            />
            {/* Add more admin links as needed */}
          </div>
        </PermissionGate>
      </div>
    </aside>
  );
} 