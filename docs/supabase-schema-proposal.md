# Supabase CRM Schema Proposal

## Goal

Model the current Elel Events workflow as a CRM pipeline:

1. A visitor submits a quote request.
2. The request becomes an inquiry in the pipeline.
3. The inquiry can be converted into a contract.
4. The contract can collect deposit and balance payments.
5. Staff should be able to audit who changed what.

## Recommended Core Tables

### `crm_profiles`

Maps `auth.users` to CRM roles.

- Use for admin and staff authorization.
- Keeps row-level security policy logic out of ad hoc email checks.

### `clients`

Canonical customer record.

- One client can have many inquiries and contracts.
- Lets you keep customer details stable even when individual inquiries change.
- Good place for long-lived notes and source attribution.

### `event_inquiries`

Lead and sales-pipeline table for incoming requests.

- Matches your current public form and admin inquiry screens.
- Keeps inquiry-specific event details and pipeline timestamps.
- `client_id` is nullable so the current app can adopt it gradually.

### `contracts`

Commercial agreement generated from an inquiry.

- Keeps a snapshot of client/event details at contract creation time.
- Allows contracts to survive even if the inquiry is edited later.
- Supports DocuSign URL, PDF URL, notes, and payment summary fields already used by your app.

### `contract_payments`

Tracks deposit, balance, and extra payments separately.

- Better than a single `deposit_paid` boolean once real money starts moving.
- Useful for payment history, receipts, overdue balances, and reconciliation.

### `activity_log`

Auditable change log.

- Record status changes, contract sends, payment updates, and manual notes.
- Very useful once multiple admins touch the same records.

## Why This Fits Your Current App

Your current code already depends on:

- `event_inquiries.status`, `quoted_at`, `booked_at`, `admin_notes`
- `contracts.inquiry_id`
- `contracts.contract_status`, `contract_sent_at`
- `contracts.deposit_paid`, `deposit_paid_at`
- `contracts.scope_json`

The proposed SQL keeps all of those fields, then adds the missing CRM pieces:

- reusable `clients`
- proper admin/staff profile table
- payment records
- activity history
- stronger constraints, indexes, and RLS

## Recommended Status Model

Inquiry pipeline:

- `new`
- `contacted`
- `quoted`
- `booked`
- `closed_lost`

Contract pipeline:

- `draft`
- `sent`
- `signed`
- `deposit_paid`
- `closed`

## Design Choices

### Keep inquiry data and contract snapshot data separate

Do not make the contract depend entirely on live inquiry fields. A contract should preserve what the client agreed to at that moment.

### Add `clients` now, but keep adoption gradual

Your app does not yet create or hydrate `client_id`. Making that relationship nullable lets you migrate without blocking current features.

### Keep `scope_json` for now

For your current stage, `scope_json` is pragmatic because services and decor scope can evolve quickly. Normalize later only if you need strong reporting on line items.

### Track money in `contract_payments`

The existing `deposit_paid` boolean is fine for UI convenience, but it should eventually be derived from payment rows or kept in sync from them.

## Next App Changes After Applying This Schema

1. Create a `clients` row when a new inquiry is submitted or when an inquiry is first reviewed.
2. Backfill `event_inquiries.client_id` and `contracts.client_id`.
3. When a deposit is marked paid, insert a `contract_payments` row instead of toggling only a boolean.
4. Add activity log writes in:
   - `/app/api/admin/inquiries/[id]/route.ts`
   - `/app/api/admin/contracts/[id]/route.ts`
   - `/app/api/admin/contracts/from-inquiry/[id]/route.ts`
5. Replace direct service-role access in user-facing flows with proper authenticated clients plus RLS where possible.

## Suggested Migration Order

1. Apply the new schema SQL in a dev Supabase project.
2. Verify the current app still works against `event_inquiries` and `contracts`.
3. Add `clients` creation/backfill logic.
4. Add `contract_payments` writes.
5. Add authentication and role-aware admin access.
