"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/lib/actions/org";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Organization } from "@/lib/types";

export function VenueSettings({ org }: { org: Organization }) {
  const router = useRouter();
  const [name, setName] = useState(org.name);
  const [currency, setCurrency] = useState(org.currency);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error: boolean; text: string } | null>(null);

  const save = () => {
    startTransition(async () => {
      const res = await updateOrganization(org.id, { name, currency });
      if (res?.error) setMessage({ error: true, text: res.error });
      else setMessage({ error: false, text: "Saved." });
      router.refresh();
    });
  };

  const dirty = name.trim() !== org.name || currency !== org.currency;

  return (
    <div className="max-w-md">
      <div className="mb-4">
        <Label htmlFor="org-name">Venue name</Label>
        <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mb-5">
        <Label htmlFor="org-currency">Currency</Label>
        <select
          id="org-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-10 w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 outline-none focus:border-neutral-500"
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-neutral-500">
          Applies to new figures. Existing sheets keep the amounts already entered.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Button type="button" onClick={save} disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        {message && (
          <span className={message.error ? "text-xs text-rose-400" : "text-xs text-emerald-400"}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
