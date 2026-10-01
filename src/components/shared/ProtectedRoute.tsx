import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { FullPageSpinner } from '@/components/ui';
import { logSecurityEvent } from '@/utils/securityLog';

interface ProtectedRouteProps {
  roles?: UserRole[];
  children: React.ReactNode;
}

/** Enforces authentication and RBAC at the route boundary (client-side guard). */
export function ProtectedRoute({ roles, children }: ProtectedRouteProps) {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <FullPageSpinner label="Verifying your session…" />;
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (roles && !roles.includes(user.role)) {
    logSecurityEvent(
      'rbac_denied',
      `Access denied to ${location.pathname} for role ${user.role}`,
      'medium',
      { userId: user.id, path: location.pathname },
    );
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
