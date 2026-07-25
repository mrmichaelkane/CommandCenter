import { redirect } from "next/navigation";
import { requireContext } from "@/lib/data/context";
import { getPresetsWithFields } from "@/lib/data/presets";
import { getShifts } from "@/lib/data/shifts";
import { getMembers } from "@/lib/data/members";
import { SettingsView } from "@/components/settings/settings-view";

export default async function SettingsPage() {
  const ctx = await requireContext();
  // Admin-only area. Managers can fill in sheets but not touch configuration.
  if (ctx.role !== "admin") redirect("/");

  const [presets, shifts, members] = await Promise.all([
    getPresetsWithFields(ctx.org.id),
    getShifts(ctx.org.id),
    getMembers(ctx.org.id),
  ]);

  return (
    <SettingsView
      org={ctx.org}
      presets={presets}
      shifts={shifts}
      members={members}
      currentEmail={ctx.email}
    />
  );
}
