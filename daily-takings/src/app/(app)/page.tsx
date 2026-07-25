import { requireContext } from "@/lib/data/context";
import { getDayView } from "@/lib/data/sheets";
import { getPresets } from "@/lib/data/presets";
import { todayISO } from "@/lib/dates";
import { TodayBoard } from "@/components/today-board";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const ctx = await requireContext();
  const { date } = await searchParams;
  const day = date && DATE_RE.test(date) ? date : todayISO();

  const [view, presets] = await Promise.all([
    getDayView(ctx.org.id, day),
    getPresets(ctx.org.id),
  ]);

  return (
    <TodayBoard
      orgId={ctx.org.id}
      view={view}
      presets={presets}
      currency={ctx.org.currency}
      isAdmin={ctx.role === "admin"}
    />
  );
}
