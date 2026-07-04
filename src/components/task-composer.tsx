"use client";

import { useRef, useState, useTransition } from "react";
import { createTask } from "@/lib/actions/tasks";
import { Button } from "@/components/ui/button";
import type { Priority } from "@/lib/types";

export function TaskComposer() {
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = formRef.current?.elements.namedItem("title") as HTMLInputElement | null;
        const title = input?.value.trim();
        if (!title) return;
        startTransition(async () => {
          await createTask({ title, priority, dueDate: dueDate || null });
          formRef.current?.reset();
          setPriority("medium");
          setDueDate("");
        });
      }}
    >
      <input
        name="title"
        placeholder="Add a task…"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value as Priority)}
        className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-sm text-neutral-300 focus:border-neutral-600 focus:outline-none"
      >
        <option value="high">High</option>
        <option value="medium">Medium</option>
        <option value="low">Low</option>
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="rounded-lg border border-neutral-800 bg-neutral-950 px-2 py-2 text-sm text-neutral-300 focus:border-neutral-600 focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        Add
      </Button>
    </form>
  );
}
