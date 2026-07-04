import { createClient } from "@/lib/supabase/server";
import type { Project, ProjectWithProgress, Task } from "@/lib/types";

export async function getProjects(): Promise<ProjectWithProgress[]> {
  const supabase = await createClient();

  const { data: projects, error } = await supabase
    .from("projects")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  if (!projects || projects.length === 0) return [];

  const { data: tasks, error: tasksError } = await supabase
    .from("tasks")
    .select("project_id, status")
    .in(
      "project_id",
      projects.map((p) => p.id),
    );

  if (tasksError) throw new Error(tasksError.message);

  const counts = new Map<string, { total: number; done: number }>();
  for (const task of tasks ?? []) {
    if (!task.project_id) continue;
    const entry = counts.get(task.project_id) ?? { total: 0, done: 0 };
    entry.total += 1;
    if (task.status === "done") entry.done += 1;
    counts.set(task.project_id, entry);
  }

  return projects.map((project) => ({
    ...project,
    totalCount: counts.get(project.id)?.total ?? 0,
    doneCount: counts.get(project.id)?.done ?? 0,
  }));
}

export async function getProject(projectId: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Project | null;
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Task[];
}
