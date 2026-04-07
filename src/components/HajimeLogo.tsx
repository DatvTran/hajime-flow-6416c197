import { cn } from "@/lib/utils";

const LOGO_SRC = "/hajime-logo.png";

type HajimeLogoProps = {
  /** `light`: black artwork on light UI. `dark`: inverted for sumi / login backgrounds. */
  variant?: "light" | "dark";
  className?: string;
  alt?: string;
};

export function HajimeLogo({ variant = "light", className, alt = "Hajime" }: HajimeLogoProps) {
  return (
    <img
      src={LOGO_SRC}
      alt={alt}
      decoding="async"
      className={cn(
        "h-auto max-w-full object-contain select-none",
        variant === "dark" && "brightness-0 invert",
        className,
      )}
    />
  );
}
