"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ORG_COOKIE } from "@/lib/data/context";
import { isSupportedCurrency } from "@/lib/currency";

async function setActiveOrgCookie(orgId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ORG_COOKIE, orgId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}

// Creates the org + the caller's admin membership (via SECURITY DEFINER rpc),
// seeds a usable starter schema, sets it active, and lands on the dashboard.
export async function createOrganization(input: { name: string; currency?: string }) {
  const name = input.name.trim();
  if (!name) return { error: "Venue name is required." };
  const currency = (input.currency || "NZD").toUpperCase();

  const supabase = await createClient();
  const { data: orgId, error } = await supabase.rpc("create_organization", {
    p_name: name,
    p_currency: currency,
  });
  if (error) return { error: error.message };

  await seedStarterSchema(orgId as string);
  await setActiveOrgCookie(orgId as string);

  revalidatePath("/", "layout");
  redirect("/");
}

// A brand-new org gets a Default preset with common café-style fields plus one
// example shift, so the operator can create a sheet immediately and then tailor
// everything in Settings.
async function seedStarterSchema(orgId: string) {
  const supabase = await createClient();

  const { data: preset, error: presetError } = await supabase
    .from("presets")
    .insert({ org_id: orgId, name: "Default", is_default: true, sort_order: 0 })
    .select("id")
    .single();
  if (presetError || !preset) return;

  const presetId = preset.id as string;

  await supabase.from("sales_categories").insert(
    ["Dine-In", "Takeaway"].map((label, i) => ({
      preset_id: presetId,
      org_id: orgId,
      label,
      sort_order: i,
    })),
  );

  await supabase.from("payment_methods").insert(
    ["Cash", "Eftpos"].map((label, i) => ({
      preset_id: presetId,
      org_id: orgId,
      label,
      has_reference: label === "Eftpos",
      sort_order: i,
    })),
  );

  await supabase.from("shifts").insert({
    org_id: orgId,
    name: "All Day",
    sort_order: 0,
    default_preset_id: presetId,
  });
}

export async function switchOrganization(orgId: string) {
  await setActiveOrgCookie(orgId);
  revalidatePath("/", "layout");
  return { error: null };
}

export async function updateOrganization(
  orgId: string,
  input: { name?: string; currency?: string },
) {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "Venue name is required." };
    update.name = name;
  }
  if (input.currency !== undefined) {
    const currency = input.currency.toUpperCase();
    if (!isSupportedCurrency(currency)) return { error: "Unsupported currency." };
    update.currency = currency;
  }

  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(update).eq("id", orgId);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  revalidatePath("/settings");
  return { error: null };
}
