import { NextResponse } from "next/server";
import { formatISO } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { classifyCapture } from "@/lib/ai/capture";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const { text } = (await request.json()) as { text?: string };
  const trimmed = text?.trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Text is required." }, { status: 400 });
  }

  const { data: habits } = await supabase
    .from("habits")
    .select("id, name")
    .is("archived_at", null);

  let route;
  try {
    route = await classifyCapture(trimmed, habits ?? []);
  } catch {
    return NextResponse.json({ error: "Capture classification failed." }, { status: 502 });
  }

  if (route.classification === "habit_log") {
    const today = formatISO(new Date(), { representation: "date" });
    const { error } = await supabase
      .from("habit_logs")
      .upsert({ habit_id: route.habitId, log_date: today }, { onConflict: "habit_id,log_date" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const habitName = habits?.find((h) => h.id === route.habitId)?.name ?? "habit";
    await supabase.from("capture_entries").insert({
      raw_text: trimmed,
      classified_type: "habit_log",
      target_habit_id: route.habitId,
    });

    return NextResponse.json({ result: `Logged "${habitName}" for today.` });
  }

  // "task" and "unrecognized" both land as a task so nothing typed is lost.
  const title = route.classification === "task" ? route.title : trimmed;
  const priority = route.classification === "task" ? route.priority : "medium";
  const dueDate = route.classification === "task" ? route.dueDate : null;

  const { data: inserted, error } = await supabase
    .from("tasks")
    .insert({ title, priority, due_date: dueDate })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("capture_entries").insert({
    raw_text: trimmed,
    classified_type: route.classification === "task" ? "task" : "unrecognized",
    target_task_id: inserted.id,
  });

  return NextResponse.json({ result: `Added task "${title}".` });
}
