import { redirect } from "next/navigation";
import { getContext } from "@/lib/data/context";
import { Nav } from "@/components/nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getContext();

  if (!ctx) redirect("/login");
  if (!ctx.org) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-neutral-950">
      <Nav
        email={ctx.email}
        orgs={ctx.orgs}
        activeOrgId={ctx.org.id}
        role={ctx.role}
      />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
