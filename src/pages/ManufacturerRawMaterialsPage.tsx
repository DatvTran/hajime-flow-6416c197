import { useMemo } from "react";
import { ManufacturerRawMaterialsView } from "@/components/manufacturer/ManufacturerRawMaterialsView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { RAW_MATERIALS, lowStockMaterials } from "@/lib/manufacturer-raw-materials";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerRawMaterialsPage() {
  const { t } = useLanguage();
  const { loading } = useAppData();
  const logAudit = useAuditLog();

  const materials = useMemo(() => RAW_MATERIALS, []);
  const lowStock = useMemo(() => lowStockMaterials(materials), [materials]);

  const handleReorder = (sku?: string) => {
    const item = sku ? materials.find((m) => m.sku === sku) : null;
    logAudit("material_reorder", sku ?? "bulk", { type: "inventory", id: sku ?? "materials" });
    toast.success(t("Reorder queued"), {
      description: item
        ? t("{{name}} added to procurement queue.", { name: item.name })
        : t("Low-stock materials added to procurement queue."),
    });
  };

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerRawMaterialsView
      materials={materials}
      lowStock={lowStock}
      onReorder={() => handleReorder()}
      onReorderItem={handleReorder}
    />
  );
}
