'use client';

import { Permission, UserRole } from '../types';
import { getRoleDisplayName } from '../permissions';

interface UnauthorizedFallbackProps {
  reason: 'login-required' | 'insufficient-role' | 'insufficient-permissions';
  userRole?: UserRole;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
}

export const UnauthorizedFallback = ({
  reason,
  userRole,
  requiredRoles = [],
  requiredPermissions = [],
}: UnauthorizedFallbackProps) => {
  const handleLogin = () => {
    window.location.href = '/login';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  if (reason === 'login-required') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Authentication Required
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You need to sign in to access this page.
            </p>
          </div>
          <div className="mt-8 space-y-4">
            <button
              onClick={handleLogin}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign In
            </button>
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reason === 'insufficient-role') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-amber-600">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.08 14.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Insufficient Role
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Your current role ({userRole ? getRoleDisplayName(userRole) : 'Unknown'}) doesn't have access to this page.
            </p>
            {requiredRoles.length > 0 && (
              <div className="mt-4 p-4 bg-amber-50 rounded-md">
                <p className="text-sm text-amber-800">
                  <span className="font-medium">Required role(s):</span>{' '}
                  {requiredRoles.map(getRoleDisplayName).join(', ')}
                </p>
              </div>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (reason === 'insufficient-permissions') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-red-600">
              <svg
                className="h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L5.636 5.636"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have the required permissions to access this page.
            </p>
            {requiredPermissions.length > 0 && (
              <div className="mt-4 p-4 bg-red-50 rounded-md">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Required permission(s):</span>
                </p>
                <ul className="mt-2 text-xs text-red-700 space-y-1">
                  {requiredPermissions.map((permission) => (
                    <li key={permission} className="font-mono">
                      {permission}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="mt-8">
            <button
              onClick={handleGoBack}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 