import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getExportOrder, issueExportDoc, type ExportOrderDto } from "@/lib/api-v1";
import { EXPORT_DOC_TYPES, type ExportDocType } from "@/lib/export-commercial";
import { ExportOrderDocView } from "@/components/export/ExportOrderDocView";
import { toast } from "@/components/ui/sonner";

function canHq(role: string | undefined) {
  return role === "brand_operator" || role === "founder_admin" || role === "operations";
}

export default function HqExportOrderDocPage() {
  const { user } = useAuth();
  const { orderId, docType } = useParams();
  const [order, setOrder] = useState<ExportOrderDto | null>(null);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    void getExportOrder(orderId).then((r) => setOrder(r.data)).catch(() => setOrder(null));
  }, [orderId]);

  if (!user || !canHq(user.role)) return <Navigate to="/" replace />;
  const doc = (docType || "") as ExportDocType;
  if (!EXPORT_DOC_TYPES.includes(doc)) {
    return <p className="p-8 text-sm">Unknown document.</p>;
  }
  if (!order) return <p className="p-8 text-sm text-muted-foreground">Loading…</p>;

  const issue = async () => {
    setIssuing(true);
    try {
      const res = await issueExportDoc(String(order.displayId), doc);
      setOrder(res.data);
      toast.success("Document issued", {
        description: res.email?.sent
          ? "Buyer emailed with a portal link."
          : res.email?.logged
            ? "Logged on server (set RESEND_API_KEY to send)."
            : doc === "production_auth"
              ? "Manufacturer can open this from Export authorizations."
              : "Saved on the file.",
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not issue");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <ExportOrderDocView
      order={order}
      doc={doc}
      backTo={`/export-orders/${order.displayId}`}
      onIssue={() => void issue()}
      issuing={issuing}
    />
  );
}
