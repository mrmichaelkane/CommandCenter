"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Priority } from "@/lib/types";

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

export async function createTask(input: {
  title: string;
  priority?: Priority;
  dueDate?: string | null;
  notes?: string | null;
}) {
  const title = input.title.trim();
  if (!title) return { error: "Title is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("tasks").insert({
    title,
    priority: input.priority ?? "medium",
    due_date: input.dueDate || null,
    notes: input.notes || null,
  });

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}

export async function setTaskComplete(taskId: string, completed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ completed_at: completed ? new Date().toISOString() : null })
    .eq("id", taskId);

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

export async function deleteTask(taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);

  if (error) return { error: error.message };
  revalidateTaskPaths();
  return { error: null };
}
