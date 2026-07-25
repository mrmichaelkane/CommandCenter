"use client";

import { currencySymbol } from "@/lib/money";

export function MoneyInput({
  value,
  onChange,
  currency,
  disabled,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  currency: string;
  disabled?: boolean;
  id?: string;
}) {
  const symbol = currencySymbol(currency);
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
        {symbol}
      </span>
      <input
        id={id}
        inputMode="decimal"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        onBlur={(e) => {
          const n = parseFloat(e.target.value);
          onChange(Number.isFinite(n) ? n.toFixed(2) : "");
        }}
        placeholder="0.00"
        className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-950 pr-3 pl-9 text-right text-sm text-neutral-100 tabular-nums outline-none transition focus:border-neutral-500 disabled:opacity-60"
      />
    </div>
  );
}
