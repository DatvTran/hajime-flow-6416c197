import { Outlet } from "react-router-dom";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";

/** Wraps nested routes so a single route’s render error does not white-screen the whole app. */
export function RouteErrorOutlet() {
  return (
    <RouteErrorBoundary>
      <Outlet />
    </RouteErrorBoundary>
  );
}
