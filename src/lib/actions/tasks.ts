"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Priority, TaskStatus } from "@/lib/types";

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/projects", "layout");
}

export async function createTask(input: {
  title: string;
  priority?: Priority;
  dueDate?: string | null;
  notes?: string | null;
  projectId?: string | null;
  status?: TaskStatus;
}) {
  const title = input.title.trim();
  if (!title) return { error: "Title is required." };

  const status = input.status ?? "todo";
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    priority: input.priority ?? "medium",
    due_date: input.dueDate || null,
    notes: input.notes || null,
    project_id: input.projectId || null,
    status,
    completed_at: status === "done" ? new Date().toISOString() : null,
  });

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}

export async function setTaskComplete(taskId: string, completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({
      completed_at: completed ? new Date().toISOString() : null,
      status: completed ? "done" : "todo",
    })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}

// Moves a task on the board: workflow column and/or position within it.
// completed_at is kept in sync so the flat task list and dashboard agree
// with the board about what counts as done.
export async function moveTask(
  taskId: string,
  input: { status: TaskStatus; sortOrder?: number },
) {
  const supabase = await createClient();
  const update: Record<string, unknown> = {
    status: input.status,
    completed_at: input.status === "done" ? new Date().toISOString() : null,
  };
  if (input.sortOrder !== undefined) update.sort_order = input.sortOrder;

  const { error } = await supabase.from("tasks").update(update).eq("id", taskId);

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}

export async function setTaskPriority(taskId: string, priority: Priority) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").update({ priority }).eq("id", taskId);

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}

export async function setTaskDueDate(taskId: string, dueDate: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ due_date: dueDate || null })
    .eq("id", taskId);

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}
