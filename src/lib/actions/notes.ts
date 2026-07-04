"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createNote() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notes")
    .insert({ title: "" })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/notes");
  redirect(`/notes/${data.id}`);
}

// Autosave from the editor. Content is the Tiptap JSON document; contentText
// is its plain-text projection, stored for previews and future search.
export async function saveNote(
  noteId: string,
  input: { title: string; content: unknown; contentText: string },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notes")
    .update({
      title: input.title.trim(),
      content: input.content,
      content_text: input.contentText,
    })
    .eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/");
  return { error: null };
}

export async function setNoteIcon(noteId: string, icon: string | null) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ icon }).eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { error: null };
}

export async function setNotePinned(noteId: string, pinned: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").update({ pinned }).eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/notes");
  return { error: null };
}

export async function deleteNote(noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("notes").delete().eq("id", noteId);

  if (error) return { error: error.message };
  revalidatePath("/notes");
  revalidatePath("/");
  redirect("/notes");
}
