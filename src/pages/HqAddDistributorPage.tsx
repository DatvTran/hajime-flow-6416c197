import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { HqAddDistributorView } from "@/components/hq/HqAddDistributorView";

export default function HqAddDistributorPage() {
  const { user } = useAuth();

  if (!user || (user.role !== "brand_operator" && user.role !== "founder_admin")) {
    return <Navigate to="/" replace />;
  }

  return <HqAddDistributorView />;
}
