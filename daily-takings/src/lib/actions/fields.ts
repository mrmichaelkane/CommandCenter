"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateSchema() {
  revalidatePath("/settings");
}

// Look up a preset's org so inserts can't spoof org_id from the client.
async function presetOrg(supabase: Awaited<ReturnType<typeof createClient>>, presetId: string) {
  const { data } = await supabase.from("presets").select("org_id").eq("id", presetId).maybeSingle();
  return (data?.org_id as string | undefined) ?? null;
}

// --- Sales categories -----------------------------------------------------

export async function addSalesCategory(presetId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) return { error: "Label is required." };

  const supabase = await createClient();
  const orgId = await presetOrg(supabase, presetId);
  if (!orgId) return { error: "Preset not found." };

  const { error } = await supabase.from("sales_categories").insert({
    preset_id: presetId,
    org_id: orgId,
    label: trimmed,
    sort_order: Date.now(),
  });
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

export async function updateSalesCategory(
  id: string,
  input: { label?: string; has_note?: boolean },
) {
  const update: Record<string, unknown> = {};
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) return { error: "Label is required." };
    update.label = label;
  }
  if (input.has_note !== undefined) update.has_note = input.has_note;

  const supabase = await createClient();
  const { error } = await supabase.from("sales_categories").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

export async function deleteSalesCategory(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sales_categories").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

export async function reorderSalesCategories(presetId: string, orderedIds: string[]) {
  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("sales_categories")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("preset_id", presetId);
    if (error) return { error: error.message };
  }
  revalidateSchema();
  return { error: null };
}

// --- Payment methods ------------------------------------------------------

export async function addPaymentMethod(presetId: string, label: string) {
  const trimmed = label.trim();
  if (!trimmed) return { error: "Label is required." };

  const supabase = await createClient();
  const orgId = await presetOrg(supabase, presetId);
  if (!orgId) return { error: "Preset not found." };

  const { error } = await supabase.from("payment_methods").insert({
    preset_id: presetId,
    org_id: orgId,
    label: trimmed,
    sort_order: Date.now(),
  });
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

export async function updatePaymentMethod(
  id: string,
  input: { label?: string; has_reference?: boolean },
) {
  const update: Record<string, unknown> = {};
  if (input.label !== undefined) {
    const label = input.label.trim();
    if (!label) return { error: "Label is required." };
    update.label = label;
  }
  if (input.has_reference !== undefined) update.has_reference = input.has_reference;

  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").update(update).eq("id", id);
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

export async function deletePaymentMethod(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("payment_methods").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

export async function reorderPaymentMethods(presetId: string, orderedIds: string[]) {
  const supabase = await createClient();
  for (let i = 0; i < orderedIds.length; i++) {
    const { error } = await supabase
      .from("payment_methods")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("preset_id", presetId);
    if (error) return { error: error.message };
  }
  revalidateSchema();
  return { error: null };
}
