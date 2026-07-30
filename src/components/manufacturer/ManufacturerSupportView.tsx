import { useState } from "react";
import { DistributorPage, DistributorPageHeader } from "@/components/distributor/DistributorUi";
import type { SupportFaq, SupportLiaison } from "@/lib/manufacturer-support";
import { SUPPORT_SUBJECTS, SUPPORT_URGENCY_OPTIONS } from "@/lib/manufacturer-support";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

function LiaisonCard({
  liaison,
  onEmail,
  onCopyEmail,
}: {
  liaison: SupportLiaison;
  onEmail: () => void;
  onCopyEmail: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="dist-card mb-6 flex flex-col gap-4 p-5 shadow-[var(--shadow-soft)] sm:flex-row sm:items-center">
      <div className="flex size-[52px] shrink-0 items-center justify-center rounded-full bg-primary font-display text-xl font-semibold text-primary-foreground">
        {liaison.initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-semibold">{liaison.name}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{liaison.role}</div>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          <button type="button" className="dist-btn dist-btn-ink dist-btn-sm" onClick={onEmail}>
            {t("Email")} {liaison.name}
          </button>
          <button type="button" className="dist-btn dist-btn-outline dist-btn-sm" onClick={onCopyEmail}>
            {liaison.email}
          </button>
        </div>
      </div>
      <div className="shrink-0 sm:text-right">
        <div className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
          {t("Escalation")}
        </div>
        <div className="mt-1 text-[13px] font-medium">{liaison.escalationEmail}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">
          {t("SLA")}: {liaison.escalationSla}
        </div>
      </div>
    </div>
  );
}

function FaqItem({ faq, open, onToggle }: { faq: SupportFaq; open: boolean; onToggle: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 py-3.5 text-left text-sm font-medium"
        onClick={onToggle}
      >
        <span>{t(faq.question)}</span>
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-xs transition-transform duration-200",
            open && "rotate-45",
          )}
        >
          +
        </span>
      </button>
      {open ? (
        <div className="pb-3.5 text-[13px] leading-relaxed text-muted-foreground">{t(faq.answer)}</div>
      ) : null}
    </div>
  );
}

export type SupportMessageDraft = {
  subject: string;
  urgency: string;
  message: string;
};

export type ManufacturerSupportViewProps = {
  liaison: SupportLiaison;
  faqs: SupportFaq[];
  draft: SupportMessageDraft;
  onDraftChange: (patch: Partial<SupportMessageDraft>) => void;
  onSend: () => void;
  onEmailLiaison: () => void;
  onCopyEmail: () => void;
};

export function ManufacturerSupportView({
  liaison,
  faqs,
  draft,
  onDraftChange,
  onSend,
  onEmailLiaison,
  onCopyEmail,
}: ManufacturerSupportViewProps) {
  const { t } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <DistributorPage className="space-y-5">
      <DistributorPageHeader
        title="Support"
        description={`Contact Hajime HQ · ${liaison.name} is your production liaison`}
      />

      <LiaisonCard liaison={liaison} onEmail={onEmailLiaison} onCopyEmail={onCopyEmail} />

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <div className="mb-4 text-sm font-semibold">{t("Send a message")}</div>
          <div className="dist-card p-5">
            <div className="dist-form-group">
              <label htmlFor="mfg-support-subject">{t("Subject")}</label>
              <select
                id="mfg-support-subject"
                value={draft.subject}
                onChange={(e) => onDraftChange({ subject: e.target.value })}
              >
                {SUPPORT_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {t(subject)}
                  </option>
                ))}
              </select>
            </div>
            <div className="dist-form-group">
              <label htmlFor="mfg-support-urgency">{t("Urgency")}</label>
              <select
                id="mfg-support-urgency"
                value={draft.urgency}
                onChange={(e) => onDraftChange({ urgency: e.target.value })}
              >
                {SUPPORT_URGENCY_OPTIONS.map((urgency) => (
                  <option key={urgency} value={urgency}>
                    {t(urgency)}
                  </option>
                ))}
              </select>
            </div>
            <div className="dist-form-group">
              <label htmlFor="mfg-support-message">{t("Message")}</label>
              <textarea
                id="mfg-support-message"
                rows={5}
                value={draft.message}
                onChange={(e) => onDraftChange({ message: e.target.value })}
                placeholder={t(
                  "Describe your question or request — include batch IDs, PR numbers, or SKUs where relevant…",
                )}
              />
            </div>
            <button type="button" className="dist-btn dist-btn-accent w-full" onClick={onSend}>
              {t("Send to")} {liaison.name}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-4 text-sm font-semibold">{t("Common questions")}</div>
          <div className="dist-card px-5">
            {faqs.map((faq, index) => (
              <FaqItem
                key={faq.question}
                faq={faq}
                open={openFaq === index}
                onToggle={() => setOpenFaq(openFaq === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </div>
    </DistributorPage>
  );
}
