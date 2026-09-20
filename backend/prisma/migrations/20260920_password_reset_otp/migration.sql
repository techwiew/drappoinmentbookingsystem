-- Password-reset OTP verification attempt limit.
ALTER TABLE `users`
  ADD COLUMN `passwordResetAttempts` INTEGER NOT NULL DEFAULT 0;
