import { getTasks } from "@/lib/data/tasks";
import { TaskList } from "@/components/task-list";
import { TaskComposer } from "@/components/task-composer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_RANK } from "@/lib/types";

export default async function TasksPage() {
  const tasks = await getTasks();
  const open = tasks
    .filter((t) => !t.completed_at)
    .sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
  const completed = tasks.filter((t) => t.completed_at);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-neutral-50">Tasks</h1>

      <Card className="mb-6">
        <TaskComposer />
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Open ({open.length})</CardTitle>
        </CardHeader>
        <TaskList tasks={open} emptyLabel="No open tasks. Add one above." />
      </Card>

      {completed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed ({completed.length})</CardTitle>
          </CardHeader>
          <TaskList tasks={completed} />
        </Card>
      )}
    </div>
  );
}
