import Link from "next/link";
import { formatISO } from "date-fns";
import { getTasks } from "@/lib/data/tasks";
import { getHabitsWithStatus } from "@/lib/data/habits";
import { TaskList } from "@/components/task-list";
import { HabitList } from "@/components/habit-list";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { PRIORITY_RANK } from "@/lib/types";

export default async function DashboardPage() {
  const [tasks, habits] = await Promise.all([getTasks(), getHabitsWithStatus()]);
  const today = formatISO(new Date(), { representation: "date" });

  const openTasks = tasks.filter((t) => !t.completed_at);
  const priorityTasks = [...openTasks]
    .sort((a, b) => {
      const aDue = a.due_date && a.due_date <= today ? 0 : 1;
      const bDue = b.due_date && b.due_date <= today ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      if (PRIORITY_RANK[a.priority] !== PRIORITY_RANK[b.priority]) {
        return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
      }
      return (a.due_date ?? "9999").localeCompare(b.due_date ?? "9999");
    })
    .slice(0, 8);

  const loggedToday = habits.filter((h) => h.loggedToday).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-neutral-50">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        {openTasks.length} open task{openTasks.length === 1 ? "" : "s"} · {loggedToday}/{habits.length} habits done today
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Priorities</CardTitle>
          <Link href="/tasks" className="text-xs font-medium text-neutral-500 hover:text-neutral-200">
            View all →
          </Link>
        </CardHeader>
        <TaskList tasks={priorityTasks} emptyLabel="Nothing due. Capture something above." />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Habits</CardTitle>
          <Link href="/habits" className="text-xs font-medium text-neutral-500 hover:text-neutral-200">
            Manage →
          </Link>
        </CardHeader>
        <HabitList habits={habits} />
      </Card>
    </div>
  );
}
