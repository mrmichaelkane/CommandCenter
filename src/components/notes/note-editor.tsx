"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import type { JSONContent } from "@tiptap/core";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Pin,
  PinOff,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Trash2,
  Undo2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { deleteNote, saveNote, setNoteIcon, setNotePinned } from "@/lib/actions/notes";
import { cn } from "@/lib/utils";
import type { Note } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 900;

const EMOJI_CHOICES = [
  "📝", "💡", "🎯", "📌", "🗂️", "📚", "🧠", "✨", "🚀", "🔧",
  "🏠", "💪", "🥗", "💰", "✈️", "🎨", "🎵", "📅", "❤️", "🔥",
  "🌱", "🧭", "🏆", "🧪", "🍳", "🛒", "🎁", "☕", "🌊", "⭐",
];

export function NoteEditor({ note }: { note: Note }) {
  const [title, setTitle] = useState(note.title);
  const [icon, setIcon] = useState(note.icon);
  const [pinned, setPinned] = useState(note.pinned);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving">("saved");
  const [, startTransition] = useTransition();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef(note.title);
  // Snapshot of the latest content, taken on every edit so the final save can
  // run even after the editor instance has been destroyed on unmount. Starts
  // from the server copy so title-only edits don't wipe the body.
  const contentRef = useRef<{ json: JSONContent; text: string }>({
    json: (note.content as JSONContent | null) ?? { type: "doc", content: [{ type: "paragraph" }] },
    text: note.content_text,
  });

  const runSave = useCallback(async () => {
    const content = contentRef.current;
    setSaveState("saving");
    const result = await saveNote(note.id, {
      title: titleRef.current,
      content: content.json,
      contentText: content.text,
    });
    setSaveState(result.error ? "dirty" : "saved");
  }, [note.id]);

  const scheduleSave = useCallback(() => {
    setSaveState("dirty");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(runSave, SAVE_DEBOUNCE_MS);
  }, [runSave]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      CharacterCount,
      Placeholder.configure({
        placeholder: "Write something… Markdown shortcuts work: try “# ”, “- ” or “[] ”.",
      }),
    ],
    content: (note.content as JSONContent | null) ?? "",
    editorProps: {
      attributes: {
        class:
          "tiptap prose prose-invert prose-neutral max-w-none min-h-[50vh] focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      contentRef.current = { json: e.getJSON(), text: e.getText() };
      scheduleSave();
    },
  });

  // Flush the pending debounce when leaving the page so edits aren't lost.
  useEffect(() => {
    return () => {
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        void runSave();
      }
    };
  }, [runSave]);

  const wordCount = useEditorState({
    editor,
    selector: ({ editor: e }) => e?.storage.characterCount.words() ?? 0,
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between gap-3 text-xs text-neutral-500">
        <span>
          {saveState === "saved" && `Saved · edited ${formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}`}
          {saveState === "dirty" && "Unsaved changes…"}
          {saveState === "saving" && "Saving…"}
        </span>
        <div className="flex items-center gap-1">
          <span className="mr-2 hidden sm:inline">{wordCount} words</span>
          <button
            type="button"
            aria-label={pinned ? "Unpin note" : "Pin note"}
            onClick={() => {
              const next = !pinned;
              setPinned(next);
              startTransition(async () => void (await setNotePinned(note.id, next)));
            }}
            className={cn(
              "rounded-lg p-1.5 transition hover:bg-neutral-800",
              pinned ? "text-amber-400" : "text-neutral-500 hover:text-neutral-200",
            )}
          >
            {pinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            aria-label="Delete note"
            onClick={() => {
              if (!confirm("Delete this note? This can't be undone.")) return;
              if (saveTimer.current) clearTimeout(saveTimer.current);
              startTransition(async () => void (await deleteNote(note.id)));
            }}
            className="rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-800 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="relative mb-2">
        <button
          type="button"
          aria-label="Choose icon"
          onClick={() => setPickerOpen((open) => !open)}
          className="rounded-xl p-1 text-5xl leading-none transition hover:bg-neutral-800/70"
        >
          {icon ?? <span className="text-3xl text-neutral-700">＋</span>}
        </button>
        {pickerOpen && (
          <div className="absolute z-20 mt-2 w-72 rounded-2xl border border-neutral-800 bg-neutral-900 p-3 shadow-xl">
            <div className="grid grid-cols-10 gap-1">
              {EMOJI_CHOICES.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setIcon(emoji);
                    setPickerOpen(false);
                    startTransition(async () => void (await setNoteIcon(note.id, emoji)));
                  }}
                  className="rounded-lg p-1 text-lg transition hover:bg-neutral-800"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setIcon(null);
                setPickerOpen(false);
                startTransition(async () => void (await setNoteIcon(note.id, null)));
              }}
              className="mt-2 w-full rounded-lg py-1 text-xs text-neutral-500 transition hover:bg-neutral-800 hover:text-neutral-200"
            >
              Remove icon
            </button>
          </div>
        )}
      </div>

      <textarea
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          titleRef.current = e.target.value;
          scheduleSave();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            editor?.commands.focus("start");
          }
        }}
        placeholder="Untitled"
        rows={1}
        className="mb-4 w-full resize-none bg-transparent text-4xl font-bold text-neutral-50 placeholder:text-neutral-700 focus:outline-none"
      />

      {editor && <Toolbar editor={editor} />}

      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const active = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold") ?? false,
      italic: e?.isActive("italic") ?? false,
      strike: e?.isActive("strike") ?? false,
      code: e?.isActive("code") ?? false,
      h1: e?.isActive("heading", { level: 1 }) ?? false,
      h2: e?.isActive("heading", { level: 2 }) ?? false,
      h3: e?.isActive("heading", { level: 3 }) ?? false,
      bulletList: e?.isActive("bulletList") ?? false,
      orderedList: e?.isActive("orderedList") ?? false,
      taskList: e?.isActive("taskList") ?? false,
      blockquote: e?.isActive("blockquote") ?? false,
      codeBlock: e?.isActive("codeBlock") ?? false,
      canUndo: e?.can().undo() ?? false,
      canRedo: e?.can().redo() ?? false,
    }),
  });

  const chain = () => editor.chain().focus();

  const buttons: {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    disabled?: boolean;
    onClick: () => void;
    divider?: boolean;
  }[] = [
    { icon: <Bold className="h-4 w-4" />, label: "Bold", isActive: active?.bold, onClick: () => chain().toggleBold().run() },
    { icon: <Italic className="h-4 w-4" />, label: "Italic", isActive: active?.italic, onClick: () => chain().toggleItalic().run() },
    { icon: <Strikethrough className="h-4 w-4" />, label: "Strikethrough", isActive: active?.strike, onClick: () => chain().toggleStrike().run() },
    { icon: <Code className="h-4 w-4" />, label: "Inline code", isActive: active?.code, onClick: () => chain().toggleCode().run(), divider: true },
    { icon: <Heading1 className="h-4 w-4" />, label: "Heading 1", isActive: active?.h1, onClick: () => chain().toggleHeading({ level: 1 }).run() },
    { icon: <Heading2 className="h-4 w-4" />, label: "Heading 2", isActive: active?.h2, onClick: () => chain().toggleHeading({ level: 2 }).run() },
    { icon: <Heading3 className="h-4 w-4" />, label: "Heading 3", isActive: active?.h3, onClick: () => chain().toggleHeading({ level: 3 }).run(), divider: true },
    { icon: <List className="h-4 w-4" />, label: "Bullet list", isActive: active?.bulletList, onClick: () => chain().toggleBulletList().run() },
    { icon: <ListOrdered className="h-4 w-4" />, label: "Numbered list", isActive: active?.orderedList, onClick: () => chain().toggleOrderedList().run() },
    { icon: <ListTodo className="h-4 w-4" />, label: "Task list", isActive: active?.taskList, onClick: () => chain().toggleTaskList().run(), divider: true },
    { icon: <Quote className="h-4 w-4" />, label: "Quote", isActive: active?.blockquote, onClick: () => chain().toggleBlockquote().run() },
    { icon: <SquareCode className="h-4 w-4" />, label: "Code block", isActive: active?.codeBlock, onClick: () => chain().toggleCodeBlock().run() },
    { icon: <Minus className="h-4 w-4" />, label: "Divider", onClick: () => chain().setHorizontalRule().run(), divider: true },
    { icon: <Undo2 className="h-4 w-4" />, label: "Undo", disabled: !active?.canUndo, onClick: () => chain().undo().run() },
    { icon: <Redo2 className="h-4 w-4" />, label: "Redo", disabled: !active?.canRedo, onClick: () => chain().redo().run() },
  ];

  return (
    <div className="sticky top-[57px] z-10 mb-6 flex flex-wrap items-center gap-0.5 rounded-xl border border-neutral-800 bg-neutral-900/95 p-1 backdrop-blur">
      {buttons.map((button) => (
        <span key={button.label} className="flex items-center">
          <button
            type="button"
            aria-label={button.label}
            title={button.label}
            disabled={button.disabled}
            onMouseDown={(e) => e.preventDefault()}
            onClick={button.onClick}
            className={cn(
              "rounded-lg p-1.5 transition disabled:opacity-30",
              button.isActive
                ? "bg-neutral-700 text-neutral-50"
                : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100",
            )}
          >
            {button.icon}
          </button>
          {button.divider && <span className="mx-1 h-4 w-px bg-neutral-800" />}
        </span>
      ))}
    </div>
  );
}
