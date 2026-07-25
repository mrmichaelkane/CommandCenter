"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

function revalidateMembers() {
  revalidatePath("/settings");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Count remaining active admins, used to protect against locking an org out.
async function activeAdminCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orgId: string,
) {
  const { count } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId)
    .eq("role", "admin")
    .eq("status", "active");
  return count ?? 0;
}

// Invites a member by email. The row is created immediately; if the email
// matches an existing account it's linked on that user's next sign-in
// (claim_memberships), otherwise it stays pending until they sign in.
export async function inviteMember(orgId: string, email: string, role: Role) {
  const value = email.trim().toLowerCase();
  if (!isValidEmail(value)) return { error: "Enter a valid email address." };
  if (role !== "admin" && role !== "manager") return { error: "Invalid role." };

  const supabase = await createClient();
  const { error } = await supabase.from("memberships").insert({
    org_id: orgId,
    email: value,
    role,
    status: "pending",
  });
  if (error) {
    if (error.code === "23505") return { error: "That email is already a member or invited." };
    return { error: error.message };
  }
  revalidateMembers();
  return { error: null };
}

export async function changeMemberRole(orgId: string, membershipId: string, role: Role) {
  if (role !== "admin" && role !== "manager") return { error: "Invalid role." };

  const supabase = await createClient();
  const { data: member } = await supabase
    .from("memberships")
    .select("role, status")
    .eq("id", membershipId)
    .maybeSingle();
  if (!member) return { error: "Member not found." };

  // Don't allow demoting the last remaining admin.
  if (member.role === "admin" && role !== "admin" && member.status === "active") {
    if ((await activeAdminCount(supabase, orgId)) <= 1) {
      return { error: "You can't demote the only admin. Promote someone else first." };
    }
  }

  const { error } = await supabase.from("memberships").update({ role }).eq("id", membershipId);
  if (error) return { error: error.message };
  revalidateMembers();
  return { error: null };
}

export async function removeMember(orgId: string, membershipId: string) {
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("memberships")
    .select("role, status")
    .eq("id", membershipId)
    .maybeSingle();
  if (!member) return { error: "Member not found." };

  if (member.role === "admin" && member.status === "active") {
    if ((await activeAdminCount(supabase, orgId)) <= 1) {
      return { error: "You can't remove the only admin." };
    }
  }

  const { error } = await supabase.from("memberships").delete().eq("id", membershipId);
  if (error) return { error: error.message };
  revalidateMembers();
  return { error: null };
}
