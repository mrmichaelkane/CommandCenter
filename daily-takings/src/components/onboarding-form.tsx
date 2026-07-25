"use client";

import { useState, useTransition } from "react";
import { createOrganization } from "@/lib/actions/org";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function OnboardingForm() {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("NZD");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Venue name is required.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await createOrganization({ name, currency });
      if (res?.error) setError(res.error);
      // On success the action redirects to "/".
    });
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6"
    >
      <div className="mb-4">
        <Label htmlFor="venue-name">Venue name</Label>
        <Input
          id="venue-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. The Harbour Café"
          autoFocus
        />
      </div>
      <div className="mb-6">
        <Label htmlFor="venue-currency">Currency</Label>
        <select
          id="venue-currency"
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
      </div>
      {error && <p className="mb-4 text-sm text-rose-400">{error}</p>}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create venue"}
      </Button>
    </form>
  );
}
