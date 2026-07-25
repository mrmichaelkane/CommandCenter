import { createClient } from "@/lib/supabase/server";
import type { Membership } from "@/lib/types";

export async function getMembers(orgId: string): Promise<Membership[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .eq("org_id", orgId)
    .order("role", { ascending: true })
    .order("email", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Membership[];
}
