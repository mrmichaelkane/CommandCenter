import { createClient } from "@/lib/supabase/server";
import type { Shift } from "@/lib/types";

export async function getShifts(orgId: string): Promise<Shift[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("org_id", orgId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Shift[];
}

// Resolves a shift name including archived shifts, so historical sheets whose
// shift was later removed still display correctly.
export async function getShiftName(orgId: string, id: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("shifts")
    .select("name")
    .eq("org_id", orgId)
    .eq("id", id)
    .maybeSingle();
  return (data?.name as string | undefined) ?? "Shift";
}
