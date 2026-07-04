import { formatISO, subDays } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { computeStreak } from "@/lib/streak";
import type { HabitWithStatus } from "@/lib/types";

const STREAK_LOOKBACK_DAYS = 60;

export async function getHabitsWithStatus(): Promise<HabitWithStatus[]> {
  const supabase = await createClient();

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select("*")
    .is("archived_at", null)
    .order("created_at", { ascending: true });

  if (habitsError) throw new Error(habitsError.message);
  if (!habits || habits.length === 0) return [];

  const since = formatISO(subDays(new Date(), STREAK_LOOKBACK_DAYS), {
    representation: "date",
  });

  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("habit_id, log_date")
    .gte("log_date", since)
    .in(
      "habit_id",
      habits.map((h) => h.id),
    );

  if (logsError) throw new Error(logsError.message);

  const todayStr = formatISO(new Date(), { representation: "date" });
  const logsByHabit = new Map<string, string[]>();
  for (const log of logs ?? []) {
    const list = logsByHabit.get(log.habit_id) ?? [];
    list.push(log.log_date);
    logsByHabit.set(log.habit_id, list);
  }

  return habits.map((habit) => {
    const dates = logsByHabit.get(habit.id) ?? [];
    return {
      ...habit,
      loggedToday: dates.includes(todayStr),
      currentStreak: computeStreak(dates),
      recentLogDates: dates,
    };
  });
}
