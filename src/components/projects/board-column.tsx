"use client";

import { useState, type DragEvent } from "react";
import { BoardCard } from "@/components/projects/board-card";
import { ColumnComposer } from "@/components/projects/column-composer";
import { cn } from "@/lib/utils";
import { STATUS_LABELS, type Task, type TaskStatus } from "@/lib/types";

const STATUS_DOT: Record<TaskStatus, string> = {
  backlog: "bg-neutral-500",
  todo: "bg-blue-400",
  in_progress: "bg-amber-400",
  done: "bg-emerald-400",
};

export function BoardColumn({
  status,
  projectId,
  tasks,
  onMove,
}: {
  status: TaskStatus;
  projectId: string;
  tasks: Task[];
  onMove: (taskId: string, status: TaskStatus, index: number) => void;
}) {
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleCardDragOver = (index: number) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setOverIndex(e.clientY < midpoint ? index : index + 1);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOverIndex((current) => current ?? tasks.length);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOverIndex(null);
      }}
      onDrop={(e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData("text/plain");
        if (taskId) onMove(taskId, status, overIndex ?? tasks.length);
        setOverIndex(null);
      }}
      className={cn(
        "flex min-h-[16rem] flex-col rounded-xl border border-neutral-800 bg-neutral-900/40 p-2 transition",
        overIndex !== null && "border-neutral-600 bg-neutral-900/80",
      )}
    >
      <div className="mb-2 flex items-center gap-2 px-1.5 pt-1">
        <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} />
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
          {STATUS_LABELS[status]}
        </span>
        <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {tasks.map((task, index) => (
          <div key={task.id} onDragOver={handleCardDragOver(index)}>
            {overIndex === index && <DropIndicator />}
            <BoardCard task={task} />
          </div>
        ))}
        {overIndex === tasks.length && <DropIndicator />}
        <ColumnComposer projectId={projectId} status={status} variant="card" />
      </div>
    </div>
  );
}

function DropIndicator() {
  return <div className="my-0.5 h-0.5 rounded-full bg-violet-400" />;
}
