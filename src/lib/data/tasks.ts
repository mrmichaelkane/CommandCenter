import { createClient } from "@/lib/supabase/server";
import type { TaskWithProject } from "@/lib/types";

export async function getTasks(): Promise<TaskWithProject[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*, project:projects(id, name, key, color)")
    .order("completed_at", { ascending: true, nullsFirst: true })
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as TaskWithProject[];
}
