import { useLanguage, type SupportedLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

type LanguageSelectProps = {
  className?: string;
  /** Sidebar footer variant — compact, dark chrome. */
  variant?: "sidebar" | "default";
};

/**
 * Native <select> for reliable language switching (Radix Select can fail inside overflow sidebars).
 */
export function LanguageSelect({ className, variant = "sidebar" }: LanguageSelectProps) {
  const { language, setLanguage, options, t } = useLanguage();

  return (
    <select
      value={language}
      aria-label={t("Choose language")}
      className={cn(
        "h-8 w-full cursor-pointer rounded-md border text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
        variant === "sidebar"
          ? "border-sidebar-border bg-sidebar px-2 text-sidebar-foreground"
          : "border-input bg-background px-3 text-foreground",
        className,
      )}
      onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
