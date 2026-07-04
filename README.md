# Command Centre

A personal single-user "command centre OS" — Notion and Jira in one app. It
centralises rich notes, projects, tasks, and habits behind one dashboard,
with a universal natural-language capture bar that routes free text to the
right module. See `supabase/migrations/` for the full data model.

## Modules

- **Dashboard** — daily view: priority tasks, habit status, project progress,
  recent notes.
- **Notes** — Notion-style writing. A rich-text editor (Tiptap) with headings,
  lists, task lists, quotes, code blocks and markdown shortcuts, plus emoji
  icons, pinning, and autosave.
- **Projects** — Jira-style tracking. Each project has a key (e.g. `CC`), a
  colour, and a kanban board (Backlog / To do / In progress / Done) with
  drag-and-drop, or a grouped list view. Tasks carry priority, due date, and
  workflow status.
- **Tasks** — a flat "My Tasks" list across personal and project tasks.
- **Habits** — define, log, streak tracking.
- **Capture bar** — natural-language input classified by Claude into a task,
  a habit log, or a note.

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Supabase (Postgres, Auth, Row Level Security)
- Tiptap (rich-text note editor)
- Anthropic API (Claude) for capture classification

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migrations** — paste the contents of each file in
   `supabase/migrations/` (in order) into the Supabase SQL editor and run
   them (or `supabase db push` if you have the CLI linked to the project).
3. **Enable Google auth** — in Supabase Dashboard → Authentication →
   Providers, enable Google and configure it with an OAuth client from the
   [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   Add `https://<your-project-ref>.supabase.co/auth/v1/callback` as an
   authorized redirect URI on the Google OAuth client, and add your local/prod
   app URL(s) to Supabase's "Redirect URLs" allow list (e.g.
   `http://localhost:3000/auth/callback`).
4. **Get an Anthropic API key** at
   [console.anthropic.com](https://console.anthropic.com).
5. **Copy `.env.example` to `.env.local`** and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project
     Settings → API)
   - `ANTHROPIC_API_KEY`

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to
`/login` until you sign in with Google.

## Structure

- `src/app/(app)` — authenticated pages: dashboard (`/`), `/tasks`,
  `/projects` + `/projects/[id]` (board/list), `/notes` + `/notes/[id]`
  (editor), `/habits`, wrapped in a layout that renders the nav and the
  capture bar.
- `src/app/login`, `src/app/auth/callback` — Google OAuth sign-in.
- `src/app/api/capture` — receives capture-bar text, asks Claude to classify
  it as a new task, a log against an existing habit, or a note, and writes
  the result.
- `src/proxy.ts` — session refresh + auth gate (Next.js 16 Proxy, formerly
  Middleware).
- `src/lib/actions` — Server Actions for task/project/note/habit CRUD.
- `src/lib/data` — server-side read helpers (habit streaks and project
  progress are computed here).
- `src/components/notes`, `src/components/projects` — the editor and board
  UI.
- `supabase/migrations` — SQL schema with RLS policies scoped to
  `auth.uid()`.

## Data model notes

- A task's board `status` (`backlog`/`todo`/`in_progress`/`done`) and its
  `completed_at` timestamp are kept in sync by the action layer, so the
  board, the flat task list, and the dashboard always agree on what's done.
- Note content is stored as Tiptap JSON (`notes.content`) alongside a plain
  text projection (`notes.content_text`) used for previews.
- Deleting a project deletes its tasks (cascade), like deleting a Jira
  project.
