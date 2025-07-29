import React, { ReactNode } from 'react';
import { useAuth } from '../lib/AuthContext';
import AuthenticationForm from './AuthenticationForm';

interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  requireRole?: 'ANALYST' | 'SENIOR_ANALYST' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN';
}

export default function ProtectedRoute({ 
  children, 
  fallback,
  requireRole
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <svg 
            className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600 mx-auto" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication form if not authenticated
  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <AuthenticationForm onSuccess={() => window.location.reload()} />;
  }

  // Check role requirements
  if (requireRole && user) {
    const roleHierarchy = {
      'ANALYST': 1,
      'SENIOR_ANALYST': 2,
      'MANAGER': 3,
      'ADMIN': 4,
      'SUPER_ADMIN': 5,
    };

    const userLevel = roleHierarchy[user.role];
    const requiredLevel = roleHierarchy[requireRole];

    if (userLevel < requiredLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
              Access Denied
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              You don't have sufficient permissions to access this resource.
            </p>
            <p className="mt-1 text-center text-xs text-gray-500">
              Required role: {requireRole} | Your role: {user.role}
            </p>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has sufficient permissions
  return <>{children}</>;
} 