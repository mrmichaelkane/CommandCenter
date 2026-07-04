export type Priority = "low" | "medium" | "high";

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export type Task = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  archived_at: string | null;
  created_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  created_at: string;
};

export type HabitWithStatus = Habit & {
  loggedToday: boolean;
  currentStreak: number;
  recentLogDates: string[];
};
