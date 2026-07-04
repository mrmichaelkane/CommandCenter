import { formatISO, subDays } from "date-fns";

// Counts consecutive logged days ending today or yesterday. A streak
// survives one un-logged "today" so it doesn't reset before the day is over.
export function computeStreak(logDates: string[], today = new Date()): number {
  const logged = new Set(logDates);
  const todayStr = formatISO(today, { representation: "date" });
  const yesterdayStr = formatISO(subDays(today, 1), { representation: "date" });

  let cursor: Date;
  if (logged.has(todayStr)) {
    cursor = today;
  } else if (logged.has(yesterdayStr)) {
    cursor = subDays(today, 1);
  } else {
    return 0;
  }

  let streak = 0;
  while (logged.has(formatISO(cursor, { representation: "date" }))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}
