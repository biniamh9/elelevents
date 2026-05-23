# Admin QA Checklist

Date: 2026-05-01
Workspace: `/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled`

## Scope
- Audit and refactor the admin portal into a cleaner CRM workflow.
- Retest navigation, overview/CRM separation, record actions, and customer lifecycle behavior.

## Checklist

| Area | Workflow | Result | Issue Found | Fix Applied | Retest Result |
| --- | --- | --- | --- | --- | --- |
| Sidebar | Open each admin section from sidebar | Pass | Sidebar grouped duplicate and mismatched items before refactor | Rebuilt sidebar into Dashboard / CRM / Events / Sales / Rentals / Content / Settings with business-friendly links | Pass |
| Dashboard / Overview | Load overview summary | Pass | Full pipeline dominated overview before refactor | Replaced primary pipeline lane with KPI row, priorities, recent activity, quick actions, and compact CRM preview | Pass |
| CRM Pipeline | Open CRM main page and pipeline | Pass | CRM overlapped with overview | Made CRM default route the pipeline source of truth | Pass |
| CRM Leads | Open leads tab and lead detail | Pass | Prior leads crash existed in earlier code | Retested local CRM leads and lead detail after refactor | Pass |
| Inquiries | Open inquiry list, filters, actions | Pass | Archive missing and delete unsafe | Added archive action, archived filtering, and guarded delete behavior | Pass |
| Customer lifecycle | Archive/delete customer/lead safely | Pass | Hard delete only, no relation checks | Archive now uses `status=archived`; delete is blocked when related contracts/documents/interactions/workflow history exist | Pass |
| Sales / Quotes | Open filtered quote view | Pass | Documents module too generic | Sidebar now opens quote-filtered documents route | Pass |
| Sales / Invoices | Open filtered invoice view | Pass (route smoke) | Documents module too generic | Sidebar now opens invoice-filtered documents route | Pass |
| Sales / Receipts | Open filtered receipt view | Pass (route smoke) | Documents module too generic | Sidebar now opens receipt-filtered documents route | Pass |
| Contracts | Open contracts queue | Pass (route smoke) | Needed cleaner placement under Sales | Sidebar route smoke passed | Pass |
| Payments / Finance | Open finance income / payments view | Pass (route smoke) | Needed clearer placement as actual cash | Sidebar now links Payments to finance income view | Pass |
| Events / Calendar | Open schedule/calendar and linked records | Pass (route smoke) | Events/project workflow was buried under inquiry tabs | Sidebar now exposes Events / Projects and Calendar separately | Pass |
| Rentals | Requests and inventory navigation | Pass (route smoke) | Mixed into Sales previously | Sidebar now gives Rentals its own group | Pass |
| Content | Flow, gallery, testimonials, social | Pass (route smoke) | Needed clearer grouping only | Content routes retained and grouped cleanly | Pass |
| Settings | Users, roles, workspace, modules | Pass (route smoke) | Needed clearer grouping only | Settings routes retained and grouped cleanly | Pass |
| Console / network | Major admin routes | Pass | Earlier delete-block behavior emitted a browser console error via 409 | Changed guarded delete block to handled success payload and retested browser logs | Pass |

## Mandatory Retest List
- `/admin/inquiries`
- `/admin/inquiries?tab=inquiries`
- `/admin/inquiries?tab=schedule`
- `/admin/crm-analytics`
- `/admin/crm-analytics?tab=leads`
- `/admin/crm-analytics/[leadId]`
- `/admin/documents`
- `/admin/contracts`
- `/admin/finance`
- `/admin/calendar`
- `/admin/rentals`
- inquiry archive flow
- delete-blocking flow when related records exist

## Retest Results
- Local authenticated browser QA executed against `http://127.0.0.1:3001`
- Evidence file:
  - `tests/e2e/admin-crm-audit-results.json`
- Verified:
  - admin login
  - overview loads with CRM preview
  - CRM pipeline route
  - CRM leads tab and lead detail
  - quote-filtered documents route
  - archive inquiry from actions menu
  - archived inquiry hidden by default
  - archived inquiry visible with archived filter
  - hard delete blocked when related records exist
  - sidebar route smoke across calendar, vendors, contracts, finance, rentals, packages, pricing, flow, gallery, testimonials, social, settings
  - browser console/network clean for the tested admin path

## Full Admin Journey Retest - 2026-05-23

Environment: local Next app at `http://127.0.0.1:3001` with `.env.local`
Evidence script: `tests/e2e/admin-full-journey-check.cjs`

| Area | Workflow | Result | Issue Found | Fix Applied | Retest Result |
| --- | --- | --- | --- | --- | --- |
| Admin auth | Sign in as QA admin | Pass | None in current run | None | Pass |
| Manual/admin intake | Create authenticated admin inquiry payload | Pass | Prior payload friction was fixed earlier | Existing admin API accepted full payload and persisted `guest_count` | Pass |
| Inquiry detail | Open newly created inquiry detail | Pass | None in current run | None | Pass |
| Customer hub | Open customer command center | Pass | Needed easy next-step access | Added command center actions and lifecycle status updater | Pass |
| Project hub | Open project command center | Pass | Project detail lacked immediate quote/invoice/payment/status actions | Added project command center with quote, invoice, contract, payment, receipt, and lifecycle controls | Pass |
| Quote workflow | Create quote linked to inquiry/project | Pass | Needed durable commercial flow verification | API created quote and project lifecycle moved to `quote_drafted` | Pass |
| Invoice workflow | Convert quote to invoice | Pass | Needed easier sales workflow access | Row/menu and API conversion verified | Pass |
| Payment workflow | Open invoice payment screen and record payment | Pass | Payment was too buried in document editor | Added `Pay / Record Payment` action and verified invoice settles to paid | Pass |
| Receipt workflow | Receipt generated from payment | Pass | Receipt generation needed to be part of payment path | Existing payment route created receipt draft automatically and test verified it | Pass |
| Documents actions | Invoice row actions expose payment/receipt actions | Pass | Invoice menu previously only exposed output/edit actions | Added `Pay / Record Payment` and `Generate Receipt` to invoice actions | Pass |
| Lifecycle status | Update event project status from project hub | Pass | Status updates were not surfaced from the hub | Added authenticated project status API and quick updater | Pass |
| Route smoke | Core admin routes after workflow mutations | Pass | None in current run | None | Pass |
| Console/network | Browser console, page errors, failed requests | Pass | None in current run | None | Pass |

Full admin journey result: Pass.

Verified steps:
- admin login
- create admin inquiry
- open inquiry detail
- open customer hub
- open project hub
- create quote
- convert quote to invoice
- open invoice payment panel
- record payment
- verify receipt generation
- verify invoice Actions menu payment/receipt controls
- update project lifecycle status
- smoke-test CRM, documents, contracts, finance, calendar, rentals, gallery, and settings routes
- confirm no console errors, page errors, or failed network requests in the tested journey

Remaining QA note:
- This does not replace every possible edge-case test, but the core admin operating journey has now been exercised end-to-end after the command-center refactor.

## Partial Payment Retest - 2026-05-23

Environment: local Next app at `http://127.0.0.1:3001` with `.env.local`
Evidence script: `tests/e2e/admin-full-journey-check.cjs`

| Area | Workflow | Result | Issue Found | Fix Applied | Retest Result |
| --- | --- | --- | --- | --- | --- |
| Invoice editor | Show partial payment context before sending or updating invoice | Pass | Existing amount-paid field was hard to understand for deposits/partial payments | Renamed invoice pricing field to `Partial payment / amount paid` and added helper copy explaining remaining balance | Pass |
| Invoice list | Track invoice amount, paid amount, and remaining balance from the table | Pass | Admin could see invoice status but not easily track partial amount vs balance due | Added `Paid` and `Balance` columns to document rows | Pass |
| Payment form | Record a partial payment and then the remaining balance against an invoice | Pass | Payment entry did not show total, already-paid amount, or remaining balance together | Added payment summary, `Partial payment amount`, and `Use full balance` shortcut | Pass |
| Payment validation | Prevent invalid or over-balance payment entries | Pass | Overpayment could be confusing if the amount entered exceeded the remaining balance | Added client validation for zero, negative, fully-paid, and over-balance amounts | Pass |
| Receipt workflow | Generate receipts for partial and final payment entries | Pass | Needed confirmation the payment path still worked after UI changes | Full admin journey recorded a $1,000 partial payment, verified `partially_paid` with $2,500 balance, then recorded the $2,500 remainder and verified `paid` with $0 balance | Pass |
| Console/network | Browser console, page errors, failed requests | Pass | None in current run | None | Pass |
