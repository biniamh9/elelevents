# QA Checklist

Last updated: 2026-05-01  
Environment: local Next app at `http://127.0.0.1:3000` with real Supabase `.env.local`  
Method: real browser automation with Playwright plus direct Supabase verification

## Summary Status

| Area | Result | Notes |
| --- | --- | --- |
| Public browse flow | Pass | Main public routes loaded and rendered in browser |
| Public request submission | Pass with external email issue | Inquiry inserted, follow-up saved, uploads stored; Resend domain verification still failing |
| Admin login | Pass | Redirect issue fixed and retested in real browser |
| Admin inquiries workflow | Pass | Search, actions menu, detail page, follow-up inspiration all verified |
| Admin CRM leads page | Pass after fix | Server crash fixed and route retested |
| Admin documents workflow | In progress | Page loads; actions menu opens in direct browser debug; runner step still being normalized |
| Supabase data persistence | Pass | Inquiry and follow-up data verified directly in DB |
| TypeScript build | Fails on pre-existing unrelated issue | `.next/types/validator.ts` `/vendors` route mismatch |

## Routes and Workflows Tested

| Page / Route | Buttons / Actions Tested | Forms Tested | Result | Issue Found | Fix Applied | Retest Result |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | Homepage CTA visibility | None | Pass | None | None | Pass |
| `/about` | Navigation/render | None | Pass | None | None | Pass |
| `/services` | Navigation/render | None | Pass | None | None | Pass |
| `/gallery` | Navigation/render | None | Pass | None | None | Pass |
| `/gallery/[id]` | Detail page load | None | Pass | None | None | Pass |
| `/contact` | Navigation/render | None | Pass | None | None | Pass |
| `/packages` | Navigation/render | None | Pass | None | None | Pass |
| `/rentals` | Navigation/render | None | Pass | None | None | Pass |
| `/rentals/[slug]` | Detail page load | None | Pass | None | None | Pass |
| `/vendors` | Navigation/render | None | Pass | None | None | Pass |
| `/request` | `Check Availability` | Request form validation and submit | Pass with external email issue | Resend rejected outbound mail for unverified `gmail.com` domain; UI/API still returned 201 and completed flow | No code fix yet; external email domain configuration required | Form flow itself retested and passed |
| `/request/follow-up` | `Save Inspiration` | Upload image, paste links, select style, submit | Pass | None in UI flow | None | Pass |
| Supabase `event_inquiries` | N/A | DB verification | Pass | None | None | Inquiry row and `follow_up_details_json` verified |
| `/admin/login` | `Sign In` | Admin login | Pass after fix | Successful auth remained on `/admin/login` instead of redirecting into app | Changed login success redirect in [components/forms/admin/admin-login-form.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/forms/admin/admin-login-form.tsx) from client router push/refresh to `window.location.assign(...)` | Retested in browser: redirect now lands on `/admin/inquiries?tab=inquiries` |
| `/admin/inquiries?tab=overview` | Overview navigation | None | Pass | Large whitespace issue was reported separately; styling was adjusted previously | Prior CSS adjustments | Route retested successfully |
| `/admin/inquiries?tab=inquiries` | Search, `Apply`, row `Actions` | None | Pass after fix | Inquiry `Actions` portal menu QA step was racing the filter navigation and earlier portal placement was unstable | Fixed shared portal mounting/measurement in [components/admin/admin-portal-action-menu.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/admin-portal-action-menu.tsx); fixed QA synchronization in [tests/e2e/qa-runner.cjs](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/tests/e2e/qa-runner.cjs) | Retested: searched row actions menu opens and shows full menu |
| `/admin/inquiries/[id]` | `View details` from row actions | None | Pass | None after actions fix | None | Post-submission inspiration section verified with uploaded follow-up content |
| `/admin/crm-analytics?tab=leads` | Route load from CRM dashboard / leads tab | None | Pass after fix | Server-side crash: “Functions are not valid as a child of Client Components”; additional hardening needed because production dataset could still contain null/invalid lead dates | Moved CRM lead row action menu into client boundary via [components/admin/crm-lead-row-actions.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/crm-lead-row-actions.tsx), updated [components/admin/crm-leads-table.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/crm-leads-table.tsx) to run fully client-side and degrade invalid dates safely | Retested in browser and server logs: route now returns HTTP 200 |
| `/admin/documents` | Page load, row `Actions` | None | Pass on direct browser debug; automation still being normalized | Automated assertion still flaky; direct browser debug shows menu opens and content is visible | QA runner stabilization in progress in [tests/e2e/qa-runner.cjs](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/tests/e2e/qa-runner.cjs) | Direct Playwright probe: `Open PDF`, `Print`, `Download PDF`, `Edit Document` visible |
| `/admin/contracts` | Route load | None | Pass | None observed in current smoke run | None | Pass |
| `/admin/finance` | Route load | None | Pass | None observed in current smoke run | None | Pass |
| `/admin/calendar` | Route load | None | Pass | Earlier intermittent route check issue no longer reproducing | None | Pass |
| `/admin/rentals` | Route load | None | Pass | None observed in current smoke run | None | Pass |
| `/admin/settings` | Route load | None | Pass | None observed in current smoke run | None | Pass |

## Manual Browser Debug Notes

### Inquiry row `Actions` menu
- Tested in real browser on filtered inquiry row after `Apply`
- Verified:
  - trigger became `aria-expanded="true"`
  - one `.admin-row-action-dropdown--portal` rendered
  - portal was visible
  - menu text included:
    - `Recommended`
    - `Review request`
    - `View details`
    - `Open workflow`
    - `Itemized Draft`
    - `Record Cash Payment` when available

### Documents row `Actions` menu
- Tested in direct Playwright browser debug
- Verified:
  - trigger is visible and clickable
  - one `.admin-row-action-dropdown--portal` rendered
  - portal visible with:
    - `Open PDF`
    - `Print`
    - `Download PDF`
    - `Edit Document`

## Supabase Checks

| Check | Result | Notes |
| --- | --- | --- |
| Public inquiry insert | Pass | New inquiry row created |
| Follow-up JSON save | Pass | `follow_up_details_json` stored with note, links, selected styles, uploaded URLs |
| Uploaded inspiration file | Pass | Public storage URL persisted in DB |
| Admin auth | Pass | Disposable QA admin can sign in through app |
| Service role exposure in client | Not observed in tested flows | No client-side leak found during tested routes; deeper static audit still pending |
| RLS blocking public request flow | Not observed | Public submission and follow-up both worked end-to-end |

## Issues Still Remaining

1. External email delivery configuration
   - Symptom: public inquiry flow logs `403` from Resend for unverified `gmail.com` domain during confirmation / notification attempts
   - Impact: browser flow still completes, but outbound email confirmation is not truly working for these test addresses
   - Required fix: verify sending domain / sender configuration with Resend and re-test with a valid sender-domain setup

2. QA runner completion still needs the final documents/detail tail
   - Core user journey and core admin journey have been clicked through and verified
   - `tests/e2e/qa-runner.cjs` still needs its documents-action assertion fully normalized so the automated pass can finish the remaining detail-route tail without manual confirmation

3. Pre-existing TypeScript route validator issue
   - `npx tsc --noEmit --pretty false`
   - Fails on `.next/types/validator.ts` because `"/vendors"` is not assignable to `LayoutRoutes`
   - This issue predates the QA fixes above

## Files Changed During QA Fixes

- [components/forms/admin/admin-login-form.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/forms/admin/admin-login-form.tsx)
- [components/admin/admin-portal-action-menu.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/admin-portal-action-menu.tsx)
- [components/admin/crm-lead-row-actions.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/crm-lead-row-actions.tsx)
- [components/admin/crm-leads-table.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/crm-leads-table.tsx)
- [components/admin/admin-portal-action-menu.tsx](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/components/admin/admin-portal-action-menu.tsx)
- [tests/e2e/qa-runner.cjs](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/tests/e2e/qa-runner.cjs)

## Current QA Evidence Files

- [tests/e2e/qa-results.json](/Users/biniamhaile/Desktop/Files/elel-events-corrected-styled/tests/e2e/qa-results.json)
- local debug screenshots created during investigation:
  - `tmp-inquiry-actions-debug.png`
  - `tmp-inquiry-filtered-row-debug.png`
  - `tmp-documents-actions-debug.png`

## Completion State

Not complete yet.

The core public journey and a real admin journey have been exercised and documented, and the CRM leads crash is fixed. Remaining work before calling the full audit complete:
- finish normalizing the automated documents `Actions` menu assertion
- continue the remaining detail-route tail in the runner
- re-test outbound email behavior after proper Resend sender/domain configuration
