"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/auth/auth-context';
import { UserRole } from '../../../lib/auth/types';
import { CheckinLogin } from './components/CheckinLogin';
import { CheckinInterface } from './components/CheckinInterface';
import toast from 'react-hot-toast';

export default function CheckinPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasAnyRole } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setShowLogin(true);
      } else if (isAuthenticated && user) {
        // Check if user has check-in permissions
        const canCheckin = hasAnyRole([UserRole.ADMIN, UserRole.ORGANIZER, UserRole.STAFF]);
        if (!canCheckin) {
          toast.error('You do not have permission to access the check-in module');
          router.replace('/dashboard');
        } else {
          setShowLogin(false);
        }
      }
    }
  }, [isAuthenticated, isLoading, user, hasAnyRole, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (showLogin || !isAuthenticated) {
    return <CheckinLogin onLoginSuccess={() => setShowLogin(false)} />;
  }

  return <CheckinInterface />;
} 