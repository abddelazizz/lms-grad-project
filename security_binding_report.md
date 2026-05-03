# Security Binding & Inter-Module Communication Audit Report

> **Project:** Recode Academy LMS  
> **Date:** May 3, 2026  
> **Scope:** `frontend/`, `backend/` (read-only), `SECURITY.md`  
> **Auditor:** Automated Security Analysis  

---

## 1. Summary of Applied Security Principles

The following data binding and inter-module communication principles were extracted from `SECURITY.md` and used to guide this analysis:

| # | Principle | SECURITY.md Reference |
|---|-----------|----------------------|
| 1 | **In-memory token storage**: Access tokens must be stored in React context (in-memory), NOT in `localStorage`. `sessionStorage` is acceptable as a fallback for tab persistence. | Architecture Decisions, Phase 2.10 |
| 2 | **httpOnly cookie refresh tokens**: Refresh tokens must be set by the server as httpOnly cookies, never exposed to JavaScript. | Architecture Decisions, Phase 2.7 |
| 3 | **Axios refresh interceptor**: On 401 responses, the frontend must attempt `POST /auth/refresh` before redirecting to login. | Phase 2.10 |
| 4 | **CSRF token management**: CSRF tokens must be stored in-memory and sent via custom header on state-changing requests. | Architecture Decisions, Phase 2.8 |
| 5 | **Email excluded from update payloads**: The frontend must never send `email` in profile update requests. | Phase 1.4 (Vuln #7) |
| 6 | **Server-side logout**: Logout must call `POST /auth/logout` to revoke tokens server-side, not just clear local state. | Phase 2.10 |
| 7 | **Frontend route guards**: All authenticated pages must be wrapped in `ProtectedRoute` with role-based variants. | Phase 6.3 |
| 8 | **Socket encryption**: Chat messages must use AES-256-GCM encryption via `socketEncryption.js`. | Phase 4.1, 4.6 |
| 9 | **Socket auth with token version**: Socket connections must pass the access token and the backend verifies `token_version`. | Phase 4.2 |
| 10 | **Dual axios instance avoidance**: Components should use the `AuthContext`'s `api` instance (with interceptors) rather than the legacy `apiService.js` instance that reads from `localStorage`. | Phase 2.10 |
| 11 | **XSS sanitization on socket input**: All incoming socket data must be HTML-stripped. | Phase 4.5 |
| 12 | **`withCredentials: true`**: All axios instances communicating with the auth-cookie backend must set `withCredentials: true`. | Phase 2.7 |
| 13 | **`token_revoked` socket handling**: Frontend should listen for `token_revoked` events and force logout. | Phase 4.2 |

---

## 2. Front-End Findings

### CRITICAL — FE-01: Legacy `apiService.js` uses `localStorage` for token (XSS-vulnerable)

**File:** `frontend/src/services/apiService.js`  
**Lines:** 14–19  
**Description:** The legacy `apiService.js` axios instance reads the token from `localStorage.getItem('token')` in its request interceptor. Per SECURITY.md Vulnerability #11 and Phase 2.10, tokens must be stored in-memory (React context) — never in `localStorage`, which is accessible to any XSS payload. This instance is imported and used by **most pages** in the application (Settings, Signup, ForgotPassword, ResetPassword, VerifyEmail, Contact, CoursePlayer, Inbox, AdminDashboard, InstructorDashboard, CourseBuilder, InstructorUpload, QuizGenerator).

**Impact:** Any XSS vulnerability allows an attacker to steal the JWT from `localStorage` and impersonate the user.

**Remediation:**
- Replace the `localStorage` interceptor with one that accepts the token from the `AuthContext`.
- **Option A (recommended):** Remove the standalone interceptor entirely. Have all components import `api` from `AuthContext` (via `useAuth().api` or the exported `authApi`) instead of from `apiService.js`.
- **Option B:** Convert `apiService.js` to export service functions that accept an `api` instance parameter, then call them with the AuthContext's instance.

```diff
// frontend/src/services/apiService.js — Lines 6-22
 const api = axios.create({
   baseURL: API_BASE_URL,
   headers: {
     'Content-Type': 'application/json',
   },
+  withCredentials: true,
 });

-// Interceptor لإضافة الـ Token في كل طلب لو موجود
-api.interceptors.request.use((config) => {
-  const token = localStorage.getItem('token');
-  if (token) {
-    config.headers.Authorization = `Bearer ${token}`;
-  }
-  return config;
-}, (error) => {
-  return Promise.reject(error);
-});
+// Token is now injected by AuthContext interceptors.
+// This instance should only be used for unauthenticated calls (signup, forgot-password).
```

---

### CRITICAL — FE-02: `Settings.jsx` reads/writes token to `localStorage`

**File:** `frontend/src/pages/Settings.jsx`  
**Lines:** 129, 159, 168  
**Description:** `Settings.jsx` reads `localStorage.getItem('token')` on line 129 to check authentication, and writes tokens back to `localStorage` on lines 159 and 168 after profile updates. This directly contradicts SECURITY.md Phase 2.10's mandate to use in-memory token storage exclusively.

**Impact:** Persists the token in an XSS-accessible storage medium. Even if `AuthContext` properly uses in-memory storage, this page re-introduces the vulnerability.

**Remediation:**
```diff
// Line 129: Replace localStorage check with AuthContext
-    const token = localStorage.getItem('token');
-    if (!token) return toast.error('You must be logged in to save changes.');
+    // Auth check is now handled by ProtectedRoute and AuthContext

// Lines 158-160: Remove localStorage.setItem
-      if (response?.data?.token) {
-        localStorage.setItem('token', response.data.token);
-      }
+      // Token refresh is handled automatically by AuthContext interceptor

// Lines 167-169: Remove localStorage.setItem
-      if (photoResponse?.data?.token) {
-        localStorage.setItem('token', photoResponse.data.token);
-      }
+      // Token refresh is handled automatically by AuthContext interceptor
```

Additionally, `Settings.jsx` imports `studentService` from the legacy `apiService.js` (line 4), which uses the `localStorage`-based interceptor. It should instead use the `api` instance from `AuthContext`.

---

### CRITICAL — FE-03: `Settings.jsx` does not use `AuthContext` for API calls

**File:** `frontend/src/pages/Settings.jsx`  
**Lines:** 4, 47, 156, 165  
**Description:** `Settings.jsx` imports `studentService` from `../services/apiService` (line 4), which uses the legacy `localStorage`-based axios instance. All API calls (`getProfile` on line 47, `updateProfile` on line 156, `updatePhoto` on line 165) bypass the `AuthContext`'s secure axios instance that has refresh-token interceptors and in-memory token injection.

**Impact:** API calls from this page will fail silently when the access token expires (no auto-refresh), and continue using the insecure `localStorage` token path.

**Remediation:** Import `useAuth` and use the `api` instance from context:
```diff
-import { studentService } from '../services/apiService';
+import { useAuth } from '../contexts/AuthContext';

 const Settings = () => {
+  const { api } = useAuth();
   // ... replace studentService calls with direct api calls
```

---

### HIGH — FE-04: `apiService.js` missing `withCredentials: true`

**File:** `frontend/src/services/apiService.js`  
**Lines:** 6–11  
**Description:** The axios instance in `apiService.js` does not set `withCredentials: true`. Per SECURITY.md Phase 2.7, refresh tokens are stored in httpOnly cookies. Without `withCredentials`, the browser will not send these cookies with requests, breaking the refresh token flow for any component using this instance.

**Impact:** Refresh token cookies will not be sent, causing silent authentication failures.

**Remediation:**
```diff
 const api = axios.create({
   baseURL: API_BASE_URL,
   headers: {
     'Content-Type': 'application/json',
   },
+  withCredentials: true,
 });
```

---

### HIGH — FE-05: Missing CSRF token header on state-changing requests

**File:** `frontend/src/contexts/AuthContext.jsx`  
**Lines:** 89–98 (request interceptor)  
**File:** `frontend/src/services/apiService.js`  
**Lines:** 14–22 (request interceptor)  
**Description:** SECURITY.md Phase 2.8 mandates that a CSRF token be stored in-memory and attached as a custom `X-CSRF-Token` header on all state-changing requests. Neither the `AuthContext` axios instance nor the legacy `apiService.js` instance implements this. The backend `csrfMiddleware.js` checks for this header.

**Impact:** If CSRF protection is enforced on the backend, all POST/PATCH/DELETE requests will be rejected. Currently the middleware appears not to be applied globally, but it is a planned security control.

**Remediation:** Add CSRF token management to `AuthContext`:
```javascript
// In AuthContext, after login:
const [csrfToken, setCsrfToken] = useState(null);

// In request interceptor:
if (csrfToken && !['GET', 'HEAD', 'OPTIONS'].includes(config.method.toUpperCase())) {
  config.headers['X-CSRF-Token'] = csrfToken;
}
```

---

### HIGH — FE-06: `Sidebar.jsx` uses `getUserRole()` from legacy `auth.js` (reads `sessionStorage`)

**File:** `frontend/src/components/Sidebar.jsx`  
**Lines:** 3, 7  
**Description:** `Sidebar.jsx` imports `getUserRole` from `../utils/auth.js`, which reads and decodes the token from `sessionStorage`. While `sessionStorage` is better than `localStorage`, this creates a parallel token-reading path that bypasses `AuthContext`. The role should be read from `AuthContext.user.role`.

**Impact:** If the AuthContext token and sessionStorage token become out of sync (e.g., after refresh), the sidebar may show incorrect navigation items for the user's role.

**Remediation:**
```diff
-import { getUserRole } from '../utils/auth';
+import { useAuth } from '../contexts/AuthContext';

 const Sidebar = () => {
   const location = useLocation();
-  const role = getUserRole();
+  const { user } = useAuth();
+  const role = user?.role;
```

---

### HIGH — FE-07: `ProfileSidebar.jsx` uses legacy `auth.js` utilities

**File:** `frontend/src/components/ProfileSidebar.jsx`  
**Lines:** 2, 6–7  
**Description:** `ProfileSidebar.jsx` imports `getUserRole` and `getUserInfo` from `../utils/auth.js`, reading from `sessionStorage` instead of `AuthContext`. It also imports `notificationService` from the legacy `apiService.js` (line 3), bypassing secure interceptors.

**Impact:** Same token desync risk as FE-06. Notification API calls use insecure token path.

**Remediation:**
```diff
-import { getUserRole, getUserInfo } from '../utils/auth';
-import { notificationService } from '../services/apiService';
+import { useAuth } from '../contexts/AuthContext';

 const ProfileSidebar = () => {
-  const role = getUserRole();
-  const user = getUserInfo();
+  const { user, api } = useAuth();
+  const role = user?.role;
```

---

### HIGH — FE-08: `Inbox.jsx` uses legacy `getUserRole()` and `apiService`

**File:** `frontend/src/pages/Inbox.jsx`  
**Lines:** 4–5, 12  
**Description:** Uses `getUserRole` from `auth.js` (line 5, 12) and `inboxService`/`notificationService` from legacy `apiService.js` (line 4). Both bypass AuthContext.

**Remediation:** Switch to `useAuth()` for role and API instance.

---

### HIGH — FE-09: Chat.jsx socket does not use message encryption

**File:** `frontend/src/pages/Chat.jsx`  
**Lines:** 86–104 (handleSend), 26–33 (receive_message)  
**Description:** SECURITY.md Phase 4.1/4.6 mandates AES-256-GCM encryption for all socket messages via `socketEncryption.js`. However, `Chat.jsx` sends plaintext messages via `socketRef.current.emit('send_message', data)` (line 94) and receives them without decryption (line 29). The encryption utilities exist in `frontend/src/utils/socketEncryption.js` but are never imported or used.

**Impact:** Chat messages are transmitted in plaintext over the WebSocket connection.

**Remediation:**
```diff
+import { encryptMessage, decryptMessage } from '../utils/socketEncryption';

 // In handleSend (line 86-104):
-    socketRef.current.emit('send_message', data);
+    const encryptedMsg = await encryptMessage(newMessage, conversationId);
+    socketRef.current.emit('send_message', { ...data, content: encryptedMsg });

 // In receive_message handler (line 26-33):
-    setMessages(prev => [...prev, { ...data, type: 'received', text: data.message }]);
+    const decryptedMsg = await decryptMessage(data.message, data.conversation_id);
+    setMessages(prev => [...prev, { ...data, type: 'received', text: decryptedMsg }]);
```

---

### HIGH — FE-10: Chat.jsx socket event schema mismatch with backend

**File:** `frontend/src/pages/Chat.jsx`  
**Lines:** 89–94 (send), 164 (field name)  
**Description:** The frontend emits `send_message` with `{ receiverId, message }` (lines 89–94), but the backend socket handler (`src/socket/index.js` line 164) expects `{ conversationId, content }`. This is a complete data binding mismatch — messages sent from the frontend will never be processed by the backend.

**Impact:** The chat feature is functionally broken. Messages are silently dropped.

**Remediation:**
```diff
 const handleSend = () => {
     if (!newMessage.trim() || !selectedContact) return;

     const data = {
-      receiverId: selectedContact.user_id,
-      message: newMessage
+      conversationId: selectedContact.conversation_id, // requires conversation_id from contacts API
+      content: newMessage
     };

     socketRef.current.emit('send_message', data);
```

---

### HIGH — FE-11: Chat.jsx missing `token_revoked` socket listener

**File:** `frontend/src/pages/Chat.jsx`  
**Lines:** 21–43 (socket initialization)  
**Description:** SECURITY.md Phase 4.2 specifies that the frontend must listen for `token_revoked` events and disconnect/redirect to login. `Chat.jsx` does not register this listener.

**Impact:** If a user's token is revoked (e.g., password change, admin action), the socket connection stays alive, potentially allowing continued access.

**Remediation:**
```javascript
// Add after line 40:
socketRef.current.on('token_revoked', () => {
  toast.error('Your session has been terminated. Please log in again.');
  logout();
  window.location.href = '/login';
});
```

---

### MEDIUM — FE-12: `GoogleAuthSuccess.jsx` exposes access token in URL query parameter

**File:** `frontend/src/pages/GoogleAuthSuccess.jsx`  
**Lines:** 15, 24–25  
**Description:** The Google OAuth callback passes the access token as a URL query parameter (`?token=...`). This token is readable from browser history, server logs, and referrer headers. Per SECURITY.md Phase 2.10, tokens should not be exposed in URLs.

**Impact:** Token leakage via URL. While the backend sets this up, the frontend should at minimum clear the URL immediately.

**Remediation:** The URL is cleaned by navigation, but explicitly clear history state:
```diff
     if (token) {
       googleLogin(token);
+      window.history.replaceState({}, document.title, '/auth/google/success');
       toast.success('Logged in with Google successfully!');
```

---

### MEDIUM — FE-13: `Signup.jsx` and `ForgotPassword.jsx` use legacy `apiService`

**File:** `frontend/src/pages/Signup.jsx` — Line 4  
**File:** `frontend/src/pages/ForgotPassword.jsx` — Line 4  
**File:** `frontend/src/pages/ResetPassword.jsx` — Line 4  
**File:** `frontend/src/pages/VerifyEmail.jsx` — Line 4  
**Description:** These pages import from the legacy `apiService.js`. While these are pre-authentication flows (no token needed), the `apiService` instance lacks `withCredentials: true`, which means any server-set cookies (e.g., CSRF cookies) won't be sent.

**Remediation:** Add `withCredentials: true` to the legacy `apiService.js` instance (see FE-04), or use the `authApi` export from `AuthContext`.

---

### MEDIUM — FE-14: `Sidebar.jsx` logout link navigates to `/login` without server-side logout

**File:** `frontend/src/components/Sidebar.jsx`  
**Line:** 131  
**Description:** The sidebar logout link `<Link to="/login" ...>Logout</Link>` performs a client-side navigation to `/login` without calling `POST /auth/logout` to invalidate the refresh token server-side. Per SECURITY.md Phase 2.10, logout must revoke server-side tokens.

**Impact:** The refresh token remains valid in Redis. An attacker who obtained the refresh cookie can continue generating new access tokens.

**Remediation:**
```diff
-<li><Link to="/login" className="nav-menu-item text-danger"><i className="fas fa-sign-out-alt"></i> <span>Logout</span></Link></li>
+<li><button onClick={async () => { await logout(); window.location.href = '/login'; }} className="nav-menu-item text-danger border-0 bg-transparent w-100 text-start"><i className="fas fa-sign-out-alt"></i> <span>Logout</span></button></li>
```
(Requires importing `useAuth` and destructuring `logout`.)

---

### MEDIUM — FE-15: `AdminDashboard.jsx` uses legacy `apiService` for all operations

**File:** `frontend/src/pages/AdminDashboard.jsx`  
**Lines:** 5, 46–47, 58, 74, 94, 113, 133, 143, 160, 175  
**Description:** All admin API calls use the legacy `apiService` with `localStorage` token. Admin operations (adding/removing users) are highly privileged and should use the secure AuthContext instance.

**Remediation:** Import `useAuth` and use `api` from context for all admin service calls.

---

### MEDIUM — FE-16: Missing `withCredentials` on socket connection

**File:** `frontend/src/pages/Chat.jsx`  
**Lines:** 22–24  
**Description:** The socket.io client connection does not include transport-level credentials. If the backend relies on cookies for any socket-level operations, they won't be sent.

**Remediation:**
```diff
 socketRef.current = io(API_BASE.replace('/api', ''), {
-  auth: { token: accessToken }
+  auth: { token: accessToken },
+  withCredentials: true,
 });
```

---

### MEDIUM — FE-17: `Chat.jsx` socket reconnects on every `selectedContact` change

**File:** `frontend/src/pages/Chat.jsx`  
**Lines:** 21–43 (useEffect dependency: `[selectedContact]`)  
**Description:** The socket `useEffect` depends on `selectedContact`, meaning a new socket connection is created every time the user clicks a different contact. This leaks socket connections and bypasses rate limiting (new socket = fresh rate limit counters).

**Impact:** Potential resource exhaustion and rate-limit bypass.

**Remediation:** Separate socket initialization from contact selection:
```diff
 // Socket initialization - run once
-useEffect(() => {
-  socketRef.current = io(...);
-  // ...handlers...
-  return () => socketRef.current.disconnect();
-}, [selectedContact]);
+useEffect(() => {
+  socketRef.current = io(...);
+  return () => socketRef.current.disconnect();
+}, [accessToken]); // reconnect only on token change
```

---

### LOW — FE-18: `Contact.jsx` sends raw form data without client-side sanitization

**File:** `frontend/src/pages/Contact.jsx`  
**Lines:** 29  
**Description:** The contact form submits user input directly to the API without any HTML stripping or sanitization. While the backend may sanitize, defense-in-depth requires frontend sanitization too (SECURITY.md Phase 5.2).

**Remediation:** Strip HTML tags from text fields before submission.

---

### LOW — FE-19: `auth.js` utility functions are redundant with `AuthContext`

**File:** `frontend/src/utils/auth.js`  
**Lines:** 1–34  
**Description:** `getUserRole()` and `getUserInfo()` duplicate functionality already available in `AuthContext.user`. They decode the JWT from `sessionStorage`, creating a parallel data path. Six components use these functions instead of `AuthContext`.

**Remediation:** Deprecate `auth.js`. All consumers should use `useAuth()` from `AuthContext`.

---

### LOW — FE-20: `CoursePlayer.jsx` imports default `api` from legacy `apiService`

**File:** `frontend/src/pages/CoursePlayer.jsx`  
**Line:** 5, 72  
**Description:** Uses the default `api` export from `apiService.js` directly for fetching course details. Bypasses AuthContext interceptors.

**Remediation:** Use `useAuth().api` for authenticated API calls.

---

## 3. Back-End Findings (No Modifications Proposed)

> **⚠️ NOTICE:** No modifications were made or are proposed for any back-end files. All findings below are informational observations for a human developer.

---

### BE-01: CSRF middleware exists but is not applied to any route

**File:** `src/middlewares/csrfMiddleware.js` — Lines 1–23  
**File:** `src/app.js` — Lines 62–81  
**Description:** The `csrfMiddleware` is implemented and exported but is never `app.use()`'d in `app.js` nor applied to any route. SECURITY.md Phase 2.8 specifies CSRF protection for all state-changing requests. The middleware uses `csrf-sync` but the `generateToken`/`validateToken` imports on line 1 appear incorrect — `csrf-sync` exports `csrfSynchronisedProtection`, not `generateToken`.

**Observation:** The CSRF protection layer is effectively non-functional.

---

### BE-02: `roleMiddlewares.js` still exists despite SECURITY.md Phase 5.4 marking it for deletion

**File:** `src/middlewares/roleMiddlewares.js` — Lines 1–21  
**Description:** SECURITY.md Phase 5.4 states: "Delete `authorizeRoles` from `roleMiddlewares.js`" and "Remove re-export from `middlewares/index.js`". The file still exists with the `authorizeRoles` function, creating duplicate role-checking middleware alongside `restrictTo.js`.

**Observation:** Duplicate middleware increases maintenance burden and confusion about which one is authoritative.

---

### BE-03: Google OAuth callback does not set refresh token as httpOnly cookie

**File:** `src/services/authService.js` — Lines 318–356  
**Description:** The `googleAuth` function (line 318) generates only an access token via `generateAccessToken(user)` (lines 326, 341, 354) but does not generate a refresh token or set it as an httpOnly cookie. The token is passed to the frontend via URL query parameter. Per SECURITY.md Phase 2.6/2.7, login must set a refresh token as an httpOnly cookie.

**Observation:** Google OAuth users have no refresh token mechanism, meaning their session expires after 15 minutes with no way to silently refresh.

---

### BE-04: Login handler sets refresh token cookie but `allowedHeaders` in CORS may block CSRF header

**File:** `src/app.js` — Line 39  
**Description:** CORS `allowedHeaders` is set to `["Content-Type", "Authorization"]`. If CSRF protection is enabled (BE-01), the `X-CSRF-Token` header sent by the frontend will be blocked by CORS preflight, causing all state-changing requests to fail.

**Observation:** `X-CSRF-Token` must be added to `allowedHeaders` when CSRF is enabled.

---

### BE-05: Socket `send_message` handler saves plaintext alongside encrypted content

**File:** `src/socket/index.js` — Lines 183–196  
**Description:** The backend saves the `sanitizedContent` (plaintext) to the database via `chatService.saveMessage` (line 183), then also creates an `encrypted_content` field (line 193). The plaintext is emitted in the `content` field (line 192) alongside `encrypted_content`. This defeats the purpose of encryption — the plaintext is always available.

**Observation:** For true end-to-end encryption, only encrypted content should be stored and transmitted. The current implementation is encryption-in-transit at best, with plaintext at rest.

---

### BE-06: `encryptMessage` in `src/socket/encryption.js` is called synchronously but may be async

**File:** `src/socket/index.js` — Line 185  
**Description:** `encryptMessage(sanitizedContent, conversationId)` is called without `await`. If `encryptMessage` is an async function (using Node.js `crypto` promises), it would return a Promise object instead of the encrypted string.

**Observation:** Verify that the backend `encryptMessage` is synchronous, or add `await`.

---

### BE-07: No input validation on several route handlers

**File:** `src/routes/contactRoutes.js` — No `validate()` middleware  
**File:** `src/routes/enrollmentRoutes.js` — No `validate()` middleware  
**File:** `src/routes/notificationRoutes.js` — No `validate()` middleware  
**Description:** SECURITY.md Phase 5.1 emphasizes Joi validation for all endpoints. Several routes accept user input without validation middleware.

**Observation:** Unvalidated input could lead to injection or unexpected behavior.

---

### BE-08: Session management endpoints lack rate limiting

**File:** `src/routes/authRoutes.js` — Lines 18–20  
**Description:** The session endpoints (`GET /sessions`, `DELETE /sessions/:tokenId`, `DELETE /sessions`) use `authenticate` but no rate limiter. A compromised token could be used to rapidly enumerate or revoke sessions.

**Observation:** Apply rate limiting to session management endpoints.

---

## 4. Cross-Module Binding Summary

| Frontend File | Backend Endpoint | Binding Status | Issue |
|--------------|-----------------|----------------|-------|
| `apiService.js` (all services) | All `/api/*` routes | ⚠️ **Insecure** | Uses `localStorage` token (FE-01) |
| `Settings.jsx` | `PATCH /api/students/profile` | ⚠️ **Insecure** | `localStorage` read/write (FE-02) |
| `Chat.jsx` → `send_message` | `socket: send_message` | ❌ **Broken** | Schema mismatch: `{receiverId, message}` vs `{conversationId, content}` (FE-10) |
| `Chat.jsx` → encryption | `socket/encryption.js` | ❌ **Missing** | Encryption utils exist but are never called (FE-09) |
| `Chat.jsx` → `token_revoked` | `socket: token_revoked` | ❌ **Missing** | Backend emits event but frontend doesn't listen (FE-11) |
| `Sidebar.jsx` → logout | `POST /api/auth/logout` | ❌ **Missing** | Navigates to `/login` without API call (FE-14) |
| `AuthContext.jsx` → CSRF | `csrfMiddleware.js` | ❌ **Missing** | Neither side is operational (FE-05, BE-01) |
| `GoogleAuthSuccess.jsx` | Google OAuth callback | ⚠️ **Partial** | No refresh token set (BE-03) |
| `Sidebar.jsx` / `ProfileSidebar.jsx` | AuthContext | ⚠️ **Desync** | Read from `sessionStorage` not context (FE-06, FE-07) |

---

## 5. Prioritized Remediation Roadmap

| Priority | Issue IDs | Action | Effort |
|----------|-----------|--------|--------|
| 🔴 P0 | FE-01, FE-02, FE-03 | Eliminate all `localStorage` token usage; route all API calls through AuthContext's `api` instance | Medium |
| 🔴 P0 | FE-10 | Fix socket `send_message` payload to match backend schema (`conversationId`/`content`) | Low |
| 🟠 P1 | FE-09 | Integrate `socketEncryption.js` into `Chat.jsx` send/receive paths | Low |
| 🟠 P1 | FE-04 | Add `withCredentials: true` to legacy `apiService.js` | Trivial |
| 🟠 P1 | FE-14 | Replace Sidebar logout link with server-side logout call | Low |
| 🟠 P1 | FE-06, FE-07, FE-08 | Replace all `auth.js` utility usage with `useAuth()` | Low |
| 🟡 P2 | FE-05 | Implement CSRF token storage and header injection in AuthContext | Medium |
| 🟡 P2 | FE-11 | Add `token_revoked` socket listener for forced logout | Low |
| 🟡 P2 | FE-15, FE-20 | Migrate remaining pages to AuthContext API instance | Medium |
| 🟢 P3 | FE-12, FE-17, FE-19 | Clean up minor issues (URL token exposure, socket reconnection, deprecated utils) | Low |

---

*End of Report — Generated May 3, 2026*
