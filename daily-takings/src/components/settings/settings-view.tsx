"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { PresetManager } from "@/components/settings/preset-manager";
import { ShiftManager } from "@/components/settings/shift-manager";
import { MemberManager } from "@/components/settings/member-manager";
import { VenueSettings } from "@/components/settings/venue-settings";
import type { Membership, Organization, PresetWithFields, Shift } from "@/lib/types";

type Tab = "schema" | "shifts" | "members" | "venue";

const TABS: { id: Tab; label: string }[] = [
  { id: "schema", label: "Presets & Fields" },
  { id: "shifts", label: "Shifts" },
  { id: "members", label: "Members" },
  { id: "venue", label: "Venue" },
];

export function SettingsView({
  org,
  presets,
  shifts,
  members,
  currentEmail,
}: {
  org: Organization;
  presets: PresetWithFields[];
  shifts: Shift[];
  members: Membership[];
  currentEmail: string | null;
}) {
  const [tab, setTab] = useState<Tab>("schema");

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-neutral-50">Settings</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Configure how your venue reconciles each day. Changes apply to future sheets —
          submitted sheets keep the schema they were created with.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition",
              tab === t.id
                ? "border-neutral-100 text-neutral-50"
                : "border-transparent text-neutral-500 hover:text-neutral-200",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "schema" && <PresetManager orgId={org.id} presets={presets} />}
      {tab === "shifts" && <ShiftManager orgId={org.id} shifts={shifts} presets={presets} />}
      {tab === "members" && (
        <MemberManager orgId={org.id} members={members} currentEmail={currentEmail} />
      )}
      {tab === "venue" && <VenueSettings org={org} />}
    </div>
  );
}
