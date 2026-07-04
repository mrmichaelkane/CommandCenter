"use server";

import { revalidatePath } from "next/cache";
import { formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";

function revalidateHabitPaths() {
  revalidatePath("/");
  revalidatePath("/habits");
}

export async function createHabit(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return { error: "Name is required." };

  const supabase = await createClient();
  const { error } = await supabase.from("habits").insert({ name: trimmed });

  if (error) return { error: error.message };
  revalidateHabitPaths();
  return { error: null };
}

export async function logHabitToday(habitId: string) {
  const supabase = await createClient();
  const today = formatISO(new Date(), { representation: "date" });
  const { error } = await supabase
    .from("habit_logs")
    .upsert({ habit_id: habitId, log_date: today }, { onConflict: "habit_id,log_date" });

  if (error) return { error: error.message };
  revalidateHabitPaths();
  return { error: null };
}

export async function unlogHabitToday(habitId: string) {
  const supabase = await createClient();
  const today = formatISO(new Date(), { representation: "date" });
  const { error } = await supabase
    .from("habit_logs")
    .delete()
    .eq("habit_id", habitId)
    .eq("log_date", today);

  if (error) return { error: error.message };
  revalidateHabitPaths();
  return { error: null };
}

export async function archiveHabit(habitId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("habits")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", habitId);

  if (error) return { error: error.message };
  revalidateHabitPaths();
  return { error: null };
}
