"use client";

import { useRef, useTransition } from "react";
import { createHabit } from "@/lib/actions/habits";
import { Button } from "@/components/ui/button";

export function HabitComposer() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className="flex items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const input = formRef.current?.elements.namedItem("name") as HTMLInputElement | null;
        const name = input?.value.trim();
        if (!name) return;
        startTransition(async () => {
          await createHabit(name);
          formRef.current?.reset();
        });
      }}
    >
      <input
        name="name"
        placeholder="Add a habit…"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={isPending}>
        Add
      </Button>
    </form>
  );
}
