import Link from "next/link";
import { formatDistanceToNow, formatISO } from "date-fns";
import { getTasks } from "@/lib/data/tasks";
import { getHabitsWithStatus } from "@/lib/data/habits";
import { getProjects } from "@/lib/data/projects";
import { getNotes } from "@/lib/data/notes";
import { TaskList } from "@/components/task-list";
import { HabitList } from "@/components/habit-list";
import { ProjectKeyBadge } from "@/components/projects/project-key-badge";
import { COLOR_BAR, COLOR_DOT } from "@/components/projects/project-colors";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PRIORITY_RANK } from "@/lib/types";

export default async function DashboardPage() {
  const [tasks, habits, projects, notes] = await Promise.all([
    getTasks(),
    getHabitsWithStatus(),
    getProjects(),
    getNotes(),
  ]);
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
  const recentNotes = notes.slice(0, 5);
  const topProjects = projects.slice(0, 5);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-1 text-xl font-semibold text-neutral-50">
        {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
      </h1>
      <p className="mb-6 text-sm text-neutral-500">
        {openTasks.length} open task{openTasks.length === 1 ? "" : "s"} · {loggedToday}/{habits.length} habits done today ·{" "}
        {projects.length} project{projects.length === 1 ? "" : "s"} · {notes.length} note{notes.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
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

        <Card>
          <CardHeader>
            <CardTitle>Projects</CardTitle>
            <Link href="/projects" className="text-xs font-medium text-neutral-500 hover:text-neutral-200">
              View all →
            </Link>
          </CardHeader>
          {topProjects.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-600">
              No projects yet. Create one to track work Jira-style.
            </p>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {topProjects.map((project) => {
                const progress =
                  project.totalCount === 0
                    ? 0
                    : Math.round((project.doneCount / project.totalCount) * 100);
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-neutral-800/40"
                  >
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", COLOR_DOT[project.color])} />
                    <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">
                      {project.name}
                    </span>
                    <ProjectKeyBadge projectKey={project.key} color={project.color} />
                    <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-neutral-800 sm:block">
                      <div
                        className={cn("h-full rounded-full", COLOR_BAR[project.color])}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs text-neutral-500">
                      {project.doneCount}/{project.totalCount}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent notes</CardTitle>
            <Link href="/notes" className="text-xs font-medium text-neutral-500 hover:text-neutral-200">
              View all →
            </Link>
          </CardHeader>
          {recentNotes.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-600">
              No notes yet. Start writing something beautiful.
            </p>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {recentNotes.map((note) => (
                <Link
                  key={note.id}
                  href={`/notes/${note.id}`}
                  className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-neutral-800/40"
                >
                  <span className="shrink-0 text-lg leading-none">{note.icon ?? "📄"}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-neutral-100">
                    {note.title || "Untitled"}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-600">
                    {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
