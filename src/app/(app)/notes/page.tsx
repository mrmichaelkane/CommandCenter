import { getNotes } from "@/lib/data/notes";
import { NoteCard } from "@/components/notes/note-card";
import { NewNoteButton } from "@/components/notes/new-note-button";

export default async function NotesPage() {
  const notes = await getNotes();
  const pinned = notes.filter((n) => n.pinned);
  const rest = notes.filter((n) => !n.pinned);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-50">Notes</h1>
        <NewNoteButton />
      </div>

      {notes.length === 0 && (
        <div className="rounded-2xl border border-dashed border-neutral-800 py-16 text-center">
          <p className="mb-1 text-sm text-neutral-400">No notes yet.</p>
          <p className="text-xs text-neutral-600">
            Create one to start writing — headings, lists, tasks and more.
          </p>
        </div>
      )}

      {pinned.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Pinned
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pinned.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <section>
          {pinned.length > 0 && (
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              All notes
            </h2>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
