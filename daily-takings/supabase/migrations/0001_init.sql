-- Daily Takings Sheet — multi-tenant schema.
--
-- Model: organizations own everything. Each user joins an org via a membership
-- row carrying a role (admin | manager). Admins configure the field schema
-- (presets + their sales categories / payment methods), shifts, and members;
-- both roles fill in daily sheets. A "preset" IS a named field schema — every
-- org gets a Default preset on creation, and extra presets are alternate
-- named schemas a shift can default to.
--
-- Row Level Security is enforced through SECURITY DEFINER helper functions
-- (is_org_member / is_org_admin) so membership-based policies don't recurse.
--
-- Safe to re-run: every statement is idempotent, so a partially applied run
-- can be repaired by executing the whole file again.

create extension if not exists "pgcrypto";

-- Shared updated_at trigger function ---------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ORGANIZATIONS ------------------------------------------------------------

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  currency text not null default 'NZD',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- MEMBERSHIPS --------------------------------------------------------------

-- user_id is null while an invite is pending; claim_memberships() links it to
-- the auth user on their first sign-in when the email matches.
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'manager' check (role in ('admin', 'manager')),
  status text not null default 'active' check (status in ('active', 'pending')),
  created_at timestamptz not null default now(),
  unique (org_id, email)
);

create index if not exists memberships_org_idx on public.memberships (org_id);
create index if not exists memberships_user_idx on public.memberships (user_id);

-- PRESETS (named field schemas) -------------------------------------------

create table if not exists public.presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean not null default false,
  sort_order double precision not null default extract(epoch from clock_timestamp()),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists presets_org_idx on public.presets (org_id, sort_order);

-- SALES CATEGORIES (fields belonging to a preset) --------------------------

create table if not exists public.sales_categories (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.presets(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  has_note boolean not null default false,
  sort_order double precision not null default extract(epoch from clock_timestamp()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sales_categories_preset_idx
  on public.sales_categories (preset_id, sort_order);

-- PAYMENT METHODS (fields belonging to a preset) ---------------------------

create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  preset_id uuid not null references public.presets(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  label text not null,
  has_reference boolean not null default false,
  sort_order double precision not null default extract(epoch from clock_timestamp()),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_methods_preset_idx
  on public.payment_methods (preset_id, sort_order);

-- SHIFTS -------------------------------------------------------------------

-- Soft-archived (archived_at) rather than hard-deleted so historical sheets
-- always retain a resolvable shift name.
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  sort_order double precision not null default extract(epoch from clock_timestamp()),
  default_preset_id uuid references public.presets(id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists shifts_org_idx on public.shifts (org_id, sort_order);

-- SHEETS -------------------------------------------------------------------

-- sales / payments hold the filled-in field snapshot as jsonb:
--   sales:    [{ key, label, amount, has_note, note }]
--   payments: [{ key, label, amount, has_reference, reference }]
-- This snapshot IS the schema at creation time, so later schema edits never
-- alter historical sheets. Totals are maintained by the server action on save.
create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  business_date date not null,
  shift_id uuid not null references public.shifts(id),
  preset_id uuid references public.presets(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  sales jsonb not null default '[]'::jsonb,
  payments jsonb not null default '[]'::jsonb,
  sales_total numeric(12, 2) not null default 0,
  payments_total numeric(12, 2) not null default 0,
  variance numeric(12, 2) not null default 0,
  note text,
  created_by uuid references auth.users(id) on delete set null,
  submitted_by uuid references auth.users(id) on delete set null,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, business_date, shift_id)
);

create index if not exists sheets_org_date_idx on public.sheets (org_id, business_date desc);
create index if not exists sheets_shift_idx on public.sheets (shift_id);

-- SECURITY DEFINER access helpers ------------------------------------------
-- These run as the function owner and therefore bypass RLS on memberships,
-- which is what lets membership-based policies reference them without
-- recursing. search_path is pinned for safety.

create or replace function public.is_org_member(p_org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.is_org_admin(p_org uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
    where m.org_id = p_org
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = 'admin'
  );
$$;

-- Atomically create an org and its first (admin) membership. Runs as owner so
-- it sidesteps the chicken-and-egg where the first membership can't yet pass
-- an admin check.
create or replace function public.create_organization(p_name text, p_currency text default 'NZD')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_email := coalesce(auth.jwt() ->> 'email', '');

  insert into public.organizations (name, currency, created_by)
  values (
    coalesce(nullif(trim(p_name), ''), 'My Venue'),
    coalesce(nullif(trim(p_currency), ''), 'NZD'),
    auth.uid()
  )
  returning id into v_org;

  insert into public.memberships (org_id, user_id, email, role, status)
  values (v_org, auth.uid(), v_email, 'admin', 'active');

  return v_org;
end;
$$;

-- Link any pending invites addressed to this user's email to their account.
-- Called on first authenticated load so invited managers join automatically.
create or replace function public.claim_memberships()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_count integer;
begin
  if auth.uid() is null then
    return 0;
  end if;

  v_email := auth.jwt() ->> 'email';
  if v_email is null then
    return 0;
  end if;

  update public.memberships
  set user_id = auth.uid(), status = 'active'
  where user_id is null
    and lower(email) = lower(v_email);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

grant execute on function public.is_org_member(uuid) to authenticated;
grant execute on function public.is_org_admin(uuid) to authenticated;
grant execute on function public.create_organization(text, text) to authenticated;
grant execute on function public.claim_memberships() to authenticated;

-- ROW LEVEL SECURITY -------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.presets enable row level security;
alter table public.sales_categories enable row level security;
alter table public.payment_methods enable row level security;
alter table public.shifts enable row level security;
alter table public.sheets enable row level security;

-- organizations: members read; admins update. (Insert happens through
-- create_organization; delete is not exposed in v1.)
drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member" on public.organizations
  for select using (public.is_org_member(id));
drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations
  for update using (public.is_org_admin(id)) with check (public.is_org_admin(id));

-- memberships: members read the roster; admins write it. (The first admin row
-- and invite-claims are written by SECURITY DEFINER functions.)
drop policy if exists "memberships_select_member" on public.memberships;
create policy "memberships_select_member" on public.memberships
  for select using (public.is_org_member(org_id));
drop policy if exists "memberships_insert_admin" on public.memberships;
create policy "memberships_insert_admin" on public.memberships
  for insert with check (public.is_org_admin(org_id));
drop policy if exists "memberships_update_admin" on public.memberships;
create policy "memberships_update_admin" on public.memberships
  for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id));
drop policy if exists "memberships_delete_admin" on public.memberships;
create policy "memberships_delete_admin" on public.memberships
  for delete using (public.is_org_admin(org_id));

-- Schema-config tables: members read, admins write.
do $$
declare
  t text;
begin
  foreach t in array array['presets', 'sales_categories', 'payment_methods', 'shifts']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_select_member', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_org_member(org_id))',
      t || '_select_member', t);

    execute format('drop policy if exists %I on public.%I', t || '_insert_admin', t);
    execute format(
      'create policy %I on public.%I for insert with check (public.is_org_admin(org_id))',
      t || '_insert_admin', t);

    execute format('drop policy if exists %I on public.%I', t || '_update_admin', t);
    execute format(
      'create policy %I on public.%I for update using (public.is_org_admin(org_id)) with check (public.is_org_admin(org_id))',
      t || '_update_admin', t);

    execute format('drop policy if exists %I on public.%I', t || '_delete_admin', t);
    execute format(
      'create policy %I on public.%I for delete using (public.is_org_admin(org_id))',
      t || '_delete_admin', t);
  end loop;
end;
$$;

-- sheets: any member of the org can read and write. Submitted-sheet locking is
-- enforced in the action layer (v1 has no correction workflow yet).
drop policy if exists "sheets_select_member" on public.sheets;
create policy "sheets_select_member" on public.sheets
  for select using (public.is_org_member(org_id));
drop policy if exists "sheets_insert_member" on public.sheets;
create policy "sheets_insert_member" on public.sheets
  for insert with check (public.is_org_member(org_id));
drop policy if exists "sheets_update_member" on public.sheets;
create policy "sheets_update_member" on public.sheets
  for update using (public.is_org_member(org_id)) with check (public.is_org_member(org_id));
drop policy if exists "sheets_delete_member" on public.sheets;
create policy "sheets_delete_member" on public.sheets
  for delete using (public.is_org_member(org_id));

-- updated_at triggers ------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'organizations', 'presets', 'sales_categories',
    'payment_methods', 'shifts', 'sheets'
  ]
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_set_updated_at', t);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;
end;
$$;
