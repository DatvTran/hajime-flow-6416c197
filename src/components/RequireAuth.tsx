import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, homePathForRole, useAuth } from "@/contexts/AuthContext";

export function RequireAuth() {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    // No state preservation - always redirect clean to login
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPath(user.role, loc.pathname)) {
    const homePath = homePathForRole(user.role);
    return <Navigate to={homePath} replace />;
  }

  return <Outlet />;
}