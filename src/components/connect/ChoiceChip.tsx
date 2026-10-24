import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ChoiceChipProps = {
  type: "radio" | "checkbox";
  name: string;
  value: string;
  label: string;
  checked: boolean;
  onChange: () => void;
};

export function ChoiceChip({ type, name, value, label, checked, onChange }: ChoiceChipProps) {
  return (
    <label
      className={cn(
        "relative flex min-h-[52px] cursor-pointer items-center justify-center rounded-[10px] border px-1 text-center text-[15px] font-medium min-[360px]:px-2 min-[360px]:text-base leading-tight transition-colors",
        "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[3px] has-[:focus-visible]:outline-[hsl(40_88%_42%)]",
        checked
          ? "border-[hsl(24_10%_10%)] bg-[hsl(24_10%_10%)] text-[hsl(40_20%_97%)]"
          : "border-[hsl(35_12%_82%)] bg-[hsl(40_20%_99%)] hover:bg-[hsl(35_16%_93%)]",
      )}
    >
      <input
        type={type}
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        className="absolute m-0 h-px w-px opacity-0"
      />
      {checked ? (
        <Check
          aria-hidden
          className="absolute right-1.5 top-1.5 h-3.5 w-3.5 text-[hsl(40_88%_58%)]"
          strokeWidth={3}
        />
      ) : null}
      {label}
    </label>
  );
}
