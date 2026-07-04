import { notFound } from "next/navigation";
import { getNote } from "@/lib/data/notes";
import { NoteEditor } from "@/components/notes/note-editor";

export default async function NotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const note = await getNote(id);
  if (!note) notFound();

  return <NoteEditor key={note.id} note={note} />;
}
