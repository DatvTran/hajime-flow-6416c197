import { useMemo } from "react";
import { ManufacturerAnalyticsView } from "@/components/manufacturer/ManufacturerAnalyticsView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import {
  ANALYTICS_SUMMARY,
  MONTHLY_PRODUCTION,
  MONTHLY_TRENDS,
  SKU_PRODUCTION,
} from "@/lib/manufacturer-analytics";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerAnalyticsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { loading, data } = useAppData();
  const logAudit = useAuditLog();

  const orgLabel = useMemo(() => {
    if (!user) return "Manufacturer";
    const email = user.email?.toLowerCase() ?? "";
    if (email.includes("kosapan")) return "Kosapan Distillery";
    const mfgAccount = data.accounts.find(
      (a) =>
        (a.type === "manufacturer" || a.type === "producer") &&
        (a.email?.toLowerCase() === email || a.portalLoginEmail?.toLowerCase() === email),
    );
    return mfgAccount?.tradingName ?? user.displayName?.trim() ?? "Manufacturer";
  }, [data.accounts, user]);

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerAnalyticsView
      summary={ANALYTICS_SUMMARY}
      production={MONTHLY_PRODUCTION}
      trends={MONTHLY_TRENDS}
      skuRows={SKU_PRODUCTION}
      orgLabel={orgLabel}
      onExportPdf={() => {
        logAudit("analytics_export", "pdf", { type: "report", id: "manufacturer-analytics" });
        toast.success(t("Export started"), {
          description: t("Q2 production report PDF is being generated."),
        });
      }}
    />
  );
}
