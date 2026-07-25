import { format, parseISO } from "date-fns";

// Business dates are stored as plain YYYY-MM-DD strings; parseISO keeps them at
// local midnight so display never drifts across timezones.
export function formatBusinessDate(d: string): string {
  try {
    return format(parseISO(d), "EEE d MMM yyyy");
  } catch {
    return d;
  }
}

export function formatShortDate(d: string): string {
  try {
    return format(parseISO(d), "d MMM yyyy");
  } catch {
    return d;
  }
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function formatTimestamp(ts: string): string {
  try {
    return format(parseISO(ts), "d MMM yyyy, h:mma");
  } catch {
    return ts;
  }
}
