"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/actions/tasks";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export function ColumnComposer({
  projectId,
  status,
  variant,
}: {
  projectId: string;
  status: TaskStatus;
  variant: "card" | "row";
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1 rounded-lg text-xs text-neutral-600 transition hover:text-neutral-300",
          variant === "card" && "mt-1 px-1.5 py-1.5 hover:bg-neutral-800/60",
        )}
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    );
  }

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setOpen(false);
      return;
    }
    startTransition(async () => {
      await createTask({ title: trimmed, projectId, status });
      setTitle("");
    });
  };

  return (
    <input
      autoFocus
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      onBlur={() => {
        if (!title.trim()) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") submit();
        if (e.key === "Escape") {
          setTitle("");
          setOpen(false);
        }
      }}
      placeholder="Task title, Enter to add…"
      disabled={isPending}
      className={cn(
        "w-full rounded-lg border border-neutral-700 bg-neutral-950 px-2.5 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-500 focus:outline-none disabled:opacity-60",
        variant === "card" && "mt-1",
      )}
    />
  );
}
