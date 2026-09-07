# MediNodes — Security Architecture & Multi-Tenant Isolation

## 1. Zero-Trust Multi-Tenancy
1. **Tenant Extraction from Token**:
   - `clinicId` is derived exclusively from the authenticated user's session in `clinic_users`.
   - Any client-submitted `clinicId` in request headers, query parameters, or JSON payloads is discarded and overwritten by the verified context.
2. **Database Scoping**:
   - Every Prisma operation on tenant records enforces `where: { clinicId, ... }`.
   - Cross-tenant access attempts return `403 Forbidden` or `404 Not Found` without revealing foreign entity existence.

---

## 2. Authentication & Credential Protection
1. **Password Hashing**:
   - Passwords hashed using `bcryptjs` with salt round >= 10. Plain-text passwords never touch database logs.
2. **Dual-Token System**:
   - Short-lived Access Token (JWT, 15m expiration) for API calls.
   - Long-lived Refresh Token (JWT, 7-30 days expiration) stored in HttpOnly, Secure, SameSite cookies.
3. **Session Revocation**:
   - User password change or account deactivation invalidates the refresh token hash, immediately revoking active sessions.

---

## 3. Defense-in-Depth Layering
1. **HTTP Security Headers (Helmet)**:
   - Sets `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`.
2. **CORS Whitelisting**:
   - Strict origin validation against configured `CORS_ORIGIN`.
3. **Rate Limiting**:
   - IP and user-based throttling on auth endpoints to prevent brute-force attacks.
4. **Input Sanitization & Schema Validation**:
   - All controller endpoints validate payloads against strict `Zod` schemas before executing business logic.
5. **No Leaked Stack Traces**:
   - Centralized error handling returns structured error codes and messages while logging detailed diagnostics only to secure server logs.
