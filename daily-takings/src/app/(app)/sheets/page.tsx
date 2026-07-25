import { requireContext } from "@/lib/data/context";
import { getHistory } from "@/lib/data/sheets";
import { todayISO } from "@/lib/dates";
import { HistoryView } from "@/components/history-view";
import { format, parseISO, subDays } from "date-fns";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const ctx = await requireContext();
  const { from, to } = await searchParams;

  const toDate = to && DATE_RE.test(to) ? to : todayISO();
  const fromDate =
    from && DATE_RE.test(from) ? from : format(subDays(parseISO(toDate), 30), "yyyy-MM-dd");

  const rows = await getHistory(ctx.org.id, fromDate, toDate);

  return <HistoryView rows={rows} currency={ctx.org.currency} from={fromDate} to={toDate} />;
}
