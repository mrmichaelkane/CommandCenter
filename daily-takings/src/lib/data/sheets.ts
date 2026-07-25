import { createClient } from "@/lib/supabase/server";
import type {
  Sheet,
  SheetSalesLine,
  SheetPaymentLine,
  Shift,
  ShiftWithSheet,
} from "@/lib/types";

// Raw jsonb / numeric columns need light coercion into the app-facing shape.
function toSheet(row: Record<string, unknown>): Sheet {
  const sales = (Array.isArray(row.sales) ? row.sales : []) as SheetSalesLine[];
  const payments = (Array.isArray(row.payments) ? row.payments : []) as SheetPaymentLine[];
  return {
    id: row.id as string,
    org_id: row.org_id as string,
    business_date: row.business_date as string,
    shift_id: row.shift_id as string,
    preset_id: (row.preset_id as string | null) ?? null,
    status: row.status as Sheet["status"],
    sales: sales.map((l) => ({ ...l, amount: Number(l.amount) || 0 })),
    payments: payments.map((l) => ({ ...l, amount: Number(l.amount) || 0 })),
    sales_total: Number(row.sales_total) || 0,
    payments_total: Number(row.payments_total) || 0,
    variance: Number(row.variance) || 0,
    note: (row.note as string | null) ?? null,
    created_by: (row.created_by as string | null) ?? null,
    submitted_by: (row.submitted_by as string | null) ?? null,
    submitted_at: (row.submitted_at as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export interface TodayView {
  date: string;
  shifts: ShiftWithSheet[];
  salesTotal: number;
  paymentsTotal: number;
  variance: number;
}

// Active shifts for a business date, each paired with its sheet (if started),
// plus a day-level roll-up across all sheets for that date.
export async function getDayView(orgId: string, date: string): Promise<TodayView> {
  const supabase = await createClient();

  const [{ data: shiftRows, error: shiftErr }, { data: sheetRows, error: sheetErr }] =
    await Promise.all([
      supabase
        .from("shifts")
        .select("*")
        .eq("org_id", orgId)
        .is("archived_at", null)
        .order("sort_order", { ascending: true }),
      supabase.from("sheets").select("*").eq("org_id", orgId).eq("business_date", date),
    ]);
  if (shiftErr) throw new Error(shiftErr.message);
  if (sheetErr) throw new Error(sheetErr.message);

  const sheets = (sheetRows ?? []).map(toSheet);
  const byShift = new Map(sheets.map((s) => [s.shift_id, s]));

  const shifts: ShiftWithSheet[] = ((shiftRows ?? []) as Shift[]).map((s) => ({
    ...s,
    sheet: byShift.get(s.id) ?? null,
  }));

  return {
    date,
    shifts,
    salesTotal: sheets.reduce((sum, s) => sum + s.sales_total, 0),
    paymentsTotal: sheets.reduce((sum, s) => sum + s.payments_total, 0),
    variance: sheets.reduce((sum, s) => sum + s.variance, 0),
  };
}

export async function getSheet(orgId: string, id: string): Promise<Sheet | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheets")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toSheet(data) : null;
}

export interface SheetWithShift extends Sheet {
  shift_name: string;
}

// History rows within a date range, newest first, with shift name resolved.
export async function getHistory(
  orgId: string,
  from: string,
  to: string,
): Promise<SheetWithShift[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sheets")
    .select("*, shifts(name)")
    .eq("org_id", orgId)
    .gte("business_date", from)
    .lte("business_date", to)
    .order("business_date", { ascending: false })
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const shift = (row as { shifts?: { name?: string } }).shifts;
    return { ...toSheet(row), shift_name: shift?.name ?? "—" };
  });
}
