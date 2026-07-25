"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPresetWithFields } from "@/lib/data/presets";
import { roundMoney, parseMoney } from "@/lib/money";
import type { SheetSalesLine, SheetPaymentLine } from "@/lib/types";

interface SalesInput {
  key: string;
  amount: number | string;
  note?: string | null;
}
interface PaymentInput {
  key: string;
  amount: number | string;
  reference?: string | null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function revalidateSheet(id?: string) {
  revalidatePath("/");
  revalidatePath("/sheets");
  if (id) revalidatePath(`/sheets/${id}`);
}

// Re-derive the sheet's line values from the authoritative snapshot on the
// existing row, taking only amounts/notes from the client (keyed by field id).
// This keeps the schema locked to what the sheet was created with — clients
// can't add, rename, or drop fields.
function mergeSales(existing: SheetSalesLine[], input: SalesInput[]) {
  const byKey = new Map(input.map((i) => [i.key, i]));
  return existing.map((line) => {
    const incoming = byKey.get(line.key);
    return {
      ...line,
      amount: incoming ? roundMoney(parseMoney(incoming.amount)) : line.amount,
      note: line.has_note ? (incoming?.note ?? line.note ?? null) : null,
    };
  });
}

function mergePayments(existing: SheetPaymentLine[], input: PaymentInput[]) {
  const byKey = new Map(input.map((i) => [i.key, i]));
  return existing.map((line) => {
    const incoming = byKey.get(line.key);
    return {
      ...line,
      amount: incoming ? roundMoney(parseMoney(incoming.amount)) : line.amount,
      reference: line.has_reference ? (incoming?.reference ?? line.reference ?? null) : null,
    };
  });
}

function totals(sales: SheetSalesLine[], payments: SheetPaymentLine[]) {
  const salesTotal = roundMoney(sales.reduce((s, l) => s + (Number(l.amount) || 0), 0));
  const paymentsTotal = roundMoney(payments.reduce((s, l) => s + (Number(l.amount) || 0), 0));
  return { salesTotal, paymentsTotal, variance: roundMoney(salesTotal - paymentsTotal) };
}

// Creates a draft sheet by snapshotting a preset's fields, then opens it. If a
// sheet already exists for this date + shift, opens that one instead.
export async function createSheet(
  orgId: string,
  input: { businessDate: string; shiftId: string; presetId: string },
) {
  if (!DATE_RE.test(input.businessDate)) return { error: "Invalid business date." };
  if (!input.shiftId) return { error: "Select a shift." };
  if (!input.presetId) return { error: "Select a preset." };

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("sheets")
    .select("id")
    .eq("org_id", orgId)
    .eq("business_date", input.businessDate)
    .eq("shift_id", input.shiftId)
    .maybeSingle();
  if (existing) redirect(`/sheets/${existing.id}`);

  const preset = await getPresetWithFields(orgId, input.presetId);
  if (!preset) return { error: "Preset not found." };

  const sales = preset.sales_categories.map((c) => ({
    key: c.id,
    label: c.label,
    amount: 0,
    has_note: c.has_note,
    note: null,
  }));
  const payments = preset.payment_methods.map((m) => ({
    key: m.id,
    label: m.label,
    amount: 0,
    has_reference: m.has_reference,
    reference: null,
  }));

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: created, error } = await supabase
    .from("sheets")
    .insert({
      org_id: orgId,
      business_date: input.businessDate,
      shift_id: input.shiftId,
      preset_id: input.presetId,
      sales,
      payments,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();

  if (error || !created) {
    if (error?.code === "23505") return { error: "A sheet for this date and shift already exists." };
    return { error: error?.message ?? "Could not create sheet." };
  }

  revalidateSheet();
  redirect(`/sheets/${created.id}`);
}

async function applyValues(
  id: string,
  input: { sales: SalesInput[]; payments: PaymentInput[]; note?: string | null },
  submit: boolean,
) {
  const supabase = await createClient();

  const { data: row, error: loadErr } = await supabase
    .from("sheets")
    .select("id, status, sales, payments")
    .eq("id", id)
    .maybeSingle();
  if (loadErr) return { error: loadErr.message };
  if (!row) return { error: "Sheet not found." };
  if (row.status === "submitted") {
    return { error: "This sheet is submitted and locked." };
  }

  const sales = mergeSales((row.sales ?? []) as SheetSalesLine[], input.sales ?? []);
  const payments = mergePayments((row.payments ?? []) as SheetPaymentLine[], input.payments ?? []);
  const { salesTotal, paymentsTotal, variance } = totals(sales, payments);

  const update: Record<string, unknown> = {
    sales,
    payments,
    sales_total: salesTotal,
    payments_total: paymentsTotal,
    variance,
    note: input.note?.trim() ? input.note.trim() : null,
  };

  if (submit) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    update.status = "submitted";
    update.submitted_by = user?.id ?? null;
    update.submitted_at = new Date().toISOString();
  }

  const { error } = await supabase.from("sheets").update(update).eq("id", id);
  if (error) return { error: error.message };

  revalidateSheet(id);
  return { error: null };
}

export async function saveSheet(
  id: string,
  input: { sales: SalesInput[]; payments: PaymentInput[]; note?: string | null },
) {
  return applyValues(id, input, false);
}

export async function submitSheet(
  id: string,
  input: { sales: SalesInput[]; payments: PaymentInput[]; note?: string | null },
) {
  return applyValues(id, input, true);
}

// Discards a draft sheet. Submitted sheets are locked and cannot be deleted.
export async function deleteSheet(id: string) {
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("sheets")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: "Sheet not found." };
  if (row.status === "submitted") return { error: "Submitted sheets can't be deleted." };

  const { error } = await supabase.from("sheets").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateSheet();
  redirect("/");
}
