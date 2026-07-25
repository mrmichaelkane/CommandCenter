import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Organization, Role } from "@/lib/types";

export const ORG_COOKIE = "dts_org";

export interface AppContext {
  userId: string;
  email: string | null;
  orgs: Organization[];
  org: Organization | null;
  role: Role | null;
}

// Resolves the signed-in user, their organizations, and the active org (from
// the dts_org cookie, falling back to the first). Also claims any pending
// invites addressed to this user's email. Returns null when unauthenticated.
export async function getContext(): Promise<AppContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Best-effort: link pending invites to this account on first load.
  await supabase.rpc("claim_memberships");

  const { data: rows } = await supabase
    .from("memberships")
    .select("org_id, role, organizations(*)")
    .eq("user_id", user.id)
    .eq("status", "active");

  const memberships = rows ?? [];
  const orgs: Organization[] = memberships
    .map((r) => r.organizations as unknown as Organization)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (orgs.length === 0) {
    return { userId: user.id, email: user.email ?? null, orgs: [], org: null, role: null };
  }

  const cookieStore = await cookies();
  const wanted = cookieStore.get(ORG_COOKIE)?.value;
  const org = orgs.find((o) => o.id === wanted) ?? orgs[0];
  const role = (memberships.find((r) => r.org_id === org.id)?.role ?? null) as Role | null;

  return { userId: user.id, email: user.email ?? null, orgs, org, role };
}

// Convenience for pages that require an active org + role. Redirects (rather
// than throwing) so unauthenticated / no-org requests resolve cleanly even if a
// page renders concurrently with the layout's own guard.
export async function requireContext(): Promise<AppContext & { org: Organization; role: Role }> {
  const ctx = await getContext();
  if (!ctx) redirect("/login");
  if (!ctx.org || !ctx.role) redirect("/onboarding");
  return ctx as AppContext & { org: Organization; role: Role };
}
