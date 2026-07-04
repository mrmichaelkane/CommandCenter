"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteTask, setTaskPriority } from "@/lib/actions/tasks";
import { PriorityBadge } from "@/components/priority-badge";
import { cn } from "@/lib/utils";
import type { Priority, Task } from "@/lib/types";

const PRIORITY_CYCLE: Record<Priority, Priority> = {
  high: "medium",
  medium: "low",
  low: "high",
};

export function BoardCard({ task }: { task: Task }) {
  const [dragging, setDragging] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", task.id);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        "group cursor-grab rounded-lg border border-neutral-800 bg-neutral-900 p-2.5 shadow-sm transition active:cursor-grabbing",
        "hover:border-neutral-700",
        dragging && "opacity-40",
        isPending && "opacity-60",
      )}
    >
      <p
        className={cn(
          "mb-2 text-sm leading-snug text-neutral-100",
          task.status === "done" && "text-neutral-500 line-through",
        )}
      >
        {task.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        <PriorityBadge
          priority={task.priority}
          onClick={() =>
            startTransition(
              async () => void (await setTaskPriority(task.id, PRIORITY_CYCLE[task.priority])),
            )
          }
        />
        <div className="flex items-center gap-1.5">
          {task.due_date && (
            <span className="text-[11px] text-neutral-500">
              {new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
          <button
            type="button"
            aria-label="Delete task"
            onClick={() => startTransition(async () => void (await deleteTask(task.id)))}
            className="rounded p-0.5 text-neutral-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
