"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CalendarDays, Plus, ChevronRight, Settings } from "lucide-react";
import { createSheet } from "@/lib/actions/sheets";
import { formatMoney } from "@/lib/money";
import { formatBusinessDate } from "@/lib/dates";
import { VarianceBadge } from "@/components/variance-badge";
import type { Preset, ShiftWithSheet } from "@/lib/types";
import type { TodayView } from "@/lib/data/sheets";

export function TodayBoard({
  orgId,
  view,
  presets,
  currency,
  isAdmin,
}: {
  orgId: string;
  view: TodayView;
  presets: Preset[];
  currency: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const defaultPresetId = presets.find((p) => p.is_default)?.id ?? presets[0]?.id ?? "";
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const presetFor = (shift: ShiftWithSheet) =>
    chosen[shift.id] ?? shift.default_preset_id ?? defaultPresetId;

  const start = (shift: ShiftWithSheet) => {
    const presetId = presetFor(shift);
    if (!presetId) {
      setError("Create a preset in Settings first.");
      return;
    }
    startTransition(async () => {
      const res = await createSheet(orgId, {
        businessDate: view.date,
        shiftId: shift.id,
        presetId,
      });
      if (res?.error) setError(res.error);
      // On success the action redirects to the sheet.
    });
  };

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">Daily takings</h1>
          <p className="mt-1 text-sm text-neutral-400">{formatBusinessDate(view.date)}</p>
        </div>
        <label className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-300">
          <CalendarDays className="h-4 w-4 text-neutral-500" />
          <input
            type="date"
            value={view.date}
            onChange={(e) => router.push(`/?date=${e.target.value}`)}
            className="bg-transparent text-sm text-neutral-100 outline-none [color-scheme:dark]"
          />
        </label>
      </header>

      {/* Day summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Tile label="Sales total" value={formatMoney(view.salesTotal, currency)} />
        <Tile label="Payments total" value={formatMoney(view.paymentsTotal, currency)} />
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Day variance
          </span>
          <VarianceBadge variance={view.variance} currency={currency} size="sm" />
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}

      {view.shifts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-800 p-8 text-center">
          <p className="text-sm text-neutral-400">No shifts configured yet.</p>
          {isAdmin && (
            <Link
              href="/settings"
              className="mt-3 inline-flex items-center gap-1.5 text-sm text-neutral-200 hover:underline"
            >
              <Settings className="h-4 w-4" /> Set up shifts in Settings
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {view.shifts.map((shift) => (
            <div
              key={shift.id}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4"
            >
              {shift.sheet ? (
                <Link
                  href={`/sheets/${shift.sheet.id}`}
                  className="flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-base font-medium text-neutral-100">{shift.name}</span>
                    <StatusPill status={shift.sheet.status} />
                  </div>
                  <div className="flex items-center gap-5">
                    <MiniStat label="Sales" value={formatMoney(shift.sheet.sales_total, currency)} />
                    <MiniStat
                      label="Payments"
                      value={formatMoney(shift.sheet.payments_total, currency)}
                    />
                    <VarianceBadge
                      variance={shift.sheet.variance}
                      currency={currency}
                      size="sm"
                    />
                    <ChevronRight className="h-5 w-5 text-neutral-600" />
                  </div>
                </Link>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <span className="text-base font-medium text-neutral-100">{shift.name}</span>
                  <div className="flex items-center gap-2">
                    <select
                      value={presetFor(shift)}
                      onChange={(e) =>
                        setChosen((c) => ({ ...c, [shift.id]: e.target.value }))
                      }
                      disabled={pending || presets.length === 0}
                      className="h-9 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
                    >
                      {presets.length === 0 && <option value="">No presets</option>}
                      {presets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => start(shift)}
                      disabled={pending || presets.length === 0}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-50 px-3 text-sm font-medium text-neutral-900 hover:bg-neutral-200 disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" /> Start sheet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-neutral-100">{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden text-right sm:block">
      <div className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</div>
      <div className="text-sm font-medium tabular-nums text-neutral-200">{value}</div>
    </div>
  );
}

function StatusPill({ status }: { status: "draft" | "submitted" }) {
  return status === "submitted" ? (
    <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
      Submitted
    </span>
  ) : (
    <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] font-medium text-neutral-300">
      Draft
    </span>
  );
}
