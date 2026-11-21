import { useCallback, useEffect, useMemo, useState } from "react";
import { Warehouse } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  createMyReceivingWarehouse,
  getMyWarehouseOptions,
  updateMyPrimaryWarehouse,
} from "@/lib/api-v1-mutations";
import { warehouseFromApi } from "@/lib/warehouse-from-api";
import type { Warehouse as WarehouseRow } from "@/types/app-data";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

function warehousesFromApiRows(rows: Record<string, unknown>[]): WarehouseRow[] {
  return rows.map((row) =>
    warehouseFromApi({
      id: String(row.id ?? ""),
      name: String(row.name ?? "").trim(),
      is_active: row.is_active !== false,
      sort_order: Number(row.sort_order ?? 0),
      kind: row.kind != null ? String(row.kind) : undefined,
      linked_account_id: row.linked_account_id != null ? String(row.linked_account_id) : null,
      linked_team_member_id:
        row.linked_team_member_id != null ? String(row.linked_team_member_id) : null,
    }),
  );
}

type Props = {
  className?: string;
  /** Compact card for dashboard; default is settings-style panel. */
  variant?: "card" | "panel";
};

/**
 * Distributor receiving-warehouse settings (create-if-none + primary depot).
 * Shown on Dashboard and Inventory — distributors cannot access HQ /settings.
 */
export function DistributorReceivingWarehousePanel({ className, variant = "panel" }: Props) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { data, updateData, refreshTeamMembers, refreshShipments } = useAppData();

  const [warehouseOptions, setWarehouseOptions] = useState<
    { id: string; name: string; kind?: string }[]
  >([]);
  const [primarySaving, setPrimarySaving] = useState(false);
  const [createWhOpen, setCreateWhOpen] = useState(false);
  const [newReceivingName, setNewReceivingName] = useState("");
  const [creatingReceiving, setCreatingReceiving] = useState(false);

  const myCrmRow = useMemo(() => {
    const em = user?.email?.trim().toLowerCase();
    if (!em) return undefined;
    return (data.teamMembers ?? []).find((m) => m.email?.toLowerCase() === em);
  }, [data.teamMembers, user?.email]);

  const selectedPrimaryWarehouseId = myCrmRow?.primaryWarehouseId ?? "";

  const hasOwnReceivingWarehouse = useMemo(() => {
    const list = data.warehouses ?? [];
    if (selectedPrimaryWarehouseId) {
      const wh = list.find((w) => String(w.id) === String(selectedPrimaryWarehouseId));
      if (wh && wh.isActive !== false) return true;
    }
    const mid = myCrmRow?.id;
    if (!mid) return false;
    return list.some(
      (w) =>
        w.isActive !== false &&
        w.linkedTeamMemberId != null &&
        String(w.linkedTeamMemberId) === String(mid),
    );
  }, [selectedPrimaryWarehouseId, myCrmRow?.id, data.warehouses]);

  const reloadWarehouseOptions = useCallback(async () => {
    if (user?.role !== "distributor") return;
    try {
      const res = (await getMyWarehouseOptions()) as {
        data?: { id: string; name: string; kind?: string }[];
      };
      setWarehouseOptions(Array.isArray(res.data) ? res.data : []);
    } catch {
      setWarehouseOptions([]);
    }
  }, [user?.role]);

  useEffect(() => {
    if (user?.role !== "distributor") return;
    let cancelled = false;
    (async () => {
      try {
        const res = (await getMyWarehouseOptions()) as {
          data?: { id: string; name: string; kind?: string }[];
        };
        if (!cancelled) setWarehouseOptions(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setWarehouseOptions([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  if (user?.role !== "distributor") return null;

  const onPrimaryWarehouseChange = async (warehouseId: string) => {
    const next = warehouseId === "__none__" ? null : warehouseId;
    setPrimarySaving(true);
    try {
      const res = (await updateMyPrimaryWarehouse(next)) as {
        data?: { warehouses?: Record<string, unknown>[] };
      };
      const payload = res.data;
      if (payload?.warehouses?.length) {
        updateData((d) => ({
          ...d,
          warehouses: warehousesFromApiRows(payload.warehouses ?? []),
        }));
      }
      await refreshTeamMembers();
      await refreshShipments();
      await reloadWarehouseOptions();
      toast.success(next ? t("Receiving warehouse updated") : t("Receiving warehouse cleared"), {
        description: next
          ? t("Your depot selection is saved and visible to Hajime HQ.")
          : t("You can pick a depot again anytime."),
      });
    } catch (e) {
      toast.error(t("Could not save warehouse"), {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setPrimarySaving(false);
    }
  };

  const onCreateReceivingWarehouse = async () => {
    const name = newReceivingName.trim();
    if (!name) {
      toast.error(t("Warehouse name is required"));
      return;
    }
    setCreatingReceiving(true);
    try {
      const res = (await createMyReceivingWarehouse({ name })) as {
        data?: { warehouses?: Record<string, unknown>[] };
      };
      const payload = res.data;
      if (payload?.warehouses?.length) {
        updateData((d) => ({
          ...d,
          warehouses: warehousesFromApiRows(payload.warehouses ?? []),
        }));
      }
      await refreshTeamMembers();
      await refreshShipments();
      await reloadWarehouseOptions();
      setNewReceivingName("");
      setCreateWhOpen(false);
      toast.success(t("Receiving warehouse saved"), {
        description: t("This is now your primary depot for inbound stock from HQ."),
      });
    } catch (e) {
      toast.error(t("Could not create warehouse"), {
        description: e instanceof Error ? e.message : "Try again.",
      });
    } finally {
      setCreatingReceiving(false);
    }
  };

  const shellClass =
    variant === "card"
      ? "rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-soft)]"
      : "rounded-xl border border-border/80 bg-card p-4 sm:p-5";

  const needsCreate = !hasOwnReceivingWarehouse || warehouseOptions.length === 0;

  return (
    <div id="warehouses" className={cn(shellClass, className)}>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <Warehouse className="size-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display text-base font-semibold">{t("Receiving warehouse")}</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            {t(
              "Your warehouse settings for inbound stock from Hajime HQ. Add your DC if HQ has not linked one yet.",
            )}
          </p>
        </div>
        {needsCreate ? (
          <Button
            type="button"
            variant={warehouseOptions.length === 0 ? "default" : "outline"}
            size="sm"
            className="shrink-0 touch-manipulation"
            onClick={() => setCreateWhOpen(true)}
          >
            {t("Add receiving warehouse")}
          </Button>
        ) : null}
      </div>

      {warehouseOptions.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border/80 px-3 py-4 text-sm text-muted-foreground">
          {t("No warehouses available yet. Add your receiving warehouse so HQ can route inbound shipments.")}
        </p>
      ) : (
        <div className="max-w-md space-y-2">
          <Label htmlFor="dist-primary-wh">{t("Primary depot")}</Label>
          <Select
            value={selectedPrimaryWarehouseId || "__none__"}
            onValueChange={(v) => void onPrimaryWarehouseChange(v)}
            disabled={primarySaving}
          >
            <SelectTrigger id="dist-primary-wh" className="touch-manipulation">
              <SelectValue placeholder={t("Select depot")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("None selected")}</SelectItem>
              {warehouseOptions.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Dialog open={createWhOpen} onOpenChange={setCreateWhOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{t("Add receiving warehouse")}</DialogTitle>
            <DialogDescription>
              {t(
                "Name the warehouse or DC where you receive product from Hajime HQ. This becomes your primary depot.",
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="dist-new-wh-name">{t("Warehouse name")}</Label>
            <Input
              id="dist-new-wh-name"
              value={newReceivingName}
              onChange={(e) => setNewReceivingName(e.target.value)}
              placeholder="e.g. Metro Hong Kong DC"
              className="touch-manipulation"
              disabled={creatingReceiving}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              className="touch-manipulation"
              onClick={() => setCreateWhOpen(false)}
              disabled={creatingReceiving}
            >
              {t("Cancel")}
            </Button>
            <Button
              type="button"
              className="touch-manipulation"
              onClick={() => void onCreateReceivingWarehouse()}
              disabled={creatingReceiving}
            >
              {creatingReceiving ? t("Saving…") : t("Save warehouse")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
