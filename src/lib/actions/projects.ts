"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_COLORS, type ProjectColor } from "@/lib/types";

function revalidateProjectPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/projects", "layout");
}

// Derives a Jira-style key from the project name, e.g. "Command Centre" -> "CC",
// "Renovation" -> "REN".
function deriveKey(name: string): string {
  const words = name
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "PRJ";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words
    .slice(0, 4)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export async function createProject(input: {
  name: string;
  key?: string;
  description?: string | null;
  color?: ProjectColor;
}) {
  const name = input.name.trim();
  if (!name) return { error: "Name is required." };

  const key = (input.key?.trim() || deriveKey(name)).toUpperCase().slice(0, 5);
  const color =
    input.color && PROJECT_COLORS.includes(input.color) ? input.color : "violet";

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, key, description: input.description || null, color })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `Key "${key}" is already in use. Pick another.` };
    }
    return { error: error.message };
  }

  revalidateProjectPaths();
  redirect(`/projects/${data.id}`);
}

export async function updateProject(
  projectId: string,
  input: { name?: string; description?: string | null; color?: ProjectColor },
) {
  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { error: "Name is required." };
    update.name = name;
  }
  if (input.description !== undefined) update.description = input.description || null;
  if (input.color !== undefined) update.color = input.color;

  const supabase = await createClient();
  const { error } = await supabase.from("projects").update(update).eq("id", projectId);

  if (error) return { error: error.message };
  revalidateProjectPaths();
  return { error: null };
}

// Deleting a project deletes its tasks (cascade), like deleting a Jira project.
export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", projectId);

  if (error) return { error: error.message };
  revalidateProjectPaths();
  redirect("/projects");
}
