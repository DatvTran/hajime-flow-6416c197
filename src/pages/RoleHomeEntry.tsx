import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import DistributorHomePage from "@/pages/DistributorHomePage";
import RetailHomePage from "@/pages/RetailHomePage";
import SalesRepHomePage from "@/pages/SalesRepHomePage";

/** Role-specific home: same data model, different operating view (spec §2). */
export default function RoleHomeEntry() {
  const { user } = useAuth();
  if (!user) return null;
  switch (user.role) {
    case "founder_admin":
    case "brand_operator":
    case "operations":
    case "finance":
      return <Dashboard />;
    case "manufacturer":
      return <Navigate to="/manufacturer" replace />;
    case "distributor":
      return <Navigate to="/distributor" replace />;
    case "retail":
      return <RetailHomePage />;
    case "sales":
    case "sales_rep":
      return <Navigate to="/sales" replace />;
    default:
      return <Dashboard />;
  }
}
