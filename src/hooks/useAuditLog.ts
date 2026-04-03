import { useCallback } from "react";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";

export function useAuditLog() {
  const { updateData } = useAppData();
  const { user } = useAuth();

  return useCallback(
    (action: string, detail?: string, entity?: { type: string; id: string }) => {
      updateData((d) => ({
        ...d,
        auditLogs: [
          {
            id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            at: new Date().toISOString(),
            action,
            detail,
            entityType: entity?.type,
            entityId: entity?.id,
            userLabel: user?.displayName ?? user?.email ?? "unknown",
          },
          ...(d.auditLogs ?? []).slice(0, 199),
        ],
      }));
    },
    [updateData, user?.displayName, user?.email],
  );
}
