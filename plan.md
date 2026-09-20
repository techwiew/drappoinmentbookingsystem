 # MediNovel remediation plan — testing findings, 20 September 2026

## Scope and delivery rule

This section is the active plan for the findings reported on 20 September 2026. Implement the numbered tasks in order, with small reviewable changes and focused regression checks. The older backlog below remains for reference; this section takes precedence wherever it conflicts (especially consultation access, staff permissions, and accepting payments above the invoice balance).

## Implementation status (20 September 2026)

T02-T07 are implemented in the API and UI: clinic-owner staff permissions, doctor transfer/deactivation, active quota checks, date-selected OPD/IPD receipts, dashboard refresh, direct consultation access, queue priority, and overpayment handling. T08 has calendar editing, confirmation, and follow-up creation; changing a follow-up date moves the prior pending/confirmed appointment when there is exactly one matching prior appointment. An ambiguous legacy match is left alone and needs manual calendar correction; a future source-consultation link would resolve that case. T09 has a versioned static-only service worker and install manifest. T10 has route-level lazy loading; the initial JavaScript bundle fell from 556.51 kB to 346.22 kB. The workbook export remains a separate 940.77 kB chunk, loaded only when exporting.

**Verification:** Frontend tests, frontend/backend typechecks, targeted backend transfer/date/follow-up/authorization/queue/payment tests, Prisma validation, frontend production build, and direct backend TypeScript compilation pass. `npm run build --prefix backend` cannot regenerate Prisma Client because Windows reports `EPERM` renaming its query engine DLL while another process holds it; compiled TypeScript succeeds. The full backend integration suite requires the seeded `reception@sharmaclinic.com` account, which is absent from the current local database. Do not run the destructive seed against live data; run the suite against a disposable seeded test database. Production PWA install/offline behavior, the migration on a populated database copy, and manual two-hospital/two-session acceptance remain release gates.

**Core acceptance scenario:** Create Hospital A and Hospital B, each with one owner doctor and one receptionist. Data created in A must only appear to authorized users in A; likewise for B. Repeat this across patients, appointments, queues, consultations, staff, admissions, payments, reports, and exports, including direct API calls with IDs from the other hospital.

## Verified starting points

- `ClinicUser.isOwner` already marks the doctor created during super-admin clinic provisioning. Staff mutations currently check only `DOCTOR` at the route level; the doctor creation route also allows `RECEPTIONIST`. Owner checks must be enforced in the API, not just hidden in the UI.
- Doctor deletion currently rejects doctors with clinical records because relations can cascade. A safe transfer requires a deliberate transaction and a decision about historical author identity.
- OPD collections come from payment receipts; IPD collections come from admission payments. `ReportsService.getDoctorDashboard` has a current-day date range and no requested date parameter. The dashboard and reports share query keys that need coordinated refresh.
- `calculatePaymentBalance` already computes an excess amount, while the consultation form blocks an overpayment. The backend and every payment entry path must agree on the resulting balance and receipt behavior.
- The appointments page already has follow-up confirmation and a `directCheckIn` checkbox. Queue sorting and direct consultation eligibility still need verification against the requested workflow.
- There is no registered service worker or web app manifest in the frontend today.

## Tasks

### T01 — Establish tenant and role invariants (P0)

- Inventory reads and writes in `backend/src/modules/{patients,appointments,queue,consultations,doctors,receptionists,admissions,billing,reports,clinics}`. Scope every record lookup, relation connect, update, and delete by the authenticated `clinicId`; verify referenced doctor, patient, appointment, and admission belong to the same clinic before writing.
- Resolve clinic and owner membership from the authenticated server session. Reject supplied foreign `clinicId` values and cross-clinic record IDs; do not rely on client-side filtering. Review auth token/session refresh so clinic switching or stale membership cannot expose another tenant.
- Add database indexes and composite constraints where needed for clinic-scoped lookups, while preserving existing records. Update `schema.prisma`, `schema.mysql.prisma`, production SQL artifacts, and a forward migration script whenever schema changes are necessary.
- Add API tests with the two-hospital fixture for list/detail/update/delete/export and negative direct-ID access. Verify staff and patient visibility for each doctor/receptionist pair.

**Done when:** A user from Hospital A cannot read or mutate Hospital B data through either screens or direct API calls; same-clinic staff see only their permitted records.

### T02 — Owner doctor controls staff; correct doctor form feedback (P0)

- Use `ClinicUser.isOwner` as the hospital admin marker. The super-admin-provisioned owner doctor may create, edit, activate/deactivate, and delete doctors and receptionists in that hospital. A regular doctor may edit only their own permitted profile fields. Receptionists cannot create or edit staff accounts. The super admin retains platform-level clinic/quota administration.
- Add reusable server-side owner authorization and apply it to doctor/receptionist mutation routes and clinic settings that are administrator-only. Keep staff lists readable where booking needs them; remove staff creation controls for receptionists and non-owner doctors. Expose `isOwner` in `/auth/me`/frontend auth types if missing.
- Wire Zod/API field errors to the matching Add Doctor form inputs; keep values after rejection and show a form-level message for conflicts such as email, registration number, or quota. Apply the same pattern to touched receptionist/staff forms.
- Check concurrent creation against quota in the service/transaction; verify active count semantics match the quota UI. Audit each staff mutation.

**Done when:** Only Hospital A's owner doctor can manage Hospital A staff; receptionist and regular doctor requests are rejected by the API; Add Doctor errors identify correctable fields.

### T03 — Reassign a doctor safely, then allow quota reduction (P0)

- Add an owner/super-admin initiated **transfer and deactivate/delete doctor** flow. Preflight the chosen source and destination doctors, both in the same clinic. The destination defaults to that clinic's owner doctor and cannot be the source. Protect the last active owner account from deletion.
- In one transaction, transfer current patient-doctor assignments, future/open appointments and queue entries, active admissions, and other operational ownership that should move to the destination. Preserve clinical history, prescriptions, receipts, audit entries, and original author attribution; do not trigger cascade deletion. Decide whether historical consultations should show the original clinician while appearing in the destination doctor's patient view.
- Provide a preview of counts, collision handling (duplicate patient links, conflicting slots, existing active consultation), a failure-safe rollback, and an audit record of source/destination/counts. Prefer deactivation plus reassignment if hard deletion cannot preserve required history; expose only a safe option in the UI.
- Correct super-admin quota checks to use the agreed active-staff count. After a successful transfer/deactivation, allow lowering doctor/receptionist quotas to the active count, never below it. Refresh staff counts and quotas immediately.

**Done when:** A doctor with patients/records can be removed from active staffing without losing clinical/financial history; the owner doctor receives the operational work, and quotas can then be reduced safely.

### T04 — Make OPD/IPD collection refresh immediately (P0)

- Trace every OPD receipt path and both IPD initial/interim payment paths. After a successful write, invalidate/refetch the exact doctor dashboard KPI key, reports key for each selected date, admission detail/list, billing and patient payment history keys, plus receptionist views where applicable. Use a shared query-key helper to avoid mismatches. Show the saved receipt only after server confirmation and guard double submits.
- Keep a server ledger as the source of truth; report collections by receipt/payment `createdAt` in the clinic timezone (Asia/Kolkata), not appointment or admission date. Show OPD and IPD separately and their sum where requested. Decide whether an owner sees clinic-wide IPD and whether a regular doctor sees only assigned OPD/IPD; enforce the agreed scope consistently.
- Add targeted API and UI tests for same-session and second-session updates. If a second logged-in browser must update without navigation, use bounded polling, focus refetch, or an event channel; measure the delay and document the choice.

**Done when:** A newly recorded OPD or IPD payment appears in the applicable Today's Collection/dashboard and financial report without a manual refresh, with no duplicate amount or cross-clinic amount.

### T05 — Date-selectable Financial & Clinical Analytics (P1)

- Add an editable date picker to `/reports`, defaulting to today's clinic date. Send a validated `YYYY-MM-DD` date to the reports API; use one timezone-safe date range for OPD and IPD receipts. Key the frontend query and export by doctor/clinic/date and label all metrics with the selected date.
- Show selected-day OPD and IPD collections and selected-day clinical activity. Review each KPI/trend so its date scope is explicit; retain historical trends only if labelled separately from the selected-day values. Update frontend types, report export workbook, docs/API contract, and database SQL/migration scripts for any schema or index change; record explicitly if no schema change is needed.
- Remove the **Cash Flow & Outstanding** panel from `ReportsPage.tsx` and remove only code, calculations, styles, and export rows used solely by that panel. Retain payment balances needed by billing, admission, and clinical workflows.
- Add tests for date boundaries, partial payments, multiple receipts on one day, no-data dates, and two-clinic isolation.

**Done when:** Choosing a date shows and exports that date's OPD/IPD figures and related clinical counts; the Cash Flow & Outstanding panel is gone.

### T06 — Open any authorized patient; prioritize Send to Dr (P1)

- Remove the UI/API requirement that reception must send a patient before a doctor opens an authorized appointment or patient consultation. A doctor may open/process a patient belonging to their clinic and assigned to them under the agreed assignment rule, including a directly created appointment. Keep cancelled/deleted and foreign-clinic records unavailable.
- Keep **Send to Dr** for reception as a useful workflow action. When used, put that appointment at the top of the assigned doctor's queue with a clear status/time marker; preserve a stable order among other patients. Avoid using the sent status as a consultation access gate.
- Remove the **Check in patient now (reception must still use Send to Dr)** checkbox and `directCheckIn` form behavior from the doctor dashboard/appointment creation flow. Set a clear server default status for new bookings and keep any independent reception check-in action only if still used by the workflow.
- Align `OpenConsultationButton`, appointment detail, queue service, and consultation service; cover doctor-created, reception-created, sent, unsent, and cross-clinic cases.

**Done when:** The assigned doctor can open any eligible hospital patient without the quoted validation; Send to Dr immediately moves that patient to the top of the appropriate doctor's list.

### T07 — Accept overpayments with correct accounting (P1)

- Remove the consultation form's `Amount to pay exceeds remaining balance` block and its warning. Permit any finite positive receipt amount, including partial and above-balance payments, for both authorized doctor and receptionist entry paths. Preserve invoice total and individual receipt history; show outstanding as zero and excess/credit separately when paid exceeds total.
- Check and align billing and IPD payment schema/service rules, receipt printing, status, reporting, and refunds/credits handling. Use decimal/cents-safe arithmetic. Do not silently increase the invoice total to match the payment or count the overpayment twice. Retain validation for negative, zero (when recording a receipt), malformed, and unreasonably large values.
- Add tests for partial, exact, excess, multiple payments, and OPD/IPD dashboard totals after an excess receipt.

**Done when:** Doctors and receptionists can save a valid payment above the remaining balance and see the actual collected amount with explicit excess/credit.

### T08 — Follow-ups and editable appointment calendar (P1)

- Ensure saving `nextVisitDate` in a consultation creates or updates one follow-up appointment for that doctor/patient/date, initially pending confirmation when no time is known. Show the patient's name on that date in the calendar and appointment list. Prevent duplicate follow-ups on repeated consultation saves.
- Let either doctor or receptionist confirm the visit after contacting the patient, including adding or changing its time. Add appointment-detail edit/reschedule controls directly from the calendar (date, time, doctor if authorized, notes/status as appropriate), using existing appointment PATCH where possible. Prevent cross-clinic moves and keep token/date conflicts consistent.
- Refresh the calendar, doctor queue, patient profile, and reports after confirmation/reschedule; preserve an audit trail of old and new slot values. Test follow-up creation, same-date display, blank-time confirmation, reschedule, cancellation, and timezone boundaries.

**Done when:** A follow-up appears on its planned date with the patient name; either role can confirm or reschedule it from the calendar, and all views agree immediately.

### T09 — PWA installation without caching patient data (P1)

**Progress:** Manifest, 192/512 icons, service worker, and production registration added. Production install/offline/logout verification remains open.

- Add `frontend/public/manifest.json` (name, short name, scope/start URL, standalone display, theme/background colors, and correctly sized 192/512 icons) and link it from `frontend/index.html`. Generate dedicated icons from the existing brand asset with permission/licensing retained.
- Add and register a versioned service worker through a maintained Vite PWA integration or a small explicit worker. Cache only versioned static assets and a safe navigation shell. Use network-first or no-store for authenticated HTML/API requests; never persist patient, appointment, auth, payment, or report responses in Cache Storage. Clear obsolete caches on activate and handle updates without interrupting a form submission.
- Verify installability, offline shell behavior, upgrade behavior, logout/account switch isolation, and deployment routing over HTTPS. Document clearly which workflows require a connection; do not queue sensitive writes offline unless a separate design is approved.

**Done when:** The app offers install on supported browsers, launches standalone, and loads its safe shell offline without exposing another user's cached clinical data.

### T10 — Performance and release gate (P1)

**Initial build baseline:** Production frontend build passes. Main JavaScript is 556.51 kB (150.62 kB gzip); the export workbook chunk is 940.76 kB (271.99 kB gzip). Vite flags both as large. Measure route-level load before choosing code splitting or dependency changes.

- Record current build size, key API timings, and query counts for dashboard, queue, reports, staff, and calendar using a representative two-clinic fixture. Optimize measured bottlenecks: indexes for clinic/date/doctor filters, bounded list pagination, selected fields, parallel independent queries, and lazy loading of large pages/export code. Avoid duplicate refetches while still meeting immediate-refresh behavior.
- Run backend/frontend typechecks, builds, and existing tests. Add only focused tests for the changed authorization, transfer, payment, date, queue, calendar, and PWA cache rules. Verify schema parity and execute migration against a copy of populated data before production.
- Manually exercise the acceptance matrix below on desktop/mobile, including two concurrent sessions and a full reload after each persisted change. Keep a rollback path and database backup for the doctor transfer migration.

**Done when:** Existing booking, consultation, billing, admission, authentication, and export flows pass; targeted regressions pass; measured key views are no slower than baseline.

## End-to-end acceptance matrix

| Scenario | Expected result |
| --- | --- |
| Reception A creates patient, appointment, or IPD payment for Doctor A | Doctor A sees the appropriate item and fresh totals; Doctor B/Reception B do not |
| Reception B uses Hospital A record ID in an API request | Rejected without exposing whether the foreign record exists |
| Regular doctor or receptionist tries staff mutation | Rejected; owner doctor can manage same-hospital staff |
| Owner doctor removes a doctor with history, then super admin reduces quota | Operational work transfers; history remains intact; quota can equal active count |
| Doctor opens unsent appointment; reception sends another patient | Doctor can process the first; sent patient moves to top of the relevant queue |
| Doctor sets follow-up date; either role confirms/reschedules | Patient appears on the correct calendar date and all views update |
| OPD/IPD payment is below, equal to, or above balance | Receipt saves; ledger/report totals agree; excess is identified |
| Date on reports changes | OPD/IPD and clinical figures/export change to selected date; removed panel stays absent |
| User logs out or switches clinic after PWA install | No previous patient's cached API content appears |

## Decisions to confirm before dependent implementation

1. **Doctor removal/history:** Should prior signed consultations and prescriptions retain the original doctor's name while the owner doctor receives current patients and future work? Recommended: yes, to preserve the clinical audit trail.
2. **Scope of doctor access:** Does “any patient” mean any patient in the same hospital, including patients assigned to another active doctor, or any patient assigned to that doctor regardless of Send to Dr status? Recommended: keep doctor assignment as the access boundary, and remove only the Send to Dr gate.
3. **Reports and today's collection:** Should each doctor's OPD total include only their own receipts, while IPD is hospital-wide, or should the owner see hospital-wide totals for both? This affects labels and authorization.
4. **Overpayment:** Should excess be stored as a patient credit usable on a later invoice, or shown as unapplied excess pending manual refund? Recommended for the first release: show unapplied excess and preserve every receipt; apply/refund only through a separately audited action.
5. **Doctor deletion:** Should the owner be able to hard-delete a doctor after all transferable relationships move, or is deactivation acceptable when signed clinical history exists? Recommended: deactivate the account and remove it from active quota while retaining historical attribution.

---

## Earlier backlog (retained for reference; active plan above wins on conflicts)

# MediNovel reliability and workflow remediation plan

## Objective

Fix the reported doctor, receptionist, IPD, payment, reporting, appointment, queue, clinic-settings, and staffing workflow issues without changing unrelated behavior, weakening tenant isolation, or bypassing existing server-side validation.

## Code findings

- IPD payments use `AdmissionPayment` (`backend/prisma/schema.prisma`) while current financial KPIs and trends query only OPD `PaymentReceipt` records (`backend/src/modules/reports/reports.service.ts`). This is why a successfully recorded IPD payment is not represented in reports.
- The admissions API already authorizes both `DOCTOR` and `RECEPTIONIST`, but `AdmissionsPage.tsx` limits the **Admit Patient** button and discharge controls to receptionists. It also has no success/error feedback for admission payment or discharge mutations.
- `Admission` has `admittedAt`, but the admit form does not display an admission date. The database currently assigns it at creation time.
- Doctor and receptionist quota enforcement is correctly present in `DoctorService` and `ReceptionistService`, but `StaffPage.tsx` always renders the add buttons/cards. The UI does not load or use the clinic's quota/count data to prevent the invalid action.
- The appointment form and service both impose the obsolete two-minute buffer. The UI defaults to a time two minutes ahead and blocks any current-minute time; the backend rejects it too.
- The appointment mutation invalidates `live-queue`, but it does not invalidate `doctor-kpis`; dashboard queries also use a different `live-queue` key shape. This can leave a doctor dashboard stale until its polling interval runs.
- The clinic-settings form invalidates its query but does not put the returned profile into the React Query cache. It also offers no visible success/error state based on the returned record. The server update is partial because it uses truthiness checks, which makes intentionally clearing supported optional values impossible.
- The appointment API already treats `reasonForVisit` as optional, but the booking form marks it as required.

## Implementation tasks

### 1. Standardize visible mutation feedback

**Files:** `frontend/src/features/admissions/AdmissionsPage.tsx`; review other touched screens for the same pattern.

- Add an accessible, dismissible or auto-clearing success/error feedback area for each user action affected by this work.
- Surface API error text through the existing `getApiErrorMessage` helper, including quota, invalid payment, admission, discharge, booking, and settings failures.
- On a successful IPD payment, show the amount and patient/admission reference; refresh both the admission card and any relevant report query.
- On successful discharge, show a confirmation such as: “Discharge completed. We wish the patient a healthy recovery.”
- Keep mutation buttons disabled/loading while their request is in flight; do not close a form or clear its data when its request fails.

**Acceptance:** Users always receive the backend’s safe, actionable response message for a failed add-doctor/add-receptionist/payment/discharge action, and a clear success confirmation for successful actions.

### 2. Complete IPD admission and discharge workflow for both roles

**Files:** `frontend/src/features/admissions/AdmissionsPage.tsx`, `backend/src/modules/admissions/admissions.schema.ts`, `backend/src/modules/admissions/admissions.service.ts`, `backend/src/modules/admissions/admissions.routes.ts`.

- Show **Admit Patient** to both doctor and receptionist logins, matching the existing API authorization.
- In the admit form, display an **Admission Date** field. Default it to today and define whether it is informational only or is a user-editable date persisted by the backend (see clarification 1).
- Separate the current combined “Payment / Discharge” action into clear actions or clearly separated modal sections.
- Show admission totals in the discharge UI: total collected, amount received, and any outstanding amount according to the agreed billing rule.
- Keep **Discharge Summary** mandatory in both frontend and Zod validation. Trim whitespace before validating so spaces cannot satisfy the requirement.
- Allow both roles to see and submit the discharge action, consistent with the requested workflow and existing shared admission API access.
- Preserve the existing protections: tenant-scoped lookup, cannot discharge twice, cannot record payment after discharge, and one active admission per patient.

**Acceptance:** A doctor and a receptionist can admit and discharge a patient; discharge requires a meaningful summary, displays collection totals, closes the admission, refreshes the list, and shows the healthy-recovery confirmation.

### 3. Make IPD payments auditable and visible in financial reporting

**Files:** `backend/prisma/schema.prisma`, `backend/prisma/schema.mysql.prisma`, production SQL/schema artifacts required by repository guidance, `backend/src/modules/admissions/*`, `backend/src/modules/reports/reports.service.ts`, `frontend/src/features/reports/ReportsPage.tsx`, frontend types.

- Decide and implement a single reporting model for IPD collections. Recommended: retain `AdmissionPayment` as the IPD ledger and query it explicitly in reports instead of inserting duplicate OPD `Payment`/`PaymentReceipt` rows.
- Add clinic ownership and creator/collector information to IPD payment records if needed for tenant-safe reporting and staff attribution. Add proper indexes for report date/clinic queries; update both development and production database schemas together.
- Return a distinct IPD collection metric and IPD daily trend/summary from the reports API. Do not merge it silently into “consultation fee revenue.”
- Add a clearly labelled **IPD Collections** section in Financial & Clinical Analytics with the requested collected amount and, if applicable, a period breakdown. Keep OPD consultation collections labelled separately.
- Include the recorded IPD payment in the selected admission’s payment history immediately after mutation success.
- Add a doctor-visible post-consultation collection reminder only after a consultation has successfully completed and only when its OPD payment remains unpaid/part-paid. Link it to the existing billing/payment flow; do not create a duplicate charge.

**Acceptance:** Recording an IPD payment creates one ledger entry, immediately appears in that admission, and appears under a separate IPD section in financial reports without inflating or duplicating OPD revenue.

### 4. Enforce staff quotas in the UI while retaining API protection

**Files:** `frontend/src/features/staff/StaffPage.tsx`, `frontend/src/types/index.ts`; optionally expose a lean quota endpoint/response if the existing clinic profile cannot be safely reused.

- Fetch clinic limits and active staff counts alongside staff lists, or return quota metadata with the staff-list response.
- Count only active doctors/receptionists, matching the backend quota semantics exactly.
- When the applicable quota is reached, hide or disable every corresponding **Add Doctor** / **Add Receptionist** control, including dashed “Add New” cards, header buttons, and any mobile presentation.
- Display useful quota context, for example “1 of 1 active receptionists”.
- Keep backend quota checks as the final authority and show the backend error if a concurrent staff creation fills the final slot first.
- Change the receptionist **Initial Password** input to `type="text"` as requested. Do not expose saved passwords later; this is only for the administrator entering the initial credential.

**Acceptance:** At quota, the role-specific add controls are unavailable for that clinic; concurrent requests remain safely rejected by the API with a human-readable message.

### 5. Fix appointment validation and doctor-side refresh

**Files:** `frontend/src/features/appointments/AppointmentsPage.tsx`, `backend/src/modules/appointments/appointments.service.ts`, related time tests, `frontend/src/features/doctor/DoctorDashboardPage.tsx`, `frontend/src/features/queue/QueuePage.tsx`.

- Replace the “at least two minutes from now” rule with “not in the past.” Define exact minute-boundary behavior in clarification 2.
- Update both client and server together so browser validation, API validation, defaults, and error text agree.
- Keep follow-up appointments with an intentionally blank time working as they do now.
- Make **Reason for Visit** optional in the appointment booking UI and preserve an empty value as `null`/empty per existing API conventions.
- After an appointment is created, invalidate/refetch the doctor dashboard KPI key and the exact doctor/date live-queue key, in addition to the existing appointment/reception keys. Preserve polling as a fallback, but do not rely on it for immediate correctness.
- Investigate the live-queue date filter with a known same-day 2 PM appointment and correct any mismatch between local UI date construction and backend `dateOnlyRange`/database storage. Add a regression test covering that exact case.

**Acceptance:** An appointment at the current allowed time can be saved; a past appointment cannot. New appointments appear promptly in the assigned doctor’s dashboard/queue and in the selected date’s Live Queue view.

### 6. Improve doctor queue and consultation payment guidance

**Files:** `frontend/src/features/queue/QueuePage.tsx`, `frontend/src/features/doctor/DoctorDashboardPage.tsx`, `frontend/src/features/consultation/ConsultationRoomPage.tsx`, billing query/types as needed.

- Ensure each actionable patient in the doctor’s **Appointment Schedule / Live Queue** has an obvious **Open Consultation** action. For a waiting patient, this may start the consultation then navigate; for an in-progress/completed patient, it should open the existing consultation safely without an invalid state change.
- Do not show an “Open Consultation” action that bypasses the backend’s required queue state.
- After successful consultation completion, display the collection reminder from task 3 only when payment is not fully settled.

**Acceptance:** Doctors can find and open the proper consultation workflow for every patient they are permitted to handle, and unpaid completed consultations receive a non-blocking collection reminder.

### 7. Make clinic settings save and refresh reliably

**Files:** `frontend/src/features/settings/ClinicSettingsPage.tsx`, `backend/src/modules/clinics/clinics.service.ts`, clinic types/tests.

- On a successful PATCH, update the `my-clinic` cache with the returned server record and then invalidate/refetch all dependent views that display clinic name/contact/token details.
- Show success/error feedback and retain entered data on errors.
- Normalize the API response shape so the update response contains the same fields that the GET profile screen consumes, or refetch before showing saved data.
- Replace server-side truthiness-based update guards with explicit `!== undefined` checks where optional fields can legitimately be cleared; preserve required-field validation.

**Acceptance:** Editing clinic name or any supported profile value is immediately visible in Clinic Settings and every in-app view that reads that cached clinic profile, including after a refresh.

### 8. Billing & POS dropdown defect

**Files to identify after reproduction:** likely `frontend/src/features/billing/BillingPage.tsx` plus its API/type source.

- Reproduce the dropdown state with browser/network evidence.
- Verify its options, selected value, labels, API-provided values, and empty/loading/error states.
- Fix only the identified mapping/rendering defect and add a focused regression test.

**Acceptance:** The dropdown displays the expected label/options and submitting billing data preserves the selected value.

## Regression and verification plan

1. Run backend typecheck, frontend typecheck/build, and all existing tests before and after changes.
2. Add backend tests for: doctor/receptionist admission and discharge authorization; blank discharge summary rejection; IPD payment creation/report isolation; quota behavior at and below limit; appointment now/past boundary; tenant isolation.
3. Add frontend/component or end-to-end coverage for: mutation feedback, quota-hidden controls, password visibility, optional reason-for-visit, immediate queue/dashboard refresh, settings cache update, discharge totals/message, and IPD report section.
4. Manually verify with separate doctor and receptionist sessions in the same clinic, plus a second clinic to confirm no cross-clinic staff, admissions, or financial data appear.
5. Do not alter existing OPD payment receipt accounting, consultation workflow state transitions, role guards, or production schema parity without test coverage.

## Clarifications needed before implementation

1. **Admission date:** Should it be read-only (today’s automatically recorded admission timestamp) or editable to record a past/future admission date? If editable, should time also be editable and are backdated admissions allowed?
2. **“Current time” appointment rule:** A browser can select only minutes, while the current instant includes seconds. Should “equal to the current displayed minute” be accepted for the whole minute, or should the earliest allowed value be the next minute when seconds have already passed? Recommended: accept the current selected minute and reject only earlier minutes.
3. **IPD totals:** Does `totalAmount` mean the final IPD bill, or should the system only record collections with no invoice/outstanding balance? Current code treats it as cumulative collected amount and always sets pending to zero. This decision determines the discharge “outstanding” calculation.
4. **Discharge authority:** The request says both doctors and receptionists should discharge. Should either role be allowed to discharge any active admission in its clinic, or only the attending doctor plus any receptionist?
5. **Consultation payment reminder:** Should the doctor merely see a reminder, or should the doctor also be able to record the payment? Recommended: reminder/link only; keep monetary collection with the existing billing workflow unless explicitly authorized otherwise.
6. **Billing & POS dropdown:** The report does not specify which dropdown or what it currently displays. Please provide its field label, expected options/default, and a screenshot or the malformed displayed text.
7. **“All forms” Reason for Visit:** Code currently has this field only on appointment booking. Confirm whether the request applies only there or whether you want a similarly named optional field added to other forms (admission, billing, consultation, etc.).
