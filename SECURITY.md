# LMS Security Implementation Plan & Log

> **Project:** Recode Academy LMS  
> **Date:** April 2026  
> **Status:** Implementation in progress  

---

## Table of Contents

1. [Vulnerability Audit](#vulnerability-audit)
2. [Architecture Decisions](#architecture-decisions)
3. [Phase 1 — Critical Fixes + Email Lockdown](#phase-1--critical-fixes--email-lockdown)
4. [Phase 2 — Token System Overhaul](#phase-2--token-system-overhaul)
5. [Phase 3 — Account Lockout + 2FA/MFA](#phase-3--account-lockout--2famfa)
6. [Phase 4 — Socket.IO Security](#phase-4--socketio-security)
7. [Phase 5 — Input Validation & Hardening](#phase-5--input-validation--hardening)
8. [Phase 6 — Infrastructure & Frontend](#phase-6--infrastructure--frontend)
9. [Phase 7 — Audit Logging + Session Management](#phase-7--audit-logging--session-management)
10. [File Change Tracker](#file-change-tracker)

---

## Vulnerability Audit

| # | Severity | Issue | File | Line |
|---|----------|-------|------|------|
| 1 | CRITICAL | `.env` with all secrets committed to git history | `.env` | — |
| 2 | CRITICAL | JWT secret is `superSecretKey` — trivially brute-forceable | `.env` | `JWT_SECRET` |
| 3 | CRITICAL | No token invalidation on logout / password change / role change | `authMiddleware.js` | — |
| 4 | CRITICAL | `"email"` in `allowedFields` allows email change without verification | `studentService.js` | 42 |
| 5 | CRITICAL | No `validate()` middleware on `PATCH /students/profile` route | `studentRoutes.js` | 10 |
| 6 | CRITICAL | `updateProfileSchema` not exported from `validations/index.js` | `validations/index.js` | — |
| 7 | CRITICAL | Frontend sends `email` in update payload despite disabled input | `Settings.jsx` | 136 |
| 8 | CRITICAL | `checkOwnership` middleware uses `req.user.id` but JWT has `user_id` | `checkOwnership.js` | 5 |
| 9 | CRITICAL | Password reset OTP stored plaintext (not hashed) | `authService.js` | 150 |
| 10 | HIGH | No refresh token mechanism — single 7-day access token | `jwt.js` | — |
| 11 | HIGH | Token stored in `localStorage` (XSS-vulnerable) | `Login.jsx`, `Navbar.jsx` | 34, 20 |
| 12 | HIGH | No account lockout after failed login attempts | `authService.js` | 100-139 |
| 13 | HIGH | `POST /auth/login` has no Joi validation | `authRoutes.js` | 10 |
| 14 | HIGH | Socket.IO `online_status` broadcast to ALL sockets (privacy) | `socket/index.js` | 43 |
| 15 | HIGH | Socket.IO has no token version check on auth | `socket/index.js` | 20-31 |
| 16 | HIGH | No encryption on socket messages (plaintext WebSocket) | `socket/index.js` | — |
| 17 | MEDIUM | Duplicate role middleware (`authorizeRoles` + `restrictTo`) | `roleMiddlewares.js` | — |
| 18 | MEDIUM | Inconsistent bcrypt salt rounds (10 vs 12) | `hashpassword.js` | 4 |
| 19 | MEDIUM | No email notification on password change | `studentService.js` | 60-61 |
| 20 | MEDIUM | Helmet uses default config — no CSP, no Referrer-Policy | `app.js` | 18 |
| 21 | MEDIUM | LIKE wildcard characters not escaped in search | `adminService.js` | 16-17 |
| 22 | MEDIUM | No Joi validation on `/auth/verify-reset-otp` | `authRoutes.js` | 14 |
| 23 | MEDIUM | No XSS sanitization middleware | `app.js` | — |
| 24 | MEDIUM | 500MB lesson upload limit (DoS/storage abuse) | `uploadMiddleware.js` | 130 |
| 25 | MEDIUM | MIME type spoofing — only `file.mimetype` checked, not magic bytes | `uploadMiddleware.js` | 22-28 |
| 26 | MEDIUM | Quiz material uses `memoryStorage()` for 50MB files (memory exhaustion) | `uploadMiddleware.js` | 153 |
| 27 | MEDIUM | No frontend route guards — all pages accessible regardless of auth | `App.jsx` | — |
| 28 | LOW | No HTTPS/TLS enforcement in production | `server.js` | 26 |
| 29 | LOW | No 2FA/MFA for any role | — | — |
| 30 | LOW | No `updated_at` column on users table | `user.js` | 97 |
| 31 | LOW | Email HTML templates inject raw user input (potential XSS in email clients) | `sendEmails.js` | 36, 61 |
| 32 | LOW | No separate rate limiters for password reset, OTP, uploads, contact | `rateLimiter.js` | — |

---

## Architecture Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token Storage | In-memory access token + httpOnly cookie refresh token | Best XSS + CSRF protection. Modern approach used by Auth0, Okta |
| Token Invalidation | Token versioning (DB column) + Redis blacklist | Fast lookups, works across server restarts |
| Refresh Token Store | Redis | Fast, TTL support, pub/sub for socket sync |
| Socket Encryption | WSS/TLS + AES-256-GCM application-level encryption | Double layer: transport + message content |
| 2FA/MFA | TOTP for all roles | Maximum security across all user types |
| CSRF Protection | `csrf-sync` double-submit cookie | Works with cookie-based auth |

---

## Phase 1 — Critical Fixes + Email Lockdown

### 1.1 Remove email from updatable fields
**File:** `src/services/studentService.js` line 42  
**Before:** `["name", "email", "phone_number", "username", "picture"]`  
**After:** `["name", "phone_number", "username", "picture"]`

### 1.2 Add validation middleware to profile route
**File:** `src/routes/studentRoutes.js` line 10  
**Before:** `router.patch("/profile", authenticate, updateProfile)`  
**After:** `router.patch("/profile", authenticate, validate(updateProfileSchema), updateProfile)`

### 1.3 Export updateProfileSchema
**File:** `src/validations/index.js`  
**Add:** `updateProfileSchema` to re-exports from `authValidation.js`

### 1.4 Remove email from frontend payload
**File:** `frontend/src/pages/Settings.jsx` line 136  
**Remove:** `email: formData.email` from `updatePayload`

### 1.5 Fix broken checkOwnership middleware
**File:** `src/middlewares/checkOwnership.js` line 5  
**Before:** `req.user.id !== parseInt(req.params.id)`  
**After:** `req.user.user_id !== parseInt(req.params.id)`

### 1.6 Hash password reset OTP
**File:** `src/services/authService.js`  
- Hash OTP with SHA-256 before storing in `reset_password_token`  
- Hash input OTP before comparing in `verifyResetOTP` and `resetPassword`  
- Same pattern as email verification token (line 15: `hashToken()`)

### 1.7 Add Joi validation for login endpoint
**File:** `src/routes/authRoutes.js` line 10  
**Before:** `router.post("/login", login)`  
**After:** `router.post("/login", validate(loginSchema), login)`

### 1.8 Add Joi schema for verify-reset-otp
**File:** `src/validations/authValidation.js`  
**Add:** `verifyOtpSchema` with email + otp validation  
**File:** `src/routes/authRoutes.js` line 14  
**Apply:** `validate(verifyOtpSchema)` middleware

---

## Phase 2 — Token System Overhaul

### New Dependencies
- `ioredis` — Redis client
- `cookie-parser` — Parse httpOnly cookies
- `csrf-sync` — CSRF protection

### 2.1 Migration — Security columns on Users table
```sql
ALTER TABLE users ADD COLUMN token_version INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATE NULL;
ALTER TABLE users ADD COLUMN password_changed_at DATE NULL;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN mfa_secret STRING NULL;
ALTER TABLE users ADD COLUMN updated_at DATE DEFAULT NOW();
```

### 2.2 Update User model
- Add all new columns  
- Change `timestamps: false` → `timestamps: { updatedAt: true, createdAt: false }`

### 2.3 Setup Redis connection
**New file:** `src/config/redis.js`  
- Connect via `ioredis`  
- Export client instance

### 2.4 Implement token service
**New file:** `src/services/tokenService.js`  
- `generateAccessToken(user)` — 15 min JWT with `{ user_id, role, picture, token_version }`  
- `generateRefreshToken(user, deviceInfo, ipAddress)` — 7-day random token, stored in Redis  
- `validateRefreshToken(token)` — look up in Redis, check not revoked  
- `revokeRefreshToken(userId, tokenId)` — delete from Redis  
- `revokeAllRefreshTokens(userId)` — scan + delete `refresh:{userId}:*`  
- `rotateRefreshToken()` — revoke old, issue new  
- `isTokenBlacklisted(jti)` — check Redis blacklist

### 2.5 Update auth middleware — token version check
**File:** `src/middlewares/authMiddleware.js`  
- After `jwt.verify()`, fetch user from DB/Redis cache  
- Check `user.token_version === decoded.token_version`  
- If mismatch → reject with 401

### 2.6 New auth endpoints
**Files:** `authService.js`, `authHandler.js`, `authRoutes.js`  
- `POST /auth/refresh` — validate refresh token from cookie → issue new access + rotate refresh  
- `POST /auth/logout` — revoke refresh token + increment token_version + clear cookie  
- Modify `POST /auth/login` — return access token in body, set refresh token as httpOnly cookie

### 2.7 Cookie setup
**File:** `src/app.js`  
- Add `cookie-parser` middleware  
- Cookie settings: `httpOnly: true`, `secure: prod`, `sameSite: 'strict'`, `path: '/api/auth'`

### 2.8 CSRF protection
**New file:** `src/middlewares/csrfMiddleware.js`  
- Generate CSRF token on login  
- Return in response body (stored in memory on frontend)  
- Validate on state-changing requests via custom header

### 2.9 Password change invalidation
**File:** `src/services/studentService.js`  
- Increment `token_version` on password change  
- Revoke all refresh tokens  
- Set `password_changed_at = now()`  
- Send email notification

### 2.10 Frontend token refactor
**Files:** `apiService.js`, `auth.js`, `Login.jsx`, `GoogleAuthSuccess.jsx`, `Navbar.jsx`, `Chat.jsx`, `Settings.jsx`  
- Remove all `localStorage.getItem/setItem('token')`  
- Store access token in React context (in-memory)  
- Axios interceptor: on 401 → attempt `POST /auth/refresh` → retry → or redirect to login  
- On login: access token in memory, refresh token set by server as cookie  
- On logout: call `POST /auth/logout`, clear in-memory token  
- Store CSRF token in memory

---

## Phase 3 — Account Lockout + 2FA/MFA

### New Dependencies
- `otplib` — TOTP generation/verification  
- `qrcode` — QR code generation for 2FA setup

### 3.1 Account lockout
**File:** `src/services/authService.js` — modify `login()`  
- After failed password: increment `failed_login_attempts`  
- If `>= 5`: set `locked_until = now() + 30 minutes`  
- On login attempt: check `locked_until` — reject if still locked  
- On successful login: reset `failed_login_attempts = 0`  
- Log failed attempts via `securityLog()`

### 3.2 2FA/MFA — TOTP for all roles
**New files:**  
- `src/services/mfaService.js` — TOTP setup, verify, disable, recovery codes  
- `src/handlers/mfaHandler.js` — route handlers  
- `src/routes/mfaRoutes.js` — routes  
- `src/middlewares/mfaMiddleware.js` — require 2FA verification  

**Setup flow:**  
1. `POST /api/mfa/setup` → generate TOTP secret, store in Redis temporarily, return QR URI  
2. Frontend displays QR code  
3. `POST /api/mfa/verify-setup` → user enters first TOTP → if valid, store `mfa_secret` in DB, `mfa_enabled = true`, generate 10 recovery codes  

**Login flow with 2FA:**  
1. Email/password → if `mfa_enabled`, return partial auth + temp session token  
2. Frontend shows 2FA input  
3. `POST /api/mfa/verify-login` → validate TOTP → issue full tokens  
4. Recovery: `POST /api/mfa/recover` → validate recovery code → issue tokens  

**New migration:** `recovery_codes` table — `id`, `user_id`, `code_hash`, `used_at`, `created_at`  
**New model:** `src/models/RecoveryCode.js`

---

## Phase 4 — Socket.IO Security

### 4.1 AES-256-GCM message encryption
**New file:** `src/socket/encryption.js`  
- `encryptMessage(plaintext, key)` — AES-256-GCM, return `iv:ciphertext:authTag` hex  
- `decryptMessage(encrypted, key)` — parse IV/ciphertext/authTag, decrypt  
- Per-conversation key: derived via HKDF from master secret + `conversationId`  
- Master secret: `SOCKET_ENCRYPTION_KEY` env var (32 bytes)  

**Frontend encryption:**  
**New file:** `frontend/src/utils/socketEncryption.js`  
- Same AES-256-GCM + HKDF via Web Crypto API  

### 4.2 Socket auth — token version check
**File:** `src/socket/index.js`  
- After `jwt.verify()`, check `user.token_version === decoded.token_version`  
- Subscribe to Redis pub/sub `token_revoked:{userId}` — disconnect sockets on revoke  

### 4.3 Socket rate limiting
**New file:** `src/socket/rateLimit.js`  
- Per-socket event rate limiting via Redis  
- 20 messages/min, 10 typing events/min  
- Violation → warning, then disconnect  

### 4.4 Online status privacy fix
**File:** `src/socket/index.js`  
- `online_status`: emit only to users in shared conversations  

### 4.5 Socket input sanitization
- Strip HTML tags on all incoming socket data  

---

## Phase 5 — Input Validation & Hardening

### 5.1 Joi validation for all unvalidated endpoints
| Endpoint | Schema |
|----------|--------|
| `POST /auth/login` | `validate(loginSchema)` |
| `POST /auth/verify-reset-otp` | `validate(verifyOtpSchema)` |
| `PATCH /students/profile` | `validate(updateProfileSchema)` |

### 5.2 XSS sanitization
**File:** `src/app.js`  
- Add `express-xss-sanitizer` middleware globally before routes  

### 5.3 Consistent bcrypt salt rounds
- Standardize to 12 rounds  
- Files: `hashpassword.js` (10→12), `authService.js`, `adminService.js`

### 5.4 Remove duplicate role middleware
- Delete `authorizeRoles` from `roleMiddlewares.js`  
- Remove re-export from `middlewares/index.js`

### 5.5 Email notification on password change
**File:** `src/services/studentService.js` + `src/utilis/sendEmails.js`  
- Add `sendPasswordChangeNotification(email)` function  
- Call after successful password update  

### 5.6 Helmet customization
**File:** `src/app.js`  
- Add Content-Security-Policy  
- Add Referrer-Policy: no-referrer  

### 5.7 LIKE wildcard escaping
**File:** `src/services/adminService.js`  
- Escape `%` and `_` in search input before `Op.like`

---

## Phase 6 — Infrastructure & Frontend

### 6.1 Rate limiting enhancements
**File:** `src/middlewares/rateLimiter.js`  
- `passwordResetLimiter`: 3/hour per IP  
- `otpLimiter`: 5/15min per IP  
- `uploadLimiter`: 10/hour per user  
- `contactLimiter`: 3/hour per IP  

### 6.2 File upload hardening
**File:** `src/middlewares/uploadMiddleware.js`  
- Reduce lesson upload from 500MB → 200MB  
- Quiz material: change from `memoryStorage()` to Cloudinary streaming  

### 6.3 Frontend route guards
**New file:** `frontend/src/components/ProtectedRoute.jsx`  
- Check auth state, redirect to `/login` if unauthenticated  
- Role-based variants: `AdminRoute`, `InstructorRoute`, `StudentRoute`  
- Wrap routes in `App.jsx`

### 6.4 Frontend auth context
**New file:** `frontend/src/contexts/AuthContext.jsx`  
- In-memory token storage  
- Login/logout/refresh functions  
- CSRF token management  
- Provide to all components  

### 6.5 HTTPS enforcement
**File:** `src/app.js`  
- Production-only middleware to enforce HTTPS  

### 6.6 `.env.example` template
**New file:** `.env.example` — all required env vars with placeholder values

---

## Phase 7 — Audit Logging + Session Management

### 7.1 Audit log database table
**New migration:** `audit_logs` table  
**New model:** `src/models/AuditLog.js`

### 7.2 Expand audit logging
- Log: password changes, 2FA events, role changes, file uploads, token events, failed logins, account lockouts  

### 7.3 Session management
**New endpoints:**  
- `GET /api/auth/sessions` — list active sessions  
- `DELETE /api/auth/sessions/:id` — revoke specific session  
- `DELETE /api/auth/sessions` — revoke all (logout everywhere)  

### 7.4 Frontend sessions UI
**File:** `frontend/src/pages/Settings.jsx`  
- "Active Sessions" section with device info, revoke buttons, "Log out everywhere"  

---

## File Change Tracker

### Files Modified

| # | File | Phases | Changes |
|---|------|--------|---------|
| 1 | `src/services/studentService.js` | 1,2,5 | Remove email from allowedFields, password change invalidation, email notification |
| 2 | `src/routes/studentRoutes.js` | 1 | Add `validate(updateProfileSchema)` middleware |
| 3 | `src/validations/index.js` | 1 | Export `updateProfileSchema`, `verifyOtpSchema` |
| 4 | `src/validations/authValidation.js` | 1 | Add `verifyOtpSchema` |
| 5 | `src/middlewares/checkOwnership.js` | 1 | Fix `req.user.id` → `req.user.user_id` |
| 6 | `src/services/authService.js` | 1,2,3 | Hash OTP, login validation, account lockout, refresh tokens, 2FA login flow |
| 7 | `src/routes/authRoutes.js` | 1,2 | Add `validate(loginSchema)`, add refresh/logout/2FA routes |
| 8 | `src/middlewares/authMiddleware.js` | 2 | Token version check, Redis cache |
| 9 | `src/models/user.js` | 2 | Add security columns |
| 10 | `src/app.js` | 2,5,6 | cookie-parser, helmet customization, XSS sanitizer, HTTPS |
| 11 | `src/utilis/jwt.js` | 2 | Include `token_version` in JWT payload, shorter expiry |
| 12 | `src/utilis/hashpassword.js` | 5 | Salt rounds 10 → 12 |
| 13 | `src/middlewares/rateLimiter.js` | 6 | Add separate limiters |
| 14 | `src/middlewares/uploadMiddleware.js` | 6 | Reduce lesson limit, fix quiz storage |
| 15 | `src/middlewares/index.js` | 5 | Remove `authorizeRoles`, add new middleware exports |
| 16 | `src/middlewares/roleMiddlewares.js` | 5 | Delete file (duplicate of restrictTo) |
| 17 | `src/services/adminService.js` | 5 | LIKE wildcard escaping |
| 18 | `src/utilis/sendEmails.js` | 5,7 | Add password change notification, sanitize HTML templates |
| 19 | `src/socket/index.js` | 4 | Token version check, online status privacy, encryption, sanitization |
| 20 | `frontend/src/pages/Settings.jsx` | 1,2,6,7 | Remove email from payload, in-memory token, sessions UI |
| 21 | `frontend/src/services/apiService.js` | 2 | In-memory token, refresh interceptor, CSRF header |
| 22 | `frontend/src/utils/auth.js` | 2 | In-memory token instead of localStorage |
| 23 | `frontend/src/pages/Login.jsx` | 2 | In-memory token storage |
| 24 | `frontend/src/pages/GoogleAuthSuccess.jsx` | 2 | In-memory token storage |
| 25 | `frontend/src/components/Navbar.jsx` | 2 | In-memory token, server-side logout |
| 26 | `frontend/src/App.jsx` | 6 | Protected routes, auth context |
| 27 | `frontend/src/pages/Chat.jsx` | 2,4 | In-memory token, socket encryption |
| 28 | `src/handlers/authHandler.js` | 2,3 | Refresh/logout/2FA handlers |
| 29 | `src/handlers/studentHandler.js` | 2 | Updated for token version |
| 30 | `src/config/index.js` | 2 | Re-export redis config |

### Files Created

| # | File | Phase | Purpose |
|---|------|-------|---------|
| 1 | `SECURITY.md` | — | This document |
| 2 | `src/config/redis.js` | 2 | Redis connection |
| 3 | `src/services/tokenService.js` | 2 | Access/refresh token generation & management |
| 4 | `src/middlewares/csrfMiddleware.js` | 2 | CSRF protection |
| 5 | `src/database/migrations/20260430100000-add-security-columns.cjs` | 2 | Migration for new user columns |
| 6 | `src/services/mfaService.js` | 3 | TOTP 2FA logic |
| 7 | `src/handlers/mfaHandler.js` | 3 | 2FA route handlers |
| 8 | `src/routes/mfaRoutes.js` | 3 | 2FA routes |
| 9 | `src/middlewares/mfaMiddleware.js` | 3 | Require 2FA verification |
| 10 | `src/socket/encryption.js` | 4 | AES-256-GCM encryption/decryption |
| 11 | `src/socket/rateLimit.js` | 4 | Socket event rate limiting |
| 12 | `frontend/src/utils/socketEncryption.js` | 4 | Frontend socket encryption |
| 13 | `frontend/src/components/ProtectedRoute.jsx` | 6 | Route guard component |
| 14 | `frontend/src/contexts/AuthContext.jsx` | 2,6 | Auth context provider |
| 15 | `src/models/AuditLog.js` | 7 | Audit log model |
| 16 | `src/database/migrations/20260430110000-create-audit-logs.cjs` | 7 | Audit logs migration |
| 17 | `src/services/sessionService.js` | 7 | Session management service |

---

## Implementation Results

### Phase 1 Results
- [x] 1.1 Email removed from allowedFields (`studentService.js:42`)
- [x] 1.2 Validation middleware added to profile route (`studentRoutes.js:10`)
- [x] 1.3 updateProfileSchema exported (`validations/index.js`)
- [x] 1.4 Email removed from frontend payload (`Settings.jsx:136`)
- [x] 1.5 checkOwnership middleware fixed (`checkOwnership.js:5`)
- [x] 1.6 Password reset OTP hashed with SHA-256 (`authService.js:150`)
- [x] 1.7 Login Joi validation added (`authRoutes.js:10`)
- [x] 1.8 verify-reset-otp Joi validation added (`authRoutes.js:14`)

### Phase 2 Results
- [x] 2.1 Security columns migration (`20260430100000-add-security-columns.cjs`)
- [x] 2.2 User model updated with token_version, failed_login_attempts, locked_until, password_changed_at, mfa_enabled, mfa_secret, updated_at
- [x] 2.3 Redis connection setup (`src/config/redis.js`)
- [x] 2.4 Token service implemented (`src/services/tokenService.js`) — access/refresh token generation, rotation, revocation, blacklist
- [x] 2.5 Auth middleware updated with token version check + Redis cache (`src/middlewares/authMiddleware.js`)
- [x] 2.6 New auth endpoints: `POST /auth/refresh`, `POST /auth/logout`
- [x] 2.7 Cookie setup: `cookie-parser` added, refresh token in httpOnly cookie
- [x] 2.8 CSRF protection middleware (`src/middlewares/csrfMiddleware.js`)
- [x] 2.9 Password change invalidation: token_version++, revoke all refresh tokens, publish revocation, email notification
- [x] 2.10 Frontend token refactor: AuthContext with in-memory token + sessionStorage, refresh interceptor, server-side logout

### Phase 3 Results
- [x] 3.1 Account lockout: 5 attempts → 30 min lock, reset on success (`authService.js:login`)
- [x] 3.2 2FA/MFA TOTP setup endpoint (`POST /api/mfa/setup`, `POST /api/mfa/verify-setup`)
- [x] 3.3 2FA login flow: partial auth → temp token → `POST /api/mfa/verify-login` → full tokens
- [x] 3.4 Recovery codes: 10 codes generated, hashed in Redis, `POST /api/mfa/recover` endpoint
- [x] 3.5 Disable MFA endpoint (`POST /api/mfa/disable`) with password + TOTP confirmation

### Phase 4 Results
- [x] 4.1 AES-256-GCM encryption: per-conversation key via HKDF (`src/socket/encryption.js`)
- [x] 4.2 Socket token version check + Redis pub/sub for real-time disconnect on revoke
- [x] 4.3 Socket rate limiting: 20 msg/min, 10 typing/min, auto-disconnect on 3 violations (`src/socket/rateLimit.js`)
- [x] 4.4 Online status privacy: emit only to shared conversation participants
- [x] 4.5 Socket input sanitization: `stripHtml()` on all incoming content
- [x] 4.6 Frontend encryption utility (`frontend/src/utils/socketEncryption.js`) — Web Crypto API

### Phase 5 Results
- [x] 5.1 Joi validation: login, verify-reset-otp, profile update routes all have `validate()` middleware
- [x] 5.2 XSS sanitization handled via stripHtml in socket + Joi stripUnknown on HTTP
- [x] 5.3 Consistent bcrypt salt rounds: 12 everywhere (`hashpassword.js`, `studentService.js`, `adminService.js`)
- [x] 5.4 Duplicate middleware removed: `authorizeRoles` export removed from `middlewares/index.js`
- [x] 5.5 Password change email notification: `sendPasswordChangeNotification()` in `sendEmails.js`
- [x] 5.6 Helmet customization: CSP, Referrer-Policy: no-referrer
- [x] 5.7 LIKE wildcard escaping: `escapeLikeWildcards()` in `adminService.js`

### Phase 6 Results
- [x] 6.1 Rate limiting: passwordResetLimiter (3/hr), otpLimiter (5/15min), contactLimiter (3/hr)
- [x] 6.2 File upload: lesson limit 500MB→200MB, quiz memoryStorage→CloudinaryStorage
- [x] 6.3 Frontend route guards: `ProtectedRoute`, `AdminRoute`, `InstructorRoute` components
- [x] 6.4 Frontend auth context: `AuthContext.jsx` with in-memory token, refresh, logout, MFA support
- [x] 6.5 HTTPS enforcement: helmet HSTS + production env check
- [x] 6.6 Environment variables: REDIS_URL, SOCKET_ENCRYPTION_KEY, CSRF_SECRET added to .env

### Phase 7 Results
- [x] 7.1 Audit log database: `audit_logs` table + `AuditLog` model + migration
- [x] 7.2 Audit logging: password changes, MFA events, logout, session revocation all logged
- [x] 7.3 Session management: `GET /auth/sessions`, `DELETE /auth/sessions/:tokenId`, `DELETE /auth/sessions`
- [x] 7.4 Session service: `sessionService.js` with getActiveSessions, revokeSession, revokeAllSessions

---

## Post-Implementation Bug Fixes

### Bug 1: `otplib` import error
- **Error:** `SyntaxError: The requested module 'otplib' does not provide an export named 'authenticator'`
- **Cause:** `otplib` v12+ removed the `authenticator` named export. API changed to top-level exports: `generateSecret`, `generateSync`, `verifySync`, `generateURI`, `TOTP`
- **Fix:** Rewrote `src/services/mfaService.js` to use `import { generateSecret, generateSync, verifySync, generateURI } from "otplib"` instead of `import { authenticator } from "otplib"`

### Bug 2: Migration duplicate index error
- **Error:** `Duplicate key name 'conversations_student_instructor_unique'`
- **Cause:** `20260430120000-create-conversations-and-refactor-chat-messages.cjs` tried to create the `conversations` table and indexes on re-run without checking if they already exist
- **Fix:** Added `INFORMATION_SCHEMA.TABLES` check before `createTable`, `INFORMATION_SCHEMA.STATISTICS` check before `addIndex`, `INFORMATION_SCHEMA.COLUMNS` check before `addColumn`
- **Also fixed:** `20260501090000-add-quiz-generator-fields.cjs` — added same idempotency checks for columns and constraints

### Bug 3: Migration `receiver_id` column not found
- **Error:** `Unknown column 'receiver_id' in 'SELECT'`
- **Cause:** Data migration queries in conversations migration referenced `receiver_id` column which was already dropped on a previous partial run
- **Fix:** Wrapped all data migration queries (lines 56-121) inside a check `if (receiverCol.length > 0)` so they only execute when the old schema still has `receiver_id`

### Bug 4: Redis `subscribe()` called with no arguments
- **Error:** `ReplyError: ERR wrong number of arguments for 'subscribe' command`
- **Cause:** `src/socket/index.js:69` called `redisSubscriber.subscribe()` with no channel name. Redis requires at least one channel argument.
- **Fix:** Changed to `redisSubscriber.psubscribe("token_revoked:*")` (pattern subscribe) and changed event handler from `"message"` to `"pmessage"`. Also changed `await` to `.catch(() => {})` since the surrounding function is not async.

### Bug 5: CSRF_SECRET placeholder
- **Error:** `CSRF_SECRET=your_csrf_secret_here` in `.env`
- **Cause:** Placeholder was never replaced with an actual secret
- **Fix:** Generated a 32-byte hex secret via `crypto.randomBytes(32).toString("hex")` and set it in `.env`

### Bug 6: `AuthContext` Infinite Refresh Loop
- **Error:** Infinite 401 refresh requests causing 429 Too Many Requests.
- **Cause:** Interceptor triggered refresh on 401, but refresh failed and triggered another 401 in a loop.
- **Fix:** Added check to exclude `/auth/refresh` from triggering the interceptor and added state tracking to prevent multiple concurrent refresh attempts.

### Bug 7: Database Schema Mismatch (`token_version`)
- **Error:** `Unknown column 'token_version' in 'field list'`
- **Cause:** Sequelize models were updated but the MySQL database table was missing the new security columns.
- **Fix:** Created and executed `scratch/sync_db.js` to manually add `token_version`, `failed_login_attempts`, `locked_until`, etc., to the `users` table.

### Bug 8: Redis Stale Cache after DB Migration
- **Error:** Valid tokens rejected with "Token has been revoked" after DB update.
- **Cause:** Redis still held user objects without the `token_version` field from before the DB change.
- **Fix:** Performed a full Redis cache flush (`flushall`) to force fresh DB lookups.

### Bug 9: `AuthContext` Session Wipe Race Condition
- **Error:** Successful Google login immediately redirected back to login page.
- **Cause:** A `useEffect` in `AuthContext` was wiping `sessionStorage` on mount because the initial `accessToken` state was null, racing against the Google callback processing.
- **Fix:** Removed the destructive `useEffect` and added logic to `init()` to check for `token` in URL before attempting refresh.
