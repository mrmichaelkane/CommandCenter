"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Star, Trash2, Plus, Pencil } from "lucide-react";
import {
  createPreset,
  renamePreset,
  duplicatePreset,
  deletePreset,
  setDefaultPreset,
} from "@/lib/actions/presets";
import { FieldList } from "@/components/settings/field-list";
import { cn } from "@/lib/utils";
import type { PresetWithFields } from "@/lib/types";

export function PresetManager({
  orgId,
  presets,
}: {
  orgId: string;
  presets: PresetWithFields[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selectedId, setSelectedId] = useState<string | null>(presets[0]?.id ?? null);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const selected = presets.find((p) => p.id === selectedId) ?? presets[0] ?? null;

  const run = (fn: () => Promise<{ error: string | null }>, after?: () => void) =>
    startTransition(async () => {
      const res = await fn();
      setError(res?.error ?? null);
      if (!res?.error) after?.();
      router.refresh();
    });

  const addPreset = () => {
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    run(() => createPreset(orgId, name));
  };

  const rename = (id: string, current: string) => {
    const name = window.prompt("Rename preset", current);
    if (name === null) return;
    run(() => renamePreset(id, name));
  };

  return (
    <div className="grid gap-5 md:grid-cols-[220px_1fr]">
      {/* Preset list */}
      <div>
        <ul className="space-y-1">
          {presets.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelectedId(p.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition",
                  selected?.id === p.id
                    ? "bg-neutral-800 text-neutral-50"
                    : "text-neutral-300 hover:bg-neutral-900",
                )}
              >
                <span className="truncate">{p.name}</span>
                {p.is_default && (
                  <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                )}
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPreset();
              }
            }}
            placeholder="New preset…"
            className="h-9 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-neutral-500"
          />
          <button
            type="button"
            onClick={addPreset}
            disabled={pending || !newName.trim()}
            aria-label="Add preset"
            className="inline-flex h-9 items-center rounded-lg bg-neutral-800 px-2.5 text-neutral-100 hover:bg-neutral-700 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>

      {/* Selected preset editor */}
      {selected ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-neutral-100">{selected.name}</h3>
              {selected.is_default && (
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">
                  Default
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                title="Rename"
                onClick={() => rename(selected.id, selected.name)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Pencil className="h-3.5 w-3.5" /> Rename
              </button>
              {!selected.is_default && (
                <button
                  type="button"
                  title="Set as default"
                  onClick={() => run(() => setDefaultPreset(orgId, selected.id))}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                >
                  <Star className="h-3.5 w-3.5" /> Default
                </button>
              )}
              <button
                type="button"
                title="Duplicate"
                onClick={() => run(() => duplicatePreset(selected.id))}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
              >
                <Copy className="h-3.5 w-3.5" /> Duplicate
              </button>
              <button
                type="button"
                title="Delete"
                onClick={() => {
                  if (window.confirm(`Delete preset "${selected.name}"?`))
                    run(() => deletePreset(orgId, selected.id), () => setSelectedId(null));
                }}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs text-neutral-400 hover:bg-rose-950 hover:text-rose-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Sales categories
              </h4>
              <FieldList kind="sales" presetId={selected.id} items={selected.sales_categories} />
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Payment methods
              </h4>
              <FieldList kind="payment" presetId={selected.id} items={selected.payment_methods} />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center rounded-xl border border-dashed border-neutral-800 p-8 text-sm text-neutral-600">
          Create a preset to start defining fields.
        </div>
      )}
    </div>
  );
}
