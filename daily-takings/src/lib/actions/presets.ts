"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function revalidateSchema() {
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}

export async function createPreset(orgId: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Preset name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("presets").insert({
    org_id: orgId,
    name: trimmed,
    sort_order: Date.now(),
  });
  if (error) {
    if (error.code === "23505") return { error: `A preset named "${trimmed}" already exists.` };
    return { error: error.message };
  }
  revalidateSchema();
  return { error: null };
}

export async function renamePreset(id: string, name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Preset name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("presets").update({ name: trimmed }).eq("id", id);
  if (error) {
    if (error.code === "23505") return { error: `A preset named "${trimmed}" already exists.` };
    return { error: error.message };
  }
  revalidateSchema();
  return { error: null };
}

// Copies a preset and all of its fields into a new "… copy" preset.
export async function duplicatePreset(id: string) {
  const supabase = await createClient();

  const { data: source, error: srcErr } = await supabase
    .from("presets")
    .select("*, sales_categories(*), payment_methods(*)")
    .eq("id", id)
    .single();
  if (srcErr || !source) return { error: srcErr?.message ?? "Preset not found." };

  const orgId = source.org_id as string;
  const baseName = `${source.name} copy`;

  const { data: created, error: insErr } = await supabase
    .from("presets")
    .insert({ org_id: orgId, name: baseName, sort_order: Date.now() })
    .select("id")
    .single();
  if (insErr || !created) {
    if (insErr?.code === "23505") return { error: `A preset named "${baseName}" already exists.` };
    return { error: insErr?.message ?? "Could not duplicate preset." };
  }

  const newId = created.id as string;
  const sales = (source.sales_categories ?? []) as Array<{
    label: string;
    has_note: boolean;
    sort_order: number;
  }>;
  const payments = (source.payment_methods ?? []) as Array<{
    label: string;
    has_reference: boolean;
    sort_order: number;
  }>;

  if (sales.length) {
    await supabase.from("sales_categories").insert(
      sales.map((s) => ({
        preset_id: newId,
        org_id: orgId,
        label: s.label,
        has_note: s.has_note,
        sort_order: s.sort_order,
      })),
    );
  }
  if (payments.length) {
    await supabase.from("payment_methods").insert(
      payments.map((p) => ({
        preset_id: newId,
        org_id: orgId,
        label: p.label,
        has_reference: p.has_reference,
        sort_order: p.sort_order,
      })),
    );
  }

  revalidateSchema();
  return { error: null };
}

export async function setDefaultPreset(orgId: string, id: string) {
  const supabase = await createClient();
  const { error: clearErr } = await supabase
    .from("presets")
    .update({ is_default: false })
    .eq("org_id", orgId)
    .neq("id", id);
  if (clearErr) return { error: clearErr.message };

  const { error } = await supabase.from("presets").update({ is_default: true }).eq("id", id);
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}

// Archives a preset (soft delete, so historical sheets keep their reference).
// Blocks deleting the org's only remaining active preset.
export async function deletePreset(orgId: string, id: string) {
  const supabase = await createClient();

  const { count } = await supabase
    .from("presets")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .is("archived_at", null);
  if ((count ?? 0) <= 1) {
    return { error: "You need at least one preset. Create another before deleting this one." };
  }

  // Detach it from any shift defaults first.
  await supabase.from("shifts").update({ default_preset_id: null }).eq("default_preset_id", id);

  const { error } = await supabase
    .from("presets")
    .update({ archived_at: new Date().toISOString(), is_default: false })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidateSchema();
  return { error: null };
}
