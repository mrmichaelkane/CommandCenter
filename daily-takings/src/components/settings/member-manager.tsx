"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Mail, Clock } from "lucide-react";
import { inviteMember, changeMemberRole, removeMember } from "@/lib/actions/members";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Membership, Role } from "@/lib/types";

export function MemberManager({
  orgId,
  members,
  currentEmail,
}: {
  orgId: string;
  members: Membership[];
  currentEmail: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("manager");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error: string | null }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      setError(res?.error ?? null);
      if (!res?.error) after?.();
      router.refresh();
    });

  const invite = () => {
    const value = email.trim();
    if (!value) return;
    run(() => inviteMember(orgId, value, role), () => setEmail(""));
  };

  return (
    <div className="max-w-2xl">
      <ul className="space-y-2">
        {members.map((m) => {
          const isSelf = currentEmail && m.email.toLowerCase() === currentEmail.toLowerCase();
          return (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5"
            >
              <div className="flex min-w-[12rem] flex-1 items-center gap-2">
                <span className="text-sm text-neutral-100">{m.email}</span>
                {isSelf && <span className="text-[11px] text-neutral-500">(you)</span>}
              </div>

              {m.status === "pending" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  <Clock className="h-3 w-3" /> Invited
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                  Active
                </span>
              )}

              <select
                value={m.role}
                disabled={pending}
                onChange={(e) => run(() => changeMemberRole(orgId, m.id, e.target.value as Role))}
                className="h-8 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
              </select>

              <button
                type="button"
                title="Remove member"
                disabled={pending}
                onClick={() => {
                  if (window.confirm(`Remove ${m.email}?`)) run(() => removeMember(orgId, m.id));
                }}
                className="text-neutral-500 hover:text-rose-400 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
        <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-200">
          <Mail className="h-4 w-4 text-neutral-500" /> Invite a team member
        </h4>
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[14rem] flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  invite();
                }
              }}
              placeholder="teammate@venue.com"
              className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-neutral-500"
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="h-10 rounded-lg border border-neutral-700 bg-neutral-950 px-2 text-sm text-neutral-100 outline-none focus:border-neutral-500"
          >
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <Button type="button" onClick={invite} disabled={pending || !email.trim()}>
            Send invite
          </Button>
        </div>
        <p className="mt-2 text-xs text-neutral-500">
          Managers can fill in and submit sheets. Admins can also configure the schema, shifts,
          presets, and members. The invite links to their account the first time they sign in with
          this email.
        </p>
        {error && <p className={cn("mt-2 text-xs", "text-rose-400")}>{error}</p>}
      </div>
    </div>
  );
}
