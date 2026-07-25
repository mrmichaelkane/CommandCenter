"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Trash2, Plus, Pencil } from "lucide-react";
import {
  createShift,
  updateShift,
  reorderShifts,
  deleteShift,
} from "@/lib/actions/shifts";
import type { Preset, Shift } from "@/lib/types";

export function ShiftManager({
  orgId,
  shifts,
  presets,
}: {
  orgId: string;
  shifts: Shift[];
  presets: Preset[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ error: string | null }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res?.error ?? null);
      router.refresh();
    });

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    setNewName("");
    run(() => createShift(orgId, name, presets.find((p) => p.is_default)?.id ?? null));
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= shifts.length) return;
    const next = [...shifts];
    [next[index], next[target]] = [next[target], next[index]];
    run(() => reorderShifts(orgId, next.map((s) => s.id)));
  };

  const rename = (s: Shift) => {
    const name = window.prompt("Rename shift", s.name);
    if (name === null) return;
    run(() => updateShift(s.id, { name }));
  };

  return (
    <div className="max-w-2xl">
      <ul className="space-y-2">
        {shifts.map((s, index) => (
          <li
            key={s.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5"
          >
            <div className="flex flex-col">
              <button
                type="button"
                aria-label="Move up"
                disabled={index === 0 || pending}
                onClick={() => move(index, -1)}
                className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30"
              >
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="Move down"
                disabled={index === shifts.length - 1 || pending}
                onClick={() => move(index, 1)}
                className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30"
              >
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>

            <span className="min-w-[7rem] flex-1 text-sm font-medium text-neutral-100">
              {s.name}
            </span>

            <label className="flex items-center gap-2 text-xs text-neutral-500">
              Default preset
              <select
                value={s.default_preset_id ?? ""}
                disabled={pending}
                onChange={(e) =>
                  run(() => updateShift(s.id, { default_preset_id: e.target.value || null }))
                }
                className="h-8 rounded-md border border-neutral-700 bg-neutral-950 px-2 text-xs text-neutral-100 outline-none focus:border-neutral-500"
              >
                <option value="">None</option>
                {presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              title="Rename"
              onClick={() => rename(s)}
              className="text-neutral-500 hover:text-neutral-200"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="Remove"
              disabled={pending}
              onClick={() => {
                if (window.confirm(`Remove shift "${s.name}"?`)) run(() => deleteShift(orgId, s.id));
              }}
              className="text-neutral-500 hover:text-rose-400 disabled:opacity-30"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Add a shift (e.g. Breakfast, Lunch, Dinner)…"
          className="h-10 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-neutral-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !newName.trim()}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-neutral-800 px-4 text-sm font-medium text-neutral-100 hover:bg-neutral-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add shift
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
