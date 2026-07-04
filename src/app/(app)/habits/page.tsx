import { getHabitsWithStatus } from "@/lib/data/habits";
import { HabitList } from "@/components/habit-list";
import { HabitComposer } from "@/components/habit-composer";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default async function HabitsPage() {
  const habits = await getHabitsWithStatus();
  const loggedToday = habits.filter((h) => h.loggedToday).length;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-xl font-semibold text-neutral-50">Habits</h1>

      <Card className="mb-6">
        <HabitComposer />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Today ({loggedToday}/{habits.length})
          </CardTitle>
        </CardHeader>
        <HabitList habits={habits} />
      </Card>
    </div>
  );
}
