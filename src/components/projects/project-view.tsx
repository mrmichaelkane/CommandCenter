"use client";

import { useMemo, useState, useTransition } from "react";
import { KanbanSquare, Rows3 } from "lucide-react";
import { moveTask } from "@/lib/actions/tasks";
import { BoardColumn } from "@/components/projects/board-column";
import { ProjectHeader } from "@/components/projects/project-header";
import { ProjectTaskRow } from "@/components/projects/project-task-row";
import { ColumnComposer } from "@/components/projects/column-composer";
import { cn } from "@/lib/utils";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  type Project,
  type Task,
  type TaskStatus,
} from "@/lib/types";

type View = "board" | "list";

export function ProjectView({
  project,
  tasks: serverTasks,
}: {
  project: Project;
  tasks: Task[];
}) {
  const [view, setView] = useState<View>("board");
  // Local copy so drags feel instant; re-synced whenever the server
  // revalidates and sends fresh props (state adjusted during render, per
  // https://react.dev/learn/you-might-not-need-an-effect).
  const [tasks, setTasks] = useState(serverTasks);
  const [prevServerTasks, setPrevServerTasks] = useState(serverTasks);
  if (prevServerTasks !== serverTasks) {
    setPrevServerTasks(serverTasks);
    setTasks(serverTasks);
  }
  const [, startTransition] = useTransition();

  const tasksByStatus = useMemo(() => {
    const grouped = new Map<TaskStatus, Task[]>(STATUS_ORDER.map((s) => [s, []]));
    for (const task of [...tasks].sort((a, b) => a.sort_order - b.sort_order)) {
      grouped.get(task.status)?.push(task);
    }
    return grouped;
  }, [tasks]);

  // index = insertion position among the column's currently rendered cards
  // (dragged card included if it's the same column).
  const handleMove = (taskId: string, status: TaskStatus, index: number) => {
    const column = tasksByStatus.get(status) ?? [];
    const draggedPos = column.findIndex((t) => t.id === taskId);
    const adjusted = draggedPos !== -1 && draggedPos < index ? index - 1 : index;
    const without = column.filter((t) => t.id !== taskId);
    if (draggedPos !== -1 && adjusted === draggedPos) return; // dropped where it already was

    const before = without[adjusted - 1];
    const after = without[adjusted];
    const sortOrder =
      before && after
        ? (before.sort_order + after.sort_order) / 2
        : before
          ? before.sort_order + 1
          : after
            ? after.sort_order - 1
            : Date.now() / 1000;

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              sort_order: sortOrder,
              completed_at:
                status === "done" ? (t.completed_at ?? new Date().toISOString()) : null,
            }
          : t,
      ),
    );
    startTransition(async () => void (await moveTask(taskId, { status, sortOrder })));
  };

  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <ProjectHeader project={project} doneCount={doneCount} totalCount={tasks.length} />

      <div className="mb-4 flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 p-0.5 text-xs font-medium w-fit">
        {(
          [
            { id: "board", label: "Board", icon: <KanbanSquare className="h-3.5 w-3.5" /> },
            { id: "list", label: "List", icon: <Rows3 className="h-3.5 w-3.5" /> },
          ] as const
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setView(option.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 transition",
              view === option.id
                ? "bg-neutral-800 text-neutral-50"
                : "text-neutral-500 hover:text-neutral-200",
            )}
          >
            {option.icon}
            {option.label}
          </button>
        ))}
      </div>

      {view === "board" ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATUS_ORDER.map((status) => (
            <BoardColumn
              key={status}
              status={status}
              projectId={project.id}
              tasks={tasksByStatus.get(status) ?? []}
              onMove={handleMove}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {STATUS_ORDER.map((status) => {
            const columnTasks = tasksByStatus.get(status) ?? [];
            return (
              <section key={status}>
                <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  {STATUS_LABELS[status]}
                  <span className="rounded-full bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">
                    {columnTasks.length}
                  </span>
                </h2>
                <div className="divide-y divide-neutral-800/60 rounded-xl border border-neutral-800 bg-neutral-900/40">
                  {columnTasks.length === 0 ? (
                    <p className="px-3 py-3 text-xs text-neutral-600">Nothing here.</p>
                  ) : (
                    columnTasks.map((task) => <ProjectTaskRow key={task.id} task={task} />)
                  )}
                  {status !== "done" && (
                    <div className="px-3 py-2">
                      <ColumnComposer projectId={project.id} status={status} variant="row" />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
