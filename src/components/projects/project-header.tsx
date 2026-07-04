"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteProject, updateProject } from "@/lib/actions/projects";
import { ProjectKeyBadge } from "@/components/projects/project-key-badge";
import { COLOR_DOT } from "@/components/projects/project-colors";
import { cn } from "@/lib/utils";
import { PROJECT_COLORS, type Project } from "@/lib/types";

export function ProjectHeader({
  project,
  doneCount,
  totalCount,
}: {
  project: Project;
  doneCount: number;
  totalCount: number;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(project.name);
  const [editingDescription, setEditingDescription] = useState(false);
  const [description, setDescription] = useState(project.description ?? "");
  const [, startTransition] = useTransition();

  const saveName = () => {
    setEditingName(false);
    const trimmed = name.trim();
    if (!trimmed || trimmed === project.name) {
      setName(project.name);
      return;
    }
    startTransition(async () => void (await updateProject(project.id, { name: trimmed })));
  };

  const saveDescription = () => {
    setEditingDescription(false);
    if (description.trim() === (project.description ?? "")) return;
    startTransition(
      async () => void (await updateProject(project.id, { description: description.trim() })),
    );
  };

  const cycleColor = () => {
    const next =
      PROJECT_COLORS[(PROJECT_COLORS.indexOf(project.color) + 1) % PROJECT_COLORS.length];
    startTransition(async () => void (await updateProject(project.id, { color: next })));
  };

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          title="Change colour"
          aria-label="Change project colour"
          onClick={cycleColor}
          className={cn(
            "h-3 w-3 shrink-0 rounded-full transition hover:scale-125",
            COLOR_DOT[project.color],
          )}
        />
        {editingName ? (
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(project.name);
                setEditingName(false);
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-xl font-semibold text-neutral-50 focus:outline-none"
          />
        ) : (
          <h1 className="min-w-0 truncate text-xl font-semibold text-neutral-50">
            {project.name}
          </h1>
        )}
        <ProjectKeyBadge projectKey={project.key} color={project.color} />
        <span className="hidden text-xs text-neutral-500 sm:inline">
          {doneCount}/{totalCount} done
        </span>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Rename project"
            onClick={() => setEditingName(true)}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Delete project"
            onClick={() => {
              if (!confirm(`Delete "${project.name}" and all of its tasks?`)) return;
              startTransition(async () => void (await deleteProject(project.id)));
            }}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {editingDescription ? (
        <textarea
          autoFocus
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={saveDescription}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDescription(project.description ?? "");
              setEditingDescription(false);
            }
          }}
          rows={2}
          className="mt-2 w-full resize-none rounded-lg border border-neutral-800 bg-neutral-950 px-2.5 py-1.5 text-sm text-neutral-300 focus:border-neutral-600 focus:outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditingDescription(true)}
          className="mt-1.5 block text-left text-sm text-neutral-500 transition hover:text-neutral-300"
        >
          {project.description || "Add a description…"}
        </button>
      )}
    </div>
  );
}
