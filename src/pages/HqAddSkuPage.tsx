import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProducts } from "@/contexts/AppDataContext";
import { HqAddSkuView } from "@/components/hq/HqAddSkuView";

export default function HqAddSkuPage() {
  const { user } = useAuth();
  const { products, addProduct } = useProducts();

  if (!user || (user.role !== "brand_operator" && user.role !== "founder_admin")) {
    return <Navigate to="/" replace />;
  }

  return (
    <HqAddSkuView
      existingSkus={products.map((p) => p.sku)}
      onCreate={addProduct}
    />
  );
}
