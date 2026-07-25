# Daily Takings Sheet

A customisable, multi-tenant **daily takings sheet** for hospitality venues — the
digital version of the paper end-of-day reconciliation sheet, where **each venue
defines its own sales categories and payment methods** rather than being forced
into a fixed template.

Built as a standalone SaaS: sign up, create your venue, tailor the field schema,
and reconcile every close of trade with automatic totals and variance.

## Why

Every venue reconciles differently. A café might only track _Total Sales_ vs
_Cash + Card_; a restaurant group splits revenue by _Dine-In / Takeaway /
Delivery_ and payments by _Cash / Eftpos / Amex / Voucher_; a club tracks _Bar /
Gaming / Function_ separately. A hardcoded schema can't serve all of them — so
here the field structure is **operator-defined**.

## Core concepts

- **Organization (venue)** — your tenant. Sign-up creates one and makes you its
  admin.
- **Roles** — `admin` configures the schema, shifts, presets and members; both
  `admin` and `manager` fill in and submit daily sheets. Admin-only areas are
  enforced in both the UI and the database (Row Level Security).
- **Preset = a named field schema.** A preset holds an ordered list of **sales
  categories** and **payment methods**. Every org starts with a `Default` preset;
  create more (e.g. _Weekday_, _Weekend_, _Function Day_) for different trading
  patterns. A preset can be set as the org default and assigned as a shift's
  default.
- **Shifts** — a business date can have one or more named shifts (Breakfast /
  Lunch / Dinner, or AM / PM). Each shift produces its own sheet; a day-level
  summary aggregates across them.
- **Daily sheet** — tied to a business date + shift. Fields are **snapshotted
  from the chosen preset at creation**, so later schema edits never change a
  historical sheet. **Sales Total**, **Payments Total** and **Variance**
  (`Sales − Payments`) update live as you type. Save as draft, then **submit** to
  lock it.

## Features (v1)

- Admin **Settings**: presets (create / rename / duplicate / set-default /
  delete), per-preset sales categories & payment methods (add / rename /
  reorder / remove, with optional note & reference fields), shifts (add / rename
  / reorder / default preset), members (invite by email + role, change role,
  remove).
- **Today**: per-shift sheet status, one-tap sheet creation with the shift's
  default preset, and a live day-level summary.
- **Sheet entry**: live totals + prominent variance with balanced / over / under
  visual states, optional per-field notes/references, draft & submit, and
  submitted-sheet locking.
- **History**: date-range filter, day-by-day grouping, and a client-side **CSV
  export** of the visible range.
- Responsive dark UI for desktop and tablet. Single currency per org
  (locale-aware formatting).

## Stack

- **Next.js 16** (App Router, React 19, TypeScript, Tailwind v4)
- **Supabase** (Postgres, Auth, Row Level Security)
- Google OAuth **and** email magic-link sign-in

## Setup

1. **Create a Supabase project** at [supabase.com](https://supabase.com).
2. **Run the migration** — paste `supabase/migrations/0001_init.sql` into the
   Supabase SQL editor and run it (idempotent — safe to re-run).
3. **Enable auth providers** — in Supabase → Authentication → Providers, enable
   **Email** (magic link) and, optionally, **Google** (add an OAuth client and
   set `https://<project-ref>.supabase.co/auth/v1/callback` as an authorized
   redirect URI). Add your app URL(s) to Supabase's redirect allow-list, e.g.
   `http://localhost:3000/auth/callback`.
4. **Copy `.env.example` to `.env.local`** and fill in `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Project Settings → API), and
   `NEXT_PUBLIC_SITE_URL`.

Then:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be sent to `/login`
until you sign in, then to `/onboarding` to create your venue.

## Structure

- `src/app/(app)` — authenticated app: `/` (Today), `/sheets` (History),
  `/sheets/[id]` (sheet editor), `/settings` (admin), wrapped in a layout that
  gates auth + org and renders the nav.
- `src/app/onboarding` — create-organisation flow (seeds a starter schema).
- `src/app/login`, `src/app/auth/callback` — Google + magic-link sign-in.
- `src/proxy.ts` — Next.js 16 Proxy (formerly Middleware): session refresh +
  auth gate.
- `src/lib/data` — server-side reads (`context` resolves user/org/role).
- `src/lib/actions` — Server Actions for org, members, presets, fields, shifts,
  and sheets.
- `src/components` — UI (settings managers, sheet editor, today board, history).
- `supabase/migrations/0001_init.sql` — full schema + RLS. Membership-based
  policies use `SECURITY DEFINER` helpers (`is_org_member` / `is_org_admin`);
  org creation and invite-claiming go through `create_organization` /
  `claim_memberships`.

## Data model notes

- **Multi-tenant RLS**: every table is scoped to org membership. Schema-config
  tables are writable by admins only; sheets by any member. Managers physically
  cannot modify the schema.
- **Snapshotting**: a sheet stores its filled-in fields as jsonb captured from
  the preset at creation, so historical sheets are immune to later schema edits.
- **Soft-archive** for shifts and presets so historical sheets always resolve
  their names; totals are maintained server-side on every save/submit.

## Not in v1 (deferred)

Scoped out for this first cut, in rough priority order:

- **Correction workflow + audit trail** on submitted sheets (mandatory reason +
  field-level diff). Today a submitted sheet is simply locked.
- **Advanced reporting** — weekly/monthly roll-ups, PDF export (CSV of a range
  is included).
- **Multiple venues per operator** (the org model is ready for it).
- POS integration / auto-population, accounting-software export, multi-currency.
