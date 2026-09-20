-- Run once on an existing MySQL database before deploying the selected-day IPD report.
-- These indexes do not change or remove admission/payment records.
CREATE INDEX `admission_payments_admissionId_createdAt_idx`
  ON `admission_payments` (`admissionId`, `createdAt`);
CREATE INDEX `admission_payments_createdAt_idx`
  ON `admission_payments` (`createdAt`);
DROP INDEX `admission_payments_admissionId_idx` ON `admission_payments`;
