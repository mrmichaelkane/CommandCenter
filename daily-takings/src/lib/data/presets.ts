import { createClient } from "@/lib/supabase/server";
import type { Preset, PresetWithFields, SalesCategory, PaymentMethod } from "@/lib/types";

function byOrder<T extends { sort_order: number }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.sort_order - b.sort_order);
}

// Active presets with their ordered sales categories and payment methods.
export async function getPresetsWithFields(orgId: string): Promise<PresetWithFields[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presets")
    .select("*, sales_categories(*), payment_methods(*)")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).map((p) => {
    const row = p as Preset & {
      sales_categories: SalesCategory[];
      payment_methods: PaymentMethod[];
    };
    return {
      ...row,
      sales_categories: byOrder(row.sales_categories ?? []),
      payment_methods: byOrder(row.payment_methods ?? []),
    };
  });
}

// Lightweight list for pickers (shift default, sheet creation).
export async function getPresets(orgId: string): Promise<Preset[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presets")
    .select("*")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Preset[];
}

// One preset with its fields, used when building a new sheet's snapshot.
export async function getPresetWithFields(
  orgId: string,
  presetId: string,
): Promise<PresetWithFields | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("presets")
    .select("*, sales_categories(*), payment_methods(*)")
    .eq("org_id", orgId)
    .eq("id", presetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const row = data as Preset & {
    sales_categories: SalesCategory[];
    payment_methods: PaymentMethod[];
  };
  return {
    ...row,
    sales_categories: byOrder(row.sales_categories ?? []),
    payment_methods: byOrder(row.payment_methods ?? []),
  };
}
