"use client";

import { useState, useTransition } from "react";
import { createProject } from "@/lib/actions/projects";
import { Button } from "@/components/ui/button";
import { COLOR_DOT } from "@/components/projects/project-colors";
import { PROJECT_COLORS, type ProjectColor } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectComposer() {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [color, setColor] = useState<ProjectColor>("violet");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setError(null);
        startTransition(async () => {
          const result = await createProject({
            name,
            key: key || undefined,
            color,
          });
          // createProject redirects on success, so a return value means failure.
          if (result?.error) setError(result.error);
        });
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New project name…"
        autoComplete="off"
        className="min-w-0 flex-1 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-neutral-600 focus:outline-none"
      />
      <input
        value={key}
        onChange={(e) => setKey(e.target.value.toUpperCase().slice(0, 5))}
        placeholder="KEY"
        autoComplete="off"
        className="w-20 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 font-mono text-sm uppercase text-neutral-300 placeholder:text-neutral-700 focus:border-neutral-600 focus:outline-none"
      />
      <div className="flex items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-2.5">
        {PROJECT_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Colour ${c}`}
            onClick={() => setColor(c)}
            className={cn(
              "h-4 w-4 rounded-full transition",
              COLOR_DOT[c],
              color === c
                ? "ring-2 ring-neutral-100 ring-offset-2 ring-offset-neutral-950"
                : "opacity-50 hover:opacity-100",
            )}
          />
        ))}
      </div>
      <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
        Create
      </Button>
      {error && <p className="w-full text-xs text-red-400">{error}</p>}
    </form>
  );
}
