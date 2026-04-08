import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, homePathForRole, useAuth } from "@/contexts/AuthContext";

export function RequireAuth() {
  const { user } = useAuth();
  const loc = useLocation();

  // Debug indicator
  const debugEl = document.getElementById('debug-step');
  if (debugEl) {
    debugEl.textContent = `RequireAuth: user=${user?.email ?? 'null'}, path=${loc.pathname}`;
  }
  console.log("[RequireAuth] user:", user?.email, "role:", user?.role, "path:", loc.pathname);

  if (!user) {
    console.log("[RequireAuth] No user - redirecting to /login");
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (!canAccessPath(user.role, loc.pathname)) {
    const homePath = homePathForRole(user.role);
    console.log("[RequireAuth] Access denied - redirecting to:", homePath);
    return <Navigate to={homePath} replace />;
  }

  console.log("[RequireAuth] Access granted");
  return <Outlet />;
}
