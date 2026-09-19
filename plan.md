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
