import { TaskItem } from "@/components/task-item";
import type { TaskWithProject } from "@/lib/types";

export function TaskList({
  tasks,
  emptyLabel = "Nothing here.",
}: {
  tasks: TaskWithProject[];
  emptyLabel?: string;
}) {
  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-600">{emptyLabel}</p>;
  }

  return (
    <div className="divide-y divide-neutral-800/60">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}
