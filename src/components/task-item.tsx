"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { setTaskComplete, setTaskPriority, deleteTask } from "@/lib/actions/tasks";
import { PriorityBadge } from "@/components/priority-badge";
import { ProjectKeyBadge } from "@/components/projects/project-key-badge";
import { cn } from "@/lib/utils";
import type { Priority, TaskWithProject } from "@/lib/types";

const PRIORITY_CYCLE: Record<Priority, Priority> = {
  high: "medium",
  medium: "low",
  low: "high",
};

export function TaskItem({ task }: { task: TaskWithProject }) {
  const [isPending, startTransition] = useTransition();
  const completed = Boolean(task.completed_at);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg px-2 py-2 transition",
        isPending && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label={completed ? "Mark incomplete" : "Mark complete"}
        onClick={() => startTransition(async () => void (await setTaskComplete(task.id, !completed)))}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
          completed
            ? "border-emerald-500 bg-emerald-500 text-neutral-950"
            : "border-neutral-600 hover:border-neutral-400",
        )}
      >
        {completed && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2 6.5 4.75 9 10 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className={cn("truncate text-sm text-neutral-100", completed && "text-neutral-500 line-through")}>
            {task.title}
          </p>
          {task.project && (
            <Link href={`/projects/${task.project.id}`} className="shrink-0 transition hover:brightness-125">
              <ProjectKeyBadge projectKey={task.project.key} color={task.project.color} />
            </Link>
          )}
        </div>
        {task.due_date && (
          <p className="text-xs text-neutral-500">
            Due {new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <PriorityBadge
        priority={task.priority}
        onClick={() =>
          startTransition(
            async () => void (await setTaskPriority(task.id, PRIORITY_CYCLE[task.priority])),
          )
        }
      />

      <button
        type="button"
        aria-label="Delete task"
        onClick={() => startTransition(async () => void (await deleteTask(task.id)))}
        className="shrink-0 rounded p-1 text-neutral-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
