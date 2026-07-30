import { useMemo } from "react";
import { ManufacturerQualityControlView } from "@/components/manufacturer/ManufacturerQualityControlView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { QC_BATCHES, QC_SUMMARY } from "@/lib/manufacturer-quality-control";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerQualityControlPage() {
  const { t } = useLanguage();
  const { loading } = useAppData();
  const logAudit = useAuditLog();

  const batches = useMemo(() => QC_BATCHES, []);
  const summary = useMemo(() => QC_SUMMARY, []);

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerQualityControlView
      summary={summary}
      batches={batches}
      onLogSample={() => {
        logAudit("qc_sample_log", "new", { type: "quality", id: "draft" });
        toast.success(t("QC sample logged"), {
          description: t("Batch sample queued for lab analysis."),
        });
      }}
      onOpenFullLog={() => {
        logAudit("qc_log_view", "full", { type: "quality", id: "log" });
        toast.success(t("QC log opened"), {
          description: t("Full batch analysis history for Q2 2026."),
        });
      }}
    />
  );
}
