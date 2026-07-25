"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import {
  addSalesCategory,
  updateSalesCategory,
  deleteSalesCategory,
  reorderSalesCategories,
  addPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  reorderPaymentMethods,
} from "@/lib/actions/fields";
import { cn } from "@/lib/utils";

type Kind = "sales" | "payment";

interface FieldItem {
  id: string;
  label: string;
  has_note?: boolean;
  has_reference?: boolean;
}

export function FieldList({
  kind,
  presetId,
  items,
}: {
  kind: Kind;
  presetId: string;
  items: FieldItem[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const toggleTitle = kind === "sales" ? "Note field" : "Reference field";

  const run = (fn: () => Promise<{ error: string | null }>) =>
    startTransition(async () => {
      const res = await fn();
      setError(res?.error ?? null);
      router.refresh();
    });

  const doAdd = (label: string) =>
    kind === "sales" ? addSalesCategory(presetId, label) : addPaymentMethod(presetId, label);
  const doUpdateLabel = (id: string, label: string) =>
    kind === "sales" ? updateSalesCategory(id, { label }) : updatePaymentMethod(id, { label });
  const doToggle = (id: string, value: boolean) =>
    kind === "sales"
      ? updateSalesCategory(id, { has_note: value })
      : updatePaymentMethod(id, { has_reference: value });
  const doRemove = (id: string) =>
    kind === "sales" ? deleteSalesCategory(id) : deletePaymentMethod(id);
  const doReorder = (ids: string[]) =>
    kind === "sales" ? reorderSalesCategories(presetId, ids) : reorderPaymentMethods(presetId, ids);

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    run(() => doReorder(next.map((i) => i.id)));
  };

  const add = () => {
    const label = newLabel.trim();
    if (!label) return;
    setNewLabel("");
    run(() => doAdd(label));
  };

  return (
    <div>
      <ul className="space-y-1.5">
        {items.length === 0 && (
          <li className="rounded-lg border border-dashed border-neutral-800 px-3 py-3 text-center text-xs text-neutral-600">
            No fields yet — add one below.
          </li>
        )}
        {items.map((item, index) => {
          const toggled = kind === "sales" ? !!item.has_note : !!item.has_reference;
          return (
            <li
              key={item.id}
              className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-1.5"
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
                  disabled={index === items.length - 1 || pending}
                  onClick={() => move(index, 1)}
                  className="text-neutral-600 hover:text-neutral-300 disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <input
                key={item.label}
                defaultValue={item.label}
                disabled={pending}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== item.label) run(() => doUpdateLabel(item.id, value));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="h-8 flex-1 rounded-md border border-transparent bg-transparent px-2 text-sm text-neutral-100 outline-none hover:border-neutral-800 focus:border-neutral-600"
              />

              <label
                title={`${toggleTitle} — adds an optional ${
                  kind === "sales" ? "note" : "reference"
                } input on the sheet`}
                className={cn(
                  "flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium",
                  toggled ? "text-neutral-200" : "text-neutral-600",
                )}
              >
                <input
                  type="checkbox"
                  checked={toggled}
                  disabled={pending}
                  onChange={(e) => run(() => doToggle(item.id, e.target.checked))}
                  className="accent-emerald-500"
                />
                {kind === "sales" ? "Note" : "Ref"}
              </label>

              <button
                type="button"
                aria-label="Remove field"
                disabled={pending}
                onClick={() => run(() => doRemove(item.id))}
                className="text-neutral-600 hover:text-rose-400 disabled:opacity-30"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2 flex items-center gap-2">
        <input
          value={newLabel}
          disabled={pending}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={kind === "sales" ? "Add sales category…" : "Add payment method…"}
          className="h-9 flex-1 rounded-lg border border-neutral-700 bg-neutral-950 px-3 text-sm text-neutral-100 placeholder:text-neutral-600 outline-none focus:border-neutral-500"
        />
        <button
          type="button"
          onClick={add}
          disabled={pending || !newLabel.trim()}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-neutral-800 px-3 text-sm font-medium text-neutral-100 hover:bg-neutral-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
    </div>
  );
}
