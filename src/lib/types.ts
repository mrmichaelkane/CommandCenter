export type Priority = "low" | "medium" | "high";

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export type TaskStatus = "backlog" | "todo" | "in_progress" | "done";

export const STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "in_progress", "done"];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export type Task = {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  priority: Priority;
  due_date: string | null;
  completed_at: string | null;
  project_id: string | null;
  status: TaskStatus;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectColor = "violet" | "blue" | "emerald" | "amber" | "rose" | "cyan";

export const PROJECT_COLORS: ProjectColor[] = [
  "violet",
  "blue",
  "emerald",
  "amber",
  "rose",
  "cyan",
];

export type Project = {
  id: string;
  user_id: string;
  name: string;
  key: string;
  description: string | null;
  color: ProjectColor;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectRef = Pick<Project, "id" | "name" | "key" | "color">;

export type TaskWithProject = Task & { project: ProjectRef | null };

export type ProjectWithProgress = Project & {
  totalCount: number;
  doneCount: number;
};

export type Note = {
  id: string;
  user_id: string;
  title: string;
  icon: string | null;
  content: unknown;
  content_text: string;
  pinned: boolean;
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
