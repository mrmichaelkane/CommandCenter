import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

// Variance = Sales Total − Payments Total. Zero is a balanced sheet.
export function VarianceBadge({
  variance,
  currency,
  size = "md",
}: {
  variance: number;
  currency: string;
  size?: "sm" | "md" | "lg";
}) {
  const balanced = Math.abs(variance) < 0.005;
  const positive = variance > 0;

  const tone = balanced
    ? "border-emerald-800 bg-emerald-950/50 text-emerald-300"
    : positive
      ? "border-amber-800 bg-amber-950/40 text-amber-300"
      : "border-rose-800 bg-rose-950/40 text-rose-300";

  const label = balanced
    ? "Balanced"
    : positive
      ? "Sales over payments"
      : "Payments over sales";

  const sizing =
    size === "lg"
      ? "px-4 py-3 text-2xl"
      : size === "sm"
        ? "px-2 py-1 text-sm"
        : "px-3 py-2 text-lg";

  return (
    <div className={cn("inline-flex flex-col items-end rounded-xl border", tone, sizing)}>
      <span className="font-semibold tabular-nums">
        {balanced ? formatMoney(0, currency) : formatMoney(variance, currency)}
      </span>
      <span className="text-[11px] font-medium uppercase tracking-wide opacity-80">{label}</span>
    </div>
  );
}
