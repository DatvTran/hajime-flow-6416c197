import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useNewProductRequests } from "@/contexts/AppDataContext";
import { HqNewProductRequestView } from "@/components/hq/HqNewProductRequestView";

export default function HqNewProductRequestPage() {
  const { user } = useAuth();
  const { addNewProductRequest } = useNewProductRequests();

  if (!user || (user.role !== "brand_operator" && user.role !== "founder_admin")) {
    return <Navigate to="/" replace />;
  }

  return <HqNewProductRequestView onCreate={addNewProductRequest} />;
}
