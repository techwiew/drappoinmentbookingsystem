# MediNovel password reset, email delivery, and Prisma process plan

## Objective

Replace the existing identity-question password reset screen with a secure email OTP flow, make demo-request notifications deliver from `info@medinovel.com`, and reduce avoidable Prisma runtime processes and Tokio threads on LiteSpeed without changing clinic workflows.

## Tasks

### T01 — SMTP configuration and reusable delivery service

- Configure SMTP for `mail.medinovel.com`, port `465`, SSL/TLS enabled, authenticated as `info@medinovel.com`.
- Keep the mailbox password only in `SMTP_PASS` on the server; never commit it or return it through an API.
- Create one reusable mail service with connection verification, HTML and text alternatives, sender display name, clear error logging, and startup-safe lazy initialization.
- Replace the contact module's Gmail default, invalid telephone `Reply-To`, and external hard-coded recipients. Route demo notifications to `CONTACT_NOTIFY_EMAILS`, defaulting to `info@medinovel.com`.

### T02 — Email OTP password reset API

- `POST /auth/forgot-password`: validate the email, reject unknown/inactive users with a visible `USER_NOT_FOUND` error, generate a cryptographically random six-digit OTP, store only its hash, and expire it after ten minutes.
- Send a branded MediNovel email from `info@medinovel.com` with subject `Your MediNovel password reset code` and the OTP. Never include the OTP in an API response or log.
- `POST /auth/verify-reset-otp`: validate the OTP, enforce expiry and a bounded attempt count, then issue a short-lived reset proof.
- Reuse the existing reset-password endpoint with the proof; update the password, revoke refresh sessions, and clear all reset state atomically.
- Update both Prisma schemas, SQL artifacts, and a forward migration for OTP attempt tracking.

### T03 — Password reset interface

- Step 1: email entry. Show an on-screen error when no active account exists.
- Step 2: six-digit OTP entry with a banner asking the user to check their inbox and Spam folder.
- Step 3: new password and confirmation fields, each with an eye control and accessible labels. Return to sign-in after success.
- Preserve clear loading, error, expiry, and invalid-code messages. Do not show the password or OTP after a completed reset.

### T04 — Demo request notification

- Keep the inquiry record as the source of truth and send a branded notification to the configured recipient after it is stored.
- Include clinic name, phone, clinic type, city, submission time, and a direct reply/contact action where an email is available.
- Surface a delivery configuration failure in server logs without exposing SMTP details to visitors.

### T05 — Prisma/LiteSpeed NPROC mitigation

- Keep one Prisma Client per Node process by retaining the singleton globally in every environment.
- Explicitly select the Prisma library engine and set a conservative configurable Tokio worker count before the client loads.
- Document required LiteSpeed process limits: one persistent Node application instance and no request-spawned `lsnode` children. The host must restart the application after deployment so stale processes release old engines.
- Add deployment environment variables and an operational verification checklist. Do not switch to Prisma's binary engine, which adds a child process per application instance.

### T06 — Verification

- Add focused tests for existing user, nonexistent user, expired/invalid OTP, verified reset, and contact delivery payloads.
- Run Prisma validation, backend/frontend typechecks, targeted tests, and production frontend build.
- Verify SMTP with the supplied mailbox password only in the deployed server environment or a local secret file excluded from Git.

## Completion conditions

- Active users reset their password through a ten-minute email OTP and no account can reset without a valid verification.
- Demo submissions are stored and notify `info@medinovel.com` through the configured SMTP account.
- Prisma runs one client per Node process and deployment configuration prevents unnecessary process/thread multiplication.

## Implementation status

T01-T05 are implemented. SMTP authentication to `mail.medinovel.com:465` has been verified with the configured mailbox credentials. Apply the OTP migration, run `prisma generate` in the deployed backend, set the documented environment variables in MilesWeb, and restart the Node application before enabling the feature in production.

---

# Appointment, prescription, and reception work (2026-09-20)

## Implemented tasks T07–T13

- T07: Replace the 10-digit Indian mobile rule with digits only, maximum 12, across patient, doctor, receptionist, clinic, and appointment forms and API validation.
- T08: Keep calendar and list views; open the appointment page in day calendar view and order list entries with active appointments before finished ones.
- T09: Allow assigned doctors to edit clinic prescriptions; allow doctor and reception roles to view, print, and download PDF copies from the archive.
- T10: Store and display before/after/with food timing for medicines through a forward migration, API, consultation form, archive, and document output.
- T11: Show in-consultation and queued counts separately, with appointment status changes invalidating the dashboard queries.
- T12: Let reception complete an appointment in `READY_FOR_DOCTOR` and open its billing form; keep clinical edits with the assigned doctor.
- T13: Local checks passed for TypeScript, Prisma schema, frontend build and tests, and focused backend workflow tests. The full backend API suite currently stops at its demo receptionist login fixture returning 401. The local backend build's Prisma generation step is blocked by a Windows DLL file lock; deployment must apply the food-timing migration and regenerate the client.

## New tasks: reception route and appointment ordering

### T14 — Verify and stabilize reception completion route

- Reproduce the reported `POST /api/queue/:id/reception-complete` 404 with the browser's authenticated session and compare responses directly from port 5000 and through Vite on port 5173.
- Confirm `queue.routes.ts` is mounted at `/api/queue`, the receptionist role is authorized, and the running backend process has loaded the current source/build. Restart the backend when an old process still serves a route table without this endpoint. If a deployed build is used, rebuild it before restart.
- Distinguish a missing route (404 `Route ... not found`) from an absent appointment (404 `NOT_FOUND`), missing login (401), wrong role (403), or invalid state (409). Show the returned error on the reception screen and keep the payment redirect only after success.
- Add an authenticated route test for receptionist success, wrong role, other clinic, and second submission. Verify the appointment is completed once and the billing form opens for its ID.

### T15 — Descending Appointment Schedule with completed last

- Define a shared display order: active/queued/in-consultation appointments first; completed at the bottom; cancelled/no-show after active records. Within each group, show newest appointment date/time first, then token number descending as a tie breaker. Keep calendar placement chronological by slot, since a calendar cannot reverse time meaningfully.
- Apply this order to the `/appointments` List view after date, doctor, search, and status filters. Preserve the selected day/week and list controls and keep records from the selected date only.
- Add a mixed-status ordering test, including duplicate times and appointments from different doctors. Confirm the list refreshes immediately after Send to Dr, completion, cancellation, and booking.

### T16 — Move doctor dashboard appointment list to the bottom

- Move `Today's Appointments (n)` below the dashboard's queue, current patient, follow-up, and stats sections.
- Apply the same display order to the shared appointment list on the doctor dashboard: pending/queue/in consultation at the top in descending time order, completed at the bottom. Keep the count and action buttons correct.
- Check the queue page's use of the shared `AppointmentList` so the new sorting does not disturb its live queue priority. If necessary, pass an explicit order mode from the doctor dashboard.
- Verify desktop and mobile layouts and run frontend typecheck, focused tests, and production build.

## Current finding

The route is present in `backend/src/modules/queue/queue.routes.ts`. At plan time, an unauthenticated POST to both `localhost:5000` and `localhost:5173/api` returned 401, showing the live route is registered through the proxy. The earlier browser 404 needs confirmation with the current authenticated session and backend process version.

## Status

T14–T16 are implemented. The completion route is registered and a route test covers receptionist success, unauthenticated and doctor requests, another clinic, and repeat submissions; the service now distinguishes a missing clinic appointment (404) from an invalid state (409). The reception screen explains a route-level 404 as an outdated backend process. Both appointment list views use a shared descending date/time order, with active entries first and completed entries last. The doctor dashboard appointment list is at the bottom. Focused backend and frontend tests, both TypeScript checks, and the frontend production build pass. A browser with an existing authenticated session still needs to be used for the final live completion/payment check.

### 2026-09-20 route-level 404 resolution

The local backend on port 5000 was running `node dist/index.js` from an older compiled build. The source route existed, but `backend/dist/modules/queue/queue.routes.js` did not contain `reception-complete`. Unauthenticated requests returned 401 at the router's shared authentication middleware, which had masked the missing route during earlier probes. Recompiled the backend with TypeScript and restarted the Node process. The compiled route now includes `reception-complete`. An authenticated receptionist request through the Vite proxy to a deliberately nonexistent appointment reaches the handler and returns 404 `Appointment not found in this clinic`, confirming the route-level 404 is resolved. The reported appointment `a997b8bf-871f-4c4f-a199-a01744c2537b` exists and is `READY_FOR_DOCTOR`, so reception can now click Complete & Record Payment. The actual appointment/payment flow remains for the user to exercise in the browser.
