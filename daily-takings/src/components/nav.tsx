"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import { Building2, ChevronDown } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { switchOrganization } from "@/lib/actions/org";
import { cn } from "@/lib/utils";
import type { Organization, Role } from "@/lib/types";

const LINKS = [
  { href: "/", label: "Today" },
  { href: "/sheets", label: "History" },
  { href: "/settings", label: "Settings", adminOnly: true },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav({
  email,
  orgs,
  activeOrgId,
  role,
}: {
  email: string | null;
  orgs: Organization[];
  activeOrgId: string;
  role: Role | null;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const activeOrg = orgs.find((o) => o.id === activeOrgId);

  const links = LINKS.filter((l) => !l.adminOnly || role === "admin");

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Org switcher */}
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-sm text-neutral-200">
              <Building2 className="h-4 w-4 text-neutral-500" />
              <span className="max-w-[10rem] truncate font-medium">
                {activeOrg?.name ?? "Venue"}
              </span>
              {orgs.length > 1 && <ChevronDown className="h-3.5 w-3.5 text-neutral-500" />}
            </div>
            {orgs.length > 1 && (
              <select
                aria-label="Switch venue"
                value={activeOrgId}
                disabled={pending}
                onChange={(e) =>
                  startTransition(async () => {
                    await switchOrganization(e.target.value);
                  })
                }
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <nav className="flex items-center gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  isActive(pathname, link.href)
                    ? "bg-neutral-800 text-neutral-50"
                    : "text-neutral-400 hover:text-neutral-100",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {role && (
            <span className="hidden rounded-full border border-neutral-800 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500 sm:inline">
              {role}
            </span>
          )}
          {email && (
            <span className="hidden max-w-[12rem] truncate text-xs text-neutral-500 md:inline">
              {email}
            </span>
          )}
          <form action={signOut}>
            <button className="text-xs font-medium text-neutral-500 hover:text-neutral-200">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
