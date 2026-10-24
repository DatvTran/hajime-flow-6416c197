import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  value: string;
  name: string;
  description: string;
  img: string;
  checked: boolean;
  onChange: () => void;
};

export function ProductCard({ value, name, description, img, checked, onChange }: ProductCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col overflow-hidden rounded-xl border bg-[hsl(40_20%_99%)] transition-shadow duration-200",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-[hsl(24_10%_10%)]",
        checked ? "border-transparent shadow-[0_0_0_2px_hsl(40_88%_42%)]" : "border-[hsl(35_12%_89%)]",
      )}
    >
      <input
        type="checkbox"
        name="products"
        value={value}
        checked={checked}
        onChange={onChange}
        className="absolute m-0 h-px w-px opacity-0"
      />
      <span className="block aspect-[198/289] bg-[hsl(24_14%_10%)]">
        <img src={img} alt="" width={396} height={578} className="block h-full w-full object-cover" />
      </span>
      <span className="flex flex-col items-center px-2 pb-3 pt-2.5 text-center">
        <span className="font-display text-[19px] font-semibold min-[360px]:text-[22px] leading-tight">{name}</span>
        <span className="mt-0.5 text-[15px] text-[hsl(24_8%_32%)]">{description}</span>
      </span>
      {checked ? (
        <span
          aria-hidden
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(40_88%_42%)] text-[hsl(40_20%_99%)] shadow-[0_2px_8px_hsl(24_10%_10%/0.3)]"
        >
          <Check className="h-5 w-5" strokeWidth={2.5} />
        </span>
      ) : null}
    </label>
  );
}
