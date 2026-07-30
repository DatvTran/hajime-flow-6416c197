import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ManufacturerFinishedGoodsView } from "@/components/manufacturer/ManufacturerFinishedGoodsView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import { useAppData, useManufacturerFinishedGoods } from "@/contexts/AppDataContext";
import { summarizeFinishedGoods } from "@/lib/manufacturer-finished-goods";

export default function ManufacturerFinishedGoodsPage() {
  const navigate = useNavigate();
  const { loading } = useAppData();
  const { finishedGoods } = useManufacturerFinishedGoods();

  const rows = finishedGoods;
  const summary = useMemo(() => summarizeFinishedGoods(rows), [rows]);

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerFinishedGoodsView
      rows={rows}
      summary={summary}
      onCreateShipment={() => navigate("/manufacturer/shipments")}
    />
  );
}
