import { Navigate, Outlet, useLocation } from "react-router-dom";
import { canAccessPath, useAuth } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

/** Same pattern as `App` Suspense fallback — never return null while hydrating or the route looks "broken". */
function AuthLoadingFallback() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export function RequireAuth() {
  const { user, isLoading } = useAuth();
  const loc = useLocation();

  if (isLoading) {
    return <AuthLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  }

  if (!canAccessPath(user.role, loc.pathname)) {
    // Keep rendering the requested route instead of force-redirecting to home.
    // This prevents "always back to main page" behavior when route ACL and sidebar
    // config temporarily drift during deployment.
    return <Outlet />;
  }

  return <Outlet />;
}