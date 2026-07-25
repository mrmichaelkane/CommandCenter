"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateShifts() {
  revalidatePath("/settings");
  revalidatePath("/");
}

export async function createShift(
  orgId: string,
  name: string,
  defaultPresetId?: string | null,
) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Shift name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").insert({
    org_id: orgId,
    name: trimmed,
    default_preset_id: defaultPresetId || null,
    sort_order: Date.now(),
  });
  if (error) {
    if (error.code === "23505") return { error: `A shift named "${trimmed}" already exists.` };
    return { error: error.message };
  }
  revalidateShifts();
  return { error: null };
}

export async function updateShift(
  id: string,
  input: { name?: string; default_preset_id?: string | null },
) {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "Shift name is required." };
    update.name = name;
  }
  if (input.default_preset_id !== undefined) {
    update.default_preset_id = input.default_preset_id || null;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("shifts").update(update).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: "A shift with that name already exists." };
    return { error: error.message };
  }
  revalidateShifts();
  return { error: null };
}

export async function reorderShifts(orgId: string, orderedIds: string[]) {
  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("shifts")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("org_id", orgId);
    if (error) return { error: error.message };
  }
  revalidateShifts();
  return { error: null };
}

// Archives a shift (soft delete) so its historical sheets keep a resolvable
// name. Blocks removing the last active shift.
export async function deleteShift(orgId: string, id: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("shifts")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .is("archived_at", null);
  if ((count ?? 0) <= 1) {
    return { error: "You need at least one shift. Create another before removing this one." };
  }

  const { error } = await supabase
    .from("shifts")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateShifts();
  return { error: null };
}
