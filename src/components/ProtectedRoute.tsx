import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AccessDenied from "@/pages/AccessDenied";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** @deprecated Use allowedRoles instead */
  requireAdmin?: boolean;
  /** Array of roles that are allowed to access this route */
  allowedRoles?: string[];
}

/**
 * A route wrapper that enforces authentication and role-based authorization.
 * 
 * - If user is not authenticated, redirects to /auth
 * - If user is authenticated but lacks required role, shows AccessDenied page
 * - If user has required role (or no roles required), renders children
 * 
 * @example
 * // Allow only admins
 * <ProtectedRoute allowedRoles={['admin']}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 * 
 * @example
 * // Allow multiple roles
 * <ProtectedRoute allowedRoles={['investor', 'angel_investor', 'vc_partner']}>
 *   <InvestorDashboard />
 * </ProtectedRoute>
 */
const ProtectedRoute = ({ 
  children, 
  requireAdmin = false,
  allowedRoles 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading authentication status"
      >
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Get user's roles, defaulting to empty array
  const userRoles = user.roles || [];

  // Admin users have access to all routes
  const isAdmin = userRoles.includes('admin');

  // Check role-based authorization
  // If allowedRoles is specified, check if user has at least one matching role
  // Admins always have access regardless of allowedRoles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasRequiredRole = isAdmin || allowedRoles.some(role => userRoles.includes(role));
    if (!hasRequiredRole) {
      return <AccessDenied requiredRoles={allowedRoles} />;
    }
  }

  // Legacy support: if requireAdmin is true and no allowedRoles specified
  if (requireAdmin && !allowedRoles) {
    if (!isAdmin) {
      return <AccessDenied requiredRoles={['admin']} />;
    }
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;

