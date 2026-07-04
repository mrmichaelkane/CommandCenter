# Command Centre

A personal single-user web app that centralises tasks and habits behind one
dashboard, with a universal natural-language capture bar that routes free
text to the right module. See `supabase/migrations/0001_init.sql` for the
full data model.

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- Supabase (Postgres, Auth, Row Level Security)
- Anthropic API (Claude) for capture classification

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migration** — paste the contents of
   `supabase/migrations/0001_init.sql` into the Supabase SQL editor and run
   it (or `supabase db push` if you have the CLI linked to the project).
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

- `src/app/(app)` — authenticated pages: dashboard (`/`), `/tasks`, `/habits`,
  wrapped in a layout that renders the nav and the capture bar.
- `src/app/login`, `src/app/auth/callback` — Google OAuth sign-in.
- `src/app/api/capture` — receives capture-bar text, asks Claude to classify
  it as a new task or a log against an existing habit, and writes the result.
- `src/lib/actions` — Server Actions for task/habit CRUD.
- `src/lib/data` — server-side read helpers (habit streaks are computed here).
- `supabase/migrations` — SQL schema with RLS policies scoped to `auth.uid()`.

## MVP scope

Google auth, dashboard, tasks (create/complete/prioritise), habits
(define/log/streak), and the natural-language capture bar. Workouts,
nutrition, mindfulness, finance, calendar sync, and any multi-user
infrastructure are explicitly out of scope until this core loop proves
sticky through daily use.
