"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/projects", label: "Projects" },
  { href: "/notes", label: "Notes" },
  { href: "/habits", label: "Habits" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function Nav({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-neutral-800 bg-neutral-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-1">
          {LINKS.map((link) => (
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
        </div>
        <div className="flex items-center gap-3">
          {email && <span className="hidden text-xs text-neutral-500 sm:inline">{email}</span>}
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
