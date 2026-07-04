import { HabitItem } from "@/components/habit-item";
import type { HabitWithStatus } from "@/lib/types";

export function HabitList({ habits }: { habits: HabitWithStatus[] }) {
  if (habits.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-600">No habits yet. Add one below.</p>;
  }

  return (
    <div className="divide-y divide-neutral-800/60">
      {habits.map((habit) => (
        <HabitItem key={habit.id} habit={habit} />
      ))}
    </div>
  );
}
