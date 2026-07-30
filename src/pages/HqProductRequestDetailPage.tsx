import { Link, Navigate, useParams } from "react-router-dom";
import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNewProductRequests } from "@/contexts/AppDataContext";
import { HqProductRequestDetailView } from "@/components/hq/HqProductRequestDetailView";

export default function HqProductRequestDetailPage() {
  const { requestId = "" } = useParams<{ requestId: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { newProductRequests, patchNewProductRequest } = useNewProductRequests();

  const request = useMemo(() => {
    const decoded = decodeURIComponent(requestId);
    return (
      newProductRequests.find(
        (n) => n.id === decoded || n.databaseId === decoded,
      ) ?? null
    );
  }, [newProductRequests, requestId]);

  if (!user || (user.role !== "brand_operator" && user.role !== "founder_admin")) {
    return <Navigate to="/" replace />;
  }

  if (!request) {
    return (
      <div className="p-6 text-[13px] text-muted-foreground">
        {t("Product request not found.")}{" "}
        <Link
          to="/product-development"
          className="font-medium text-accent underline-offset-2 hover:underline"
        >
          {t("Product development")}
        </Link>
        .
      </div>
    );
  }

  return <HqProductRequestDetailView request={request} onPatch={patchNewProductRequest} />;
}
