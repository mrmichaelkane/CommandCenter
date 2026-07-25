"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Download, ChevronRight } from "lucide-react";
import { formatMoney } from "@/lib/money";
import { formatShortDate } from "@/lib/dates";
import { VarianceBadge } from "@/components/variance-badge";
import { Button } from "@/components/ui/button";
import type { SheetWithShift } from "@/lib/data/sheets";

function csvEscape(value: string) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function HistoryView({
  rows,
  currency,
  from,
  to,
}: {
  rows: SheetWithShift[];
  currency: string;
  from: string;
  to: string;
}) {
  const router = useRouter();
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);

  const apply = () => router.push(`/sheets?from=${start}&to=${end}`);

  const exportCsv = () => {
    const header = ["Business date", "Shift", "Status", "Sales total", "Payments total", "Variance"];
    const lines = rows.map((r) =>
      [
        r.business_date,
        csvEscape(r.shift_name),
        r.status,
        r.sales_total.toFixed(2),
        r.payments_total.toFixed(2),
        r.variance.toFixed(2),
      ].join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `takings-${from}-to-${to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group by business date for a paper-sheet-like day-by-day layout.
  const groups = new Map<string, SheetWithShift[]>();
  for (const r of rows) {
    const list = groups.get(r.business_date) ?? [];
    list.push(r);
    groups.set(r.business_date, list);
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">History</h1>
          <p className="mt-1 text-sm text-neutral-400">Submitted and draft sheets by date.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-neutral-500">
            From
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 block h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none [color-scheme:dark] focus:border-neutral-500"
            />
          </label>
          <label className="text-xs text-neutral-500">
            To
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 block h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none [color-scheme:dark] focus:border-neutral-500"
            />
          </label>
          <Button variant="secondary" onClick={apply} className="h-9">
            Apply
          </Button>
          <Button
            variant="outline"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="h-9"
          >
            <Download className="h-4 w-4" /> CSV
          </Button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-500">
          No sheets in this date range.
        </div>
      ) : (
        <div className="space-y-6">
          {[...groups.entries()].map(([date, list]) => {
            const dayVariance = list.reduce((s, r) => s + r.variance, 0);
            return (
              <div key={date}>
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-neutral-300">{formatShortDate(date)}</h2>
                  <span className="text-xs text-neutral-500">
                    Day variance {formatMoney(dayVariance, currency)}
                  </span>
                </div>
                <div className="divide-y divide-neutral-800 overflow-hidden rounded-2xl border border-neutral-800">
                  {list.map((r) => (
                    <Link
                      key={r.id}
                      href={`/sheets/${r.id}`}
                      className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900/50 px-4 py-3 hover:bg-neutral-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-neutral-100">{r.shift_name}</span>
                        {r.status === "submitted" ? (
                          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                            Submitted
                          </span>
                        ) : (
                          <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
                            Draft
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-5">
                        <div className="hidden text-right sm:block">
                          <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Sales
                          </div>
                          <div className="text-sm tabular-nums text-neutral-200">
                            {formatMoney(r.sales_total, currency)}
                          </div>
                        </div>
                        <div className="hidden text-right sm:block">
                          <div className="text-[11px] uppercase tracking-wide text-neutral-500">
                            Payments
                          </div>
                          <div className="text-sm tabular-nums text-neutral-200">
                            {formatMoney(r.payments_total, currency)}
                          </div>
                        </div>
                        <VarianceBadge variance={r.variance} currency={currency} size="sm" />
                        <ChevronRight className="h-5 w-5 text-neutral-600" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
