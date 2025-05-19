import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import PermissionGate from '@/components/auth/PermissionGate';
import { Permission } from '@/types/auth';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Home, Calendar, Users, Settings, ChevronRight, ChevronLeft } from 'lucide-react';

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  isRtl?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ href, label, icon, active, isRtl }) => {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        active
          ? 'bg-primary text-primary-content font-medium'
          : 'hover:bg-base-200 text-base-content/70 hover:text-base-content'
      } ${isRtl ? 'flex-row-reverse text-right' : ''}`}
    >
      <div className={`flex-shrink-0 ${isRtl ? 'order-1' : 'order-0'}`}>{icon}</div>
      <span className={isRtl ? 'order-0' : 'order-1'}>{label}</span>
    </Link>
  );
};

export default function Sidebar() {
  const pathname = usePathname() || '';
  const { user } = useAuth();
  const { t, i18n } = useTranslation('common');
  
  // Check if the current language is Arabic
  const isRtl = i18n.language === 'ar';
  
  // Get the first letter of the user's username/email for the avatar fallback
  const nameLetter = user?.username 
    ? user.username.charAt(0).toUpperCase() 
    : user?.email?.charAt(0).toUpperCase() || '?';
  
  // Choose the right chevron based on direction
  const DirectionIcon = isRtl ? ChevronLeft : ChevronRight;
  
  return (
    <aside className={`w-64 h-screen bg-base-100 shadow-xl fixed ${isRtl ? 'right-0' : 'left-0'} top-16 z-10`}>
      {/* User Profile Section - Now a single clickable area */}
      <Link 
        href="/profile" 
        className={`block p-4 border-b border-base-200 transition-colors ${
          pathname === '/profile' ? 'bg-base-200' : 'hover:bg-base-200'
        }`}
      >
        <div className={`flex items-center ${isRtl ? 'flex-row-reverse space-x-reverse' : 'space-x-3'} space-x-3`}>
          <div className="avatar placeholder">
            <div className="bg-primary text-primary-content rounded-full w-12">
              <span className="text-xl">{nameLetter}</span>
            </div>
          </div>
          <div className={`flex-1 ${isRtl ? 'text-right' : ''}`}>
            <p className="font-medium">{user?.username || user?.email || t('unknown_user', 'User')}</p>
            <p className="text-sm opacity-70">{t('view_profile', 'View profile')}</p>
          </div>
          <DirectionIcon size={16} className="text-base-content/50" />
        </div>
      </Link>

      {/* Main Navigation */}
      <div className="p-4 space-y-1">
        <SidebarLink
          href="/dashboard"
          label={t('dashboard', 'Dashboard')}
          icon={<Home size={20} />}
          active={pathname === '/dashboard'}
          isRtl={isRtl}
        />
        <SidebarLink
          href="/events"
          label={t('events', 'Events')}
          icon={<Calendar size={20} />}
          active={pathname === '/events' || pathname.startsWith('/events/')}
          isRtl={isRtl}
        />
        
        {/* Admin Section - Only shown to users with proper permissions */}
        <PermissionGate requiredPermission={Permission.MANAGE_ROLES}>
          <div className="mt-6 pt-4 border-t border-base-200">
            <h3 className={`px-4 mb-3 text-xs font-semibold text-base-content/50 uppercase ${isRtl ? 'text-right' : ''}`}>
              {t('administration', 'Administration')}
            </h3>
            <SidebarLink
              href="/admin/users"
              label={t('user_management', 'User Management')}
              icon={<Users size={20} />}
              active={pathname.startsWith('/admin/users')}
              isRtl={isRtl}
            />
            <SidebarLink
              href="/admin/settings"
              label={t('settings', 'Settings')}
              icon={<Settings size={20} />}
              active={pathname.startsWith('/admin/settings')}
              isRtl={isRtl}
            />
          </div>
        </PermissionGate>
      </div>
    </aside>
  );
} 