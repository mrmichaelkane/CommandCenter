// Domain types mirroring the Supabase schema in supabase/migrations/0001_init.sql.
// Numeric columns are returned as strings by PostgREST — read helpers coerce
// them to numbers, so the types below reflect the coerced (app-facing) shape.

export type Role = "admin" | "manager";
export type MembershipStatus = "active" | "pending";
export type SheetStatus = "draft" | "submitted";

export const ROLES: Role[] = ["admin", "manager"];

export interface Organization {
  id: string;
  name: string;
  currency: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  id: string;
  org_id: string;
  user_id: string | null;
  email: string;
  role: Role;
  status: MembershipStatus;
  created_at: string;
}

export interface Preset {
  id: string;
  org_id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface SalesCategory {
  id: string;
  preset_id: string;
  org_id: string;
  label: string;
  has_note: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface PaymentMethod {
  id: string;
  preset_id: string;
  org_id: string;
  label: string;
  has_reference: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  org_id: string;
  name: string;
  sort_order: number;
  default_preset_id: string | null;
  created_at: string;
  updated_at: string;
}

// A single filled-in field on a sheet. `key` is the id of the source category /
// method (or a generated id) and stays stable so ordering survives edits. The
// label is copied onto the line so the sheet is a self-contained snapshot of the
// schema at the time it was created — later schema edits never alter it.
export interface SheetSalesLine {
  key: string;
  label: string;
  amount: number;
  has_note: boolean;
  note: string | null;
}

export interface SheetPaymentLine {
  key: string;
  label: string;
  amount: number;
  has_reference: boolean;
  reference: string | null;
}

export interface Sheet {
  id: string;
  org_id: string;
  business_date: string;
  shift_id: string;
  preset_id: string | null;
  status: SheetStatus;
  sales: SheetSalesLine[];
  payments: SheetPaymentLine[];
  sales_total: number;
  payments_total: number;
  variance: number;
  note: string | null;
  created_by: string | null;
  submitted_by: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// A preset together with its ordered field definitions.
export interface PresetWithFields extends Preset {
  sales_categories: SalesCategory[];
  payment_methods: PaymentMethod[];
}

// A shift row joined with the current user's context for the Today view.
export interface ShiftWithSheet extends Shift {
  sheet: Sheet | null;
}
