# LiteSpeed, Prisma, and email deployment

Set these environment variables for the backend application. Keep the mailbox password in LiteSpeed/cPanel environment settings, never in source control.

```dotenv
SMTP_HOST=mail.medinovel.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=info@medinovel.com
SMTP_PASS=<the-info-at-medinovel-mailbox-password>
MAIL_FROM="MediNovel <info@medinovel.com>"
CONTACT_NOTIFY_EMAILS=info@medinovel.com
PRISMA_CLIENT_ENGINE_TYPE=library
PRISMA_TOKIO_WORKER_THREADS=2
```

After applying the database migration, restart the LiteSpeed Node application once. Configure it as one persistent application process; do not configure a request-spawned process or a high child-process count. The app retains one Prisma Client per Node process and caps the Tokio worker setting before Prisma loads.

Check the deployed process after restart with `ps -o pid,ppid,nlwp,cmd -C lsnode`. There should be only the configured persistent application process(es). If old `lsnode` processes remain, the hosting team must recycle them before evaluating NPROC usage.

Before enabling password resets, test `POST /api/auth/forgot-password` for a registered account and confirm the OTP email arrives from `info@medinovel.com`; then verify an unknown email returns `USER_NOT_FOUND`. Test a demo request and confirm its notification arrives at `CONTACT_NOTIFY_EMAILS`.
