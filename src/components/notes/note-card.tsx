import Link from "next/link";
import { Pin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { Note } from "@/lib/types";

export function NoteCard({ note }: { note: Note }) {
  const preview = note.content_text.trim();

  return (
    <Link
      href={`/notes/${note.id}`}
      className="group flex h-44 flex-col rounded-2xl border border-neutral-800 bg-neutral-900/60 p-4 transition hover:border-neutral-700 hover:bg-neutral-900"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-2xl leading-none">{note.icon ?? "📄"}</span>
        {note.pinned && <Pin className="h-3.5 w-3.5 shrink-0 text-amber-400" />}
      </div>
      <p className="mb-1 truncate text-sm font-semibold text-neutral-100">
        {note.title || "Untitled"}
      </p>
      <p className="line-clamp-3 flex-1 whitespace-pre-line text-xs leading-relaxed text-neutral-500">
        {preview || "Empty note"}
      </p>
      <p className="mt-2 text-[11px] text-neutral-600">
        {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
      </p>
    </Link>
  );
}
