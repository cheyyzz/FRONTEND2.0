import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';
import { canAccessRole } from '../utils/authValidation';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ReadonlyArray<UserRole>;
}

/**
 * Guards routes by authentication status and optional RBAC role whitelist.
 */
export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { firebaseUid, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-sky-600" />
          <p className="text-sm font-medium text-slate-600">Memverifikasi sesi akun...</p>
        </div>
      </div>
    );
  }

  if (!firebaseUid || !userProfile) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRole(userProfile.role, allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
