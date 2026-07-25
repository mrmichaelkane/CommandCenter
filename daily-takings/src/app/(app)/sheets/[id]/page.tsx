import { notFound } from "next/navigation";
import { requireContext } from "@/lib/data/context";
import { getSheet } from "@/lib/data/sheets";
import { getShiftName } from "@/lib/data/shifts";
import { SheetEditor } from "@/components/sheet-editor";

export default async function SheetPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireContext();
  const { id } = await params;

  const sheet = await getSheet(ctx.org.id, id);
  if (!sheet) notFound();

  const shiftName = await getShiftName(ctx.org.id, sheet.shift_id);

  return <SheetEditor sheet={sheet} shiftName={shiftName} currency={ctx.org.currency} />;
}
