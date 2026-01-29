import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppRole } from '@/lib/types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: AppRole[];
  fallbackPath?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  fallbackPath = '/dashboard' 
}: ProtectedRouteProps) {
  const { role, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If no allowed roles specified, any authenticated user can access
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user's role is in the allowed roles
  if (role && allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  // Redirect to fallback path if not authorized
  return <Navigate to={fallbackPath} replace />;
}
