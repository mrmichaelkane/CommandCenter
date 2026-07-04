"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask, moveTask, setTaskPriority } from "@/lib/actions/tasks";
import { PriorityBadge } from "@/components/priority-badge";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Priority,
  type Task,
  type TaskStatus,
} from "@/lib/types";

const PRIORITY_CYCLE: Record<Priority, Priority> = {
  high: "medium",
  medium: "low",
  low: "high",
};

export function ProjectTaskRow({ task }: { task: Task }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2 transition",
        isPending && "opacity-60",
      )}
    >
      <select
        value={task.status}
        aria-label="Status"
        onChange={(e) =>
          startTransition(
            async () => void (await moveTask(task.id, { status: e.target.value as TaskStatus })),
          )
        }
        className="shrink-0 rounded-md border border-neutral-800 bg-neutral-950 px-1.5 py-1 text-[11px] text-neutral-400 focus:border-neutral-600 focus:outline-none"
      >
        {STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {STATUS_LABELS[status]}
          </option>
        ))}
      </select>

      <p
        className={cn(
          "min-w-0 flex-1 truncate text-sm text-neutral-100",
          task.status === "done" && "text-neutral-500 line-through",
        )}
      >
        {task.title}
      </p>

      {task.due_date && (
        <span className="hidden shrink-0 text-xs text-neutral-500 sm:inline">
          {new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      )}

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
