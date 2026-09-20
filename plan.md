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
