-- Command Centre OS: projects (Jira-style tracking) and notes (Notion-style
-- documents). Tasks gain board fields so they can live on a project's kanban
-- board while still appearing in the flat "My Tasks" list.

-- PROJECTS ---------------------------------------------------------------

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  key text not null,
  description text,
  color text not null default 'violet'
    check (color in ('violet', 'blue', 'emerald', 'amber', 'rose', 'cyan')),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists projects_user_id_idx on public.projects (user_id);

alter table public.projects enable row level security;

create policy "projects_select_own" on public.projects
  for select using (auth.uid() = user_id);
create policy "projects_insert_own" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "projects_update_own" on public.projects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "projects_delete_own" on public.projects
  for delete using (auth.uid() = user_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- TASKS: board fields ----------------------------------------------------

-- status is the Jira-style workflow state; completed_at stays authoritative
-- for "done or not" and the two are kept in sync by the action layer
-- (status = 'done' <=> completed_at is not null).
alter table public.tasks
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists status text not null default 'todo'
    check (status in ('backlog', 'todo', 'in_progress', 'done')),
  add column if not exists sort_order double precision not null
    default extract(epoch from clock_timestamp());

update public.tasks set status = 'done' where completed_at is not null and status <> 'done';

create index if not exists tasks_project_board_idx
  on public.tasks (project_id, status, sort_order);

-- NOTES --------------------------------------------------------------------

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default '',
  icon text,
  content jsonb,
  content_text text not null default '',
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notes_user_id_idx on public.notes (user_id);
create index if not exists notes_user_updated_idx on public.notes (user_id, updated_at desc);

alter table public.notes enable row level security;

create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);
create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);
create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- CAPTURE: notes can now be a classification target -----------------------

alter table public.capture_entries
  drop constraint if exists capture_entries_classified_type_check;
alter table public.capture_entries
  add constraint capture_entries_classified_type_check
  check (classified_type in ('task', 'habit_log', 'note', 'unrecognized'));

alter table public.capture_entries
  add column if not exists target_note_id uuid references public.notes(id) on delete set null;
