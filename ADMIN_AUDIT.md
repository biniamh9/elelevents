# Admin Audit

Date: 2026-05-01
Workspace: `/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled`

## Admin Routes Found

### Auth
- `/admin/login`
- `/admin/forgot-password`
- `/admin/reset-password`

### Workspace
- `/admin/flow`
- `/admin/pricing`
- `/admin/finance`
- `/admin/rentals`
- `/admin/rentals/[id]`
- `/admin/rentals/new`
- `/admin/rentals/requests/[id]`
- `/admin/inquiries`
- `/admin/inquiries/new`
- `/admin/inquiries/reply-review`
- `/admin/inquiries/[id]`
- `/admin/inquiries/[id]/itemized-draft`
- `/admin/social`
- `/admin/documents`
- `/admin/documents/new`
- `/admin/documents/[id]`
- `/admin/packages`
- `/admin/settings`
- `/admin/calendar`
- `/admin/testimonials`
- `/admin/crm-analytics`
- `/admin/crm-analytics/[leadId]`
- `/admin/vendors`
- `/admin/gallery`
- `/admin/contracts`
- `/admin/contracts/[id]`

### Output / Print
- `/admin/document-output/[id]`

## Duplicate Or Repetitive Areas Found

### Repeated pipeline views
- `/admin/inquiries?tab=overview` contains a full multi-stage operating lane.
- `/admin/inquiries?tab=pipeline` contains a second pipeline board.
- `/admin/crm-analytics` contains another full workflow lane.
- Result: the same business story is repeated across Overview, Inquiry Pipeline, and CRM.

### Repeated KPI summaries
- Overview KPI cards overlap with CRM KPI cards.
- Finance and CRM both surface value-related cards, but only Finance is actual cash and CRM is forecast. The distinction is not obvious enough in navigation.

### Repeated record access
- Inquiry workflow, CRM leads, customer/account context, and schedule all route into the same underlying inquiry records from different surfaces.
- This makes the product feel like many disconnected tools instead of one CRM.

## Confusing Navigation Items

### Sidebar issues before refactor
- `Homepage now` is a separate top-level item while `Homepage Flow` already exists under Content.
- `Overview` group mixes dashboard, pipeline, schedule, and inquiry records.
- `CRM & Analytics` mixes dashboard, reports, leads, customers, revenue, and tasks.
- `Sales` mixes documents with rental requests and inventory, which belong to a different operational stream.
- `Finance` is separate from Contracts/Invoices/Receipts in a way that hides the relationship between forecast and actual cash.

### Business wording issues
- `Documents` is too generic for users who need quotes, invoices, and receipts quickly.
- `Revenue signals` is analyst language, not an operational label.
- `New request` is weaker than `Add Inquiry` inside a CRM.

## Pages That Should Be Merged Or Reframed

### Keep separate, but change responsibility
- `Overview`
  - Keep as the high-level business summary.
  - Remove the full pipeline lane as the primary content.
- `CRM / Pipeline`
  - Make this the source of truth for stage movement and conversion tracking.

### Keep separate
- `Finance`
  - Should stay separate from CRM forecast because it tracks actual cash.
- `Content`
  - Homepage Flow, Gallery, Testimonials, and Social Links should remain separate from CRM.
- `Settings`
  - Should remain separate and role-protected.

### Merge by navigation language, not by deleting routes
- `Documents` should operationally resolve into Quotes / Invoices / Receipts.
- `Rentals` should own Rental Requests and Rental Inventory instead of appearing under Sales.
- `Events / Projects` should sit with Calendar and Vendors, not hide under Inquiry tabs.

## Broken Buttons / Actions Found

### High severity
- CRM leads route previously crashed from a client/server component boundary problem.
  - Fix was already applied separately before this audit.

### Workflow / actions issues
- Inquiry row actions were previously inconsistent and clipped; portal menu logic has already been partially refactored, but this still requires end-to-end regression coverage.
- Many actions are hidden behind dropdowns instead of having one clear recommended next action and one consistent action menu.

## Delete / Archive Issues

### Current behavior before refactor
- Inquiry delete API performs direct hard delete:
  - file: `app/api/admin/inquiries/[id]/route.ts`
- No related-record protection is applied before delete.
- No archive action exists in the inquiry row menu.
- No archived record filtering model exists in the main inquiry/CRM workflow.

### Risk
- Hard delete can remove the primary CRM record while related contracts, documents, payments, interactions, and workflow history still exist or should exist.

## Missing Customer / Event Connections

### Customer hub gap
- CRM lead detail is the closest thing to a customer profile, but the product language still treats records mostly as inquiries.
- Documents, contracts, payments, and event status are not consistently framed as one connected customer/project record.

### Module disconnects
- Finance is not clearly linked back to the customer/project journey from the main navigation.
- Calendar is operationally useful but still separate from a customer/project-first workflow story.
- Rentals operate in a separate pipeline but still appear in Sales rather than as their own module.

## Supabase / Backend Issues Found

### Confirmed schema issue
- `event_inquiries.archived_at` does not exist in the current database.
- This was verified directly against Supabase.

### Query issues
- CRM live snapshot currently queries all `event_inquiries` rows with no archive exclusion.
- Inquiry list default query currently has no archive concept and no related delete safety checks.

### Security / role observations
- Current route protection is module-based through `lib/admin-access.ts`.
- Role model exists, but route grouping and labels do not reflect the mental model of Admin / Manager / Staff / Finance / Content users cleanly enough.

## Console / API Errors Found

### Confirmed previously
- CRM leads route had a server-side render crash.
- Inquiry action dropdown behavior was unstable across row menus before the shared portal work.

### Requires regression retest after refactor
- CRM pipeline tab
- CRM lead detail
- inquiry actions
- documents actions
- customer delete/archive flow

## Pages That Should Remain Separate
- Overview
- CRM Pipeline / Leads / Customers / Tasks
- Events / Calendar / Vendors
- Sales documents and contracts
- Finance actual cash tracking
- Rentals
- Content
- Settings

## Refactor Direction

### Navigation target
- Dashboard
  - Overview
- CRM
  - Pipeline
  - Leads / Inquiries
  - Customers
  - Tasks
- Events
  - Events / Projects
  - Calendar
  - Vendors
- Sales
  - Quotes
  - Invoices
  - Receipts
  - Contracts
  - Payments
- Rentals
  - Rental Requests
  - Rental Inventory
  - Packages
  - Pricing
- Content
  - Homepage Flow
  - Gallery
  - Testimonials
  - Social Links
- Settings
  - Users
  - Access & Roles
  - Workspace
  - Modules

### Workflow target
- Overview = summary, priorities, activity, quick actions.
- CRM Pipeline = stage source of truth.
- Customer / lead detail = CRM center.
- Delete = blocked when related records exist.
- Archive = preferred behavior for closed or inactive records.
