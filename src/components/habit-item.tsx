"use client";

import { useTransition } from "react";
import { Flame, Archive } from "lucide-react";
import { logHabitToday, unlogHabitToday, archiveHabit } from "@/lib/actions/habits";
import { cn } from "@/lib/utils";
import type { HabitWithStatus } from "@/lib/types";

export function HabitItem({ habit }: { habit: HabitWithStatus }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className={cn("group flex items-center gap-3 rounded-lg px-2 py-2", isPending && "opacity-60")}>
      <button
        type="button"
        aria-label={habit.loggedToday ? "Undo today's log" : "Log for today"}
        onClick={() =>
          startTransition(async () => {
            void (habit.loggedToday
              ? await unlogHabitToday(habit.id)
              : await logHabitToday(habit.id));
          })
        }
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
          habit.loggedToday
            ? "border-emerald-500 bg-emerald-500 text-neutral-950"
            : "border-neutral-600 hover:border-neutral-400",
        )}
      >
        {habit.loggedToday && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
            <path
              d="M2 6.5 4.75 9 10 3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <p className="min-w-0 flex-1 truncate text-sm text-neutral-100">{habit.name}</p>

      <span
        className={cn(
          "flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
          habit.currentStreak > 0
            ? "border-orange-500/30 bg-orange-500/15 text-orange-400"
            : "border-neutral-700 text-neutral-500",
        )}
      >
        <Flame className="h-3 w-3" />
        {habit.currentStreak}
      </span>

      <button
        type="button"
        aria-label="Archive habit"
        onClick={() => startTransition(async () => void (await archiveHabit(habit.id)))}
        className="shrink-0 rounded p-1 text-neutral-600 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
      >
        <Archive className="h-4 w-4" />
      </button>
    </div>
  );
}
