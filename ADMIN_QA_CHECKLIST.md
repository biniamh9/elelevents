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

## Notes
- Do not mark this checklist complete until the admin journey has been rerun after the refactor.
