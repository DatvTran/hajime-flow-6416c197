import { useMemo, useState } from "react";
import { ManufacturerSupportView, type SupportMessageDraft } from "@/components/manufacturer/ManufacturerSupportView";
import { ManufacturerSkeleton } from "@/components/skeletons";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { SUPPORT_FAQS, SUPPORT_LIAISON, SUPPORT_SUBJECTS, SUPPORT_URGENCY_OPTIONS } from "@/lib/manufacturer-support";
import { toast } from "@/components/ui/sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function ManufacturerSupportPage() {
  const { t } = useLanguage();
  const { data, loading } = useAppData();
  const logAudit = useAuditLog();

  const [draft, setDraft] = useState<SupportMessageDraft>({
    subject: SUPPORT_SUBJECTS[0],
    urgency: SUPPORT_URGENCY_OPTIONS[0],
    message: "",
  });

  const supportEmail = data.operationalSettings?.supportEmail?.trim() || SUPPORT_LIAISON.email;
  const liaison = useMemo(() => ({ ...SUPPORT_LIAISON, email: supportEmail }), [supportEmail]);
  const faqs = useMemo(() => SUPPORT_FAQS, []);

  if (loading) {
    return <ManufacturerSkeleton />;
  }

  return (
    <ManufacturerSupportView
      liaison={liaison}
      faqs={faqs}
      draft={draft}
      onDraftChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))}
      onSend={() => {
        if (!draft.message.trim()) {
          toast.error(t("Message required"), {
            description: t("Add details before sending to HQ."),
          });
          return;
        }
        logAudit("support_message", draft.subject, {
          type: "support",
          id: liaison.email,
        });
        toast.success(t("Message sent"), {
          description: `${liaison.name} ${t("will respond based on your selected urgency.")}`,
        });
        setDraft((prev) => ({ ...prev, message: "" }));
      }}
      onEmailLiaison={() => {
        window.location.href = `mailto:${liaison.email}`;
      }}
      onCopyEmail={async () => {
        try {
          await navigator.clipboard.writeText(liaison.email);
          toast.success(t("Email copied"), { description: liaison.email });
        } catch {
          toast.success(t("Email"), { description: liaison.email });
        }
      }}
    />
  );
}
