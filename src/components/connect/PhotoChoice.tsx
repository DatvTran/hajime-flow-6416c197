import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "hero" | "tile" | "product";

type PhotoChoiceProps = {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  /** Product cards only: line under the name. */
  description?: string;
  img: string | null;
  checked: boolean;
  onChange: () => void;
  variant: Variant;
  lazy?: boolean;
};

const ringBase =
  "relative block cursor-pointer overflow-hidden rounded-xl transition-shadow duration-200 " +
  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] " +
  "has-[:focus-visible]:outline-[hsl(24_10%_10%)]";
const selectedRing = "shadow-[0_0_0_2px_hsl(40_88%_42%)]";

function CheckBadge({ size }: { size: "lg" | "sm" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "absolute flex items-center justify-center rounded-full bg-[hsl(40_88%_42%)] text-[hsl(40_20%_99%)] shadow-[0_2px_8px_hsl(24_10%_10%/0.3)]",
        size === "lg" ? "right-3 top-3 h-9 w-9" : "right-2 top-2 h-[26px] w-[26px]",
      )}
    >
      <Check className={size === "lg" ? "h-5 w-5" : "h-[15px] w-[15px]"} strokeWidth={2.5} />
    </span>
  );
}

export function PhotoChoice({
  type,
  name,
  value,
  label,
  description,
  img,
  checked,
  onChange,
  variant,
  lazy,
}: PhotoChoiceProps) {
  const input = (
    <input
      type={type}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="absolute m-0 h-px w-px opacity-0"
    />
  );

  if (variant === "product") {
    return (
      <label
        className={cn(
          ringBase,
          "flex flex-col border border-[hsl(35_12%_89%)] bg-[hsl(40_20%_99%)]",
          checked && selectedRing,
        )}
      >
        {input}
        <span className="block aspect-[198/289] bg-[hsl(24_14%_10%)]">
          {img ? (
            <img src={img} alt="" width={396} height={578} className="block h-full w-full object-cover" />
          ) : null}
        </span>
        <span className="flex flex-col items-center px-2 pb-3 pt-2.5 text-center">
          <span className="font-display text-[21px] font-semibold leading-tight">{label}</span>
          {description ? <span className="mt-0.5 text-sm text-[hsl(24_8%_32%)]">{description}</span> : null}
        </span>
        {checked ? <CheckBadge size="lg" /> : null}
      </label>
    );
  }

  const hero = variant === "hero";
  return (
    <label
      className={cn(
        ringBase,
        hero ? "aspect-[16/10] bg-[hsl(24_12%_12%)]" : "aspect-square bg-[hsl(24_10%_13%)]",
        checked && selectedRing,
      )}
    >
      {input}
      {img ? (
        <img
          src={img}
          alt=""
          width={hero ? 616 : 256}
          height={hero ? 380 : 200}
          loading={lazy ? "lazy" : undefined}
          className="block h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden className="absolute inset-x-0 bottom-7 top-0 flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[5px] w-[5px] rounded-full bg-[hsl(40_20%_92%)]" />
          ))}
        </span>
      )}
      <span
        className={cn(
          "absolute inset-x-0 bottom-0 font-display text-[hsl(40_20%_97%)]",
          hero
            ? "bg-gradient-to-t from-[hsl(24_12%_8%/0.92)] from-40% to-transparent px-4 pb-3.5 pt-9 text-[27px] font-medium tracking-[-0.01em]"
            : "bg-gradient-to-t from-[hsl(24_12%_8%/0.94)] from-55% to-transparent px-1.5 pb-2 pt-[18px] text-center text-[17px] font-semibold leading-tight",
        )}
      >
        {label}
      </span>
      {checked ? <CheckBadge size={hero ? "lg" : "sm"} /> : null}
    </label>
  );
}
