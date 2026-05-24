# Admin Portal CRM Audit

Date: 2026-05-24

## Current Structure

- Admin routes are split across inquiries, CRM analytics, customer hubs, event projects, documents, contracts, finance, calendar, rentals, content, and settings.
- Canonical lifecycle support already exists through `event_projects.status`.
- Commercial records already exist through `client_documents` for quotes, invoices, and receipts.
- Payment tracking exists through document payments and contract payments.
- Activity history exists through `activity_log`, customer interactions, and follow-up task tables.

## Confusing Workflows Found

- Sales navigation previously started with document buckets, so staff had to choose between Quotes, Invoices, Receipts, Contracts, and Payments before seeing the customer’s lifecycle state.
- Customer activity is visible, but scattered between inquiry detail, customer hub, project hub, documents, contracts, and finance.
- The strongest workflow page is the project/customer command center, but it is not the first Sales entry point.
- Sales records show document state well, but not always the recommended next action, follow-up due date, contract state, and payment state together.
- The CRM pipeline groups lifecycle movement, while Sales pages group commercial documents. Staff need a bridge between those two mental models.

## Backend / Data Usage

- `event_projects` should remain the canonical lifecycle owner.
- `client_documents` should remain the canonical commercial document owner.
- `contracts` should remain the signature/deposit agreement owner.
- `crm_follow_up_tasks` should remain the follow-up/reminder queue.
- `activity_log` should remain the audit trail for important admin actions.

## Risk Areas

- Some legacy inquiry status fields still exist and can drift from `event_projects.status`.
- Some workflows still rely on staff knowing which module to open next.
- Full “true CRM” behavior requires more complete activity logging for every mutation, not only major commercial actions.
- Follow-up creation/completion exists in pieces, but is not yet a universal inline action everywhere.

## Recommendation

- Make Sales start with a lifecycle pipeline view that shows customer, event date, status, next action, follow-up due date, contract status, payment status, value, and direct actions.
- Keep Quotes, Invoices, Receipts, Contracts, and Payments as drill-down operational queues, not the primary Sales landing page.
- Continue using project/customer hubs as the durable operating records.
- Add progressively stronger follow-up actions and event readiness checklist controls into the project hub in later phases.

## Implemented In This Pass

- Added `/admin/sales` as the Sales Pipeline command view.
- Added `Sales Pipeline` as the first item under the Sales sidebar group.
- The new Sales Pipeline uses existing `event_projects`, `clients`, `client_documents`, `contracts`, and `crm_follow_up_tasks` data without requiring a migration.
