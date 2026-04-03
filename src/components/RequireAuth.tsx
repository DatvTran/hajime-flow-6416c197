import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, homePathForRole, useAuth } from "@/contexts/AuthContext";

export function RequireAuth() {
  const { user } = useAuth();
  const loc = useLocation();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (!canAccessPath(user.role, loc.pathname)) {
    return <Navigate to={homePathForRole(user.role)} replace />;
  }

  return <Outlet />;
}
