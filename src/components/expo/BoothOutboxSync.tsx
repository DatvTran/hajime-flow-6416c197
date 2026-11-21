import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useOnline } from "@/hooks/useOnline";
import { canHqBooth, syncAndReport } from "@/lib/booth-outbox";

/** Uploads booth entries saved offline as soon as the iPad is signed in and back online, on any page. */
export function BoothOutboxSync() {
  const { user } = useAuth();
  const online = useOnline();
  const allowed = canHqBooth(user?.role);

  useEffect(() => {
    if (!allowed || !online) return;
    const t = setTimeout(() => void syncAndReport().catch(() => undefined), 1500);
    return () => clearTimeout(t);
  }, [allowed, online, user?.id]);

  return null;
}
