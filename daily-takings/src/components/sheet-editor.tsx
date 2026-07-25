"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, Trash2 } from "lucide-react";
import { saveSheet, submitSheet, deleteSheet } from "@/lib/actions/sheets";
import { formatMoney, parseMoney } from "@/lib/money";
import { formatBusinessDate, formatTimestamp } from "@/lib/dates";
import { MoneyInput } from "@/components/money-input";
import { VarianceBadge } from "@/components/variance-badge";
import { Button } from "@/components/ui/button";
import type { Sheet } from "@/lib/types";

export function SheetEditor({
  sheet,
  shiftName,
  currency,
}: {
  sheet: Sheet;
  shiftName: string;
  currency: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const canEdit = sheet.status === "draft";

  const [salesAmt, setSalesAmt] = useState<Record<string, string>>(() =>
    Object.fromEntries(sheet.sales.map((l) => [l.key, l.amount ? l.amount.toFixed(2) : ""])),
  );
  const [salesNote, setSalesNote] = useState<Record<string, string>>(() =>
    Object.fromEntries(sheet.sales.map((l) => [l.key, l.note ?? ""])),
  );
  const [payAmt, setPayAmt] = useState<Record<string, string>>(() =>
    Object.fromEntries(sheet.payments.map((l) => [l.key, l.amount ? l.amount.toFixed(2) : ""])),
  );
  const [payRef, setPayRef] = useState<Record<string, string>>(() =>
    Object.fromEntries(sheet.payments.map((l) => [l.key, l.reference ?? ""])),
  );
  const [note, setNote] = useState(sheet.note ?? "");

  const salesTotal = useMemo(
    () => sheet.sales.reduce((sum, l) => sum + parseMoney(salesAmt[l.key]), 0),
    [sheet.sales, salesAmt],
  );
  const paymentsTotal = useMemo(
    () => sheet.payments.reduce((sum, l) => sum + parseMoney(payAmt[l.key]), 0),
    [sheet.payments, payAmt],
  );
  const variance = salesTotal - paymentsTotal;

  const buildPayload = () => ({
    sales: sheet.sales.map((l) => ({
      key: l.key,
      amount: salesAmt[l.key] ?? "",
      note: salesNote[l.key] ?? null,
    })),
    payments: sheet.payments.map((l) => ({
      key: l.key,
      amount: payAmt[l.key] ?? "",
      reference: payRef[l.key] ?? null,
    })),
    note,
  });

  const save = () =>
    startTransition(async () => {
      const res = await saveSheet(sheet.id, buildPayload());
      setMessage(res?.error ? { error: true, text: res.error } : { error: false, text: "Draft saved." });
      router.refresh();
    });

  const submit = () => {
    if (!window.confirm("Submit this sheet? It will be locked from further editing.")) return;
    startTransition(async () => {
      const res = await submitSheet(sheet.id, buildPayload());
      setMessage(res?.error ? { error: true, text: res.error } : null);
      router.refresh();
    });
  };

  const discard = () => {
    if (!window.confirm("Discard this draft sheet? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteSheet(sheet.id);
      if (res?.error) setMessage({ error: true, text: res.error });
      // On success the action redirects to "/".
    });
  };

  return (
    <div>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-200"
      >
        <ArrowLeft className="h-4 w-4" /> Back to today
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-neutral-50">
            {shiftName} · {formatBusinessDate(sheet.business_date)}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm">
            {sheet.status === "submitted" ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-0.5 text-xs font-medium text-emerald-300">
                <Lock className="h-3 w-3" /> Submitted
                {sheet.submitted_at && (
                  <span className="text-emerald-500/80">· {formatTimestamp(sheet.submitted_at)}</span>
                )}
              </span>
            ) : (
              <span className="rounded-full bg-neutral-800 px-2.5 py-0.5 text-xs font-medium text-neutral-300">
                Draft
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Live summary */}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <SummaryTile label="Sales total" value={formatMoney(salesTotal, currency)} />
        <SummaryTile label="Payments total" value={formatMoney(paymentsTotal, currency)} />
        <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Variance
          </span>
          <VarianceBadge variance={variance} currency={currency} size="sm" />
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Sales */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-200">Sales</h2>
          {sheet.sales.length === 0 && (
            <p className="text-sm text-neutral-500">No sales categories on this sheet.</p>
          )}
          <div className="space-y-3">
            {sheet.sales.map((l) => (
              <div key={l.key}>
                <div className="flex items-center gap-3">
                  <label className="flex-1 text-sm text-neutral-300">{l.label}</label>
                  <div className="w-40">
                    {canEdit ? (
                      <MoneyInput
                        currency={currency}
                        value={salesAmt[l.key] ?? ""}
                        onChange={(v) => setSalesAmt((s) => ({ ...s, [l.key]: v }))}
                      />
                    ) : (
                      <div className="flex h-10 items-center justify-end rounded-lg border border-neutral-800 px-3 text-sm tabular-nums text-neutral-100">
                        {formatMoney(l.amount, currency)}
                      </div>
                    )}
                  </div>
                </div>
                {l.has_note &&
                  (canEdit ? (
                    <input
                      value={salesNote[l.key] ?? ""}
                      onChange={(e) => setSalesNote((s) => ({ ...s, [l.key]: e.target.value }))}
                      placeholder="Note (optional)"
                      className="mt-1.5 h-8 w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 text-xs text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
                    />
                  ) : (
                    l.note && <p className="mt-1 text-xs text-neutral-500">{l.note}</p>
                  ))}
              </div>
            ))}
          </div>
        </section>

        {/* Payments */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
          <h2 className="mb-4 text-sm font-semibold text-neutral-200">Payments / Tenders</h2>
          {sheet.payments.length === 0 && (
            <p className="text-sm text-neutral-500">No payment methods on this sheet.</p>
          )}
          <div className="space-y-3">
            {sheet.payments.map((l) => (
              <div key={l.key}>
                <div className="flex items-center gap-3">
                  <label className="flex-1 text-sm text-neutral-300">{l.label}</label>
                  <div className="w-40">
                    {canEdit ? (
                      <MoneyInput
                        currency={currency}
                        value={payAmt[l.key] ?? ""}
                        onChange={(v) => setPayAmt((s) => ({ ...s, [l.key]: v }))}
                      />
                    ) : (
                      <div className="flex h-10 items-center justify-end rounded-lg border border-neutral-800 px-3 text-sm tabular-nums text-neutral-100">
                        {formatMoney(l.amount, currency)}
                      </div>
                    )}
                  </div>
                </div>
                {l.has_reference &&
                  (canEdit ? (
                    <input
                      value={payRef[l.key] ?? ""}
                      onChange={(e) => setPayRef((s) => ({ ...s, [l.key]: e.target.value }))}
                      placeholder="Reference (e.g. batch #)"
                      className="mt-1.5 h-8 w-full rounded-md border border-neutral-800 bg-neutral-950 px-2.5 text-xs text-neutral-300 placeholder:text-neutral-600 outline-none focus:border-neutral-600"
                    />
                  ) : (
                    l.reference && <p className="mt-1 text-xs text-neutral-500">Ref: {l.reference}</p>
                  ))}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Sheet note */}
      <section className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-900/50 p-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-200">Notes</h2>
        {canEdit ? (
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Anything worth recording about this reconciliation…"
            className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-neutral-500"
          />
        ) : (
          <p className="text-sm text-neutral-400">{sheet.note || "—"}</p>
        )}
      </section>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {canEdit ? (
          <>
            <Button onClick={submit} disabled={pending}>
              {pending ? "Working…" : "Submit sheet"}
            </Button>
            <Button variant="secondary" onClick={save} disabled={pending}>
              Save draft
            </Button>
            <button
              type="button"
              onClick={discard}
              disabled={pending}
              className="ml-auto inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-rose-400 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" /> Discard draft
            </button>
          </>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm text-neutral-400">
            <Lock className="h-4 w-4 text-neutral-500" />
            This sheet is submitted and locked.
          </p>
        )}
        {message && (
          <span className={message.error ? "text-sm text-rose-400" : "text-sm text-emerald-400"}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <span className="text-lg font-semibold tabular-nums text-neutral-100">{value}</span>
    </div>
  );
}
