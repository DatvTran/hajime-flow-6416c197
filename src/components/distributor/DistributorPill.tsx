import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/** Status pill from distributor-app.html `pill()` */
export type DistributorPillTone = "green" | "blue" | "amber" | "red" | "neutral" | "ink";

const toneClass: Record<DistributorPillTone, string> = {
  green: "dist-pill-green",
  blue: "dist-pill-blue",
  amber: "dist-pill-amber",
  red: "dist-pill-red",
  neutral: "dist-pill-neutral",
  ink: "dist-pill-ink",
};

const dotColor: Record<DistributorPillTone, string> = {
  green: "bg-[hsl(158_56%_36%)]",
  blue: "bg-[hsl(215_72%_50%)]",
  amber: "bg-[hsl(38_90%_50%)]",
  red: "bg-[hsl(0_68%_48%)]",
  neutral: "bg-muted-foreground",
  ink: "bg-[hsl(24_10%_16%)]",
};

export function DistributorPill({
  tone,
  label,
  className,
}: {
  tone: DistributorPillTone;
  label: string;
  className?: string;
}) {
  const { t } = useLanguage();
  return (
    <span className={cn("dist-pill", toneClass[tone], className)}>
      <span className={cn("dist-pdot", dotColor[tone])} aria-hidden />
      {t(label)}
    </span>
  );
}
