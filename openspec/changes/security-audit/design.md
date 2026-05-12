# Design: Security Audit - JWT, Middleware & Widget Security

## Technical Approach
The implementation will introduce dual JWT tokens (Access and Refresh) to enhance session security. It replaces the current monolithic long-lived token stored in a single cookie. To minimize backend load and securely enforce route protection at the edge, we will introduce a Next.js Edge Middleware (`frontend/src/middleware.ts`) using the `jose` library for fast access token validation. Additionally, a new Express middleware (`backend/src/middleware/widgetSecurity.ts`) will secure the widget APIs by utilizing dynamic CORS (checking `allowed_origins` from the `brands` table) and Redis-based rate limiting.

## Architecture Decisions

### Decision: Dual Token Strategy
**Choice**: Implement a short-lived Access Token (15m) and a longer-lived Refresh Token (7d) passed via HTTP-only cookies (`access_token` and `refresh_token`).
**Alternatives considered**: Keep the current single long-lived token, or use localStorage for tokens.
**Rationale**: Storing tokens in HTTP-only cookies protects against XSS attacks. A short-lived access token limits the exposure window if intercepted.

### Decision: JWT Verification Library in Next.js Middleware
**Choice**: Use the `jose` library for JWT verification.
**Alternatives considered**: Use `jsonwebtoken`.
**Rationale**: `jsonwebtoken` relies on Node.js core modules (`crypto`, `buffer`) which are not compatible with the Next.js Edge Runtime. `jose` is edge-compatible, standard-compliant, and highly performant for Edge middleware.

### Decision: Widget API Rate Limiting & Dynamic CORS
**Choice**: Implement Redis-based rate limiting per domain/IP, checking the `Referer/Origin` against an `allowed_origins` array in the `brands` table (cached in Redis).
**Alternatives considered**: In-memory rate limiting and static CORS.
**Rationale**: Redis ensures rate limits and caches are shared and respected across multiple backend instances. Dynamic CORS restricts widget usage strictly to authorized customer domains.

### Decision: Refresh Token Rotation
**Choice**: Implement token rotation where the Refresh Token is one-time use (blacklisted in Redis upon use).
**Alternatives considered**: Reusing the same Refresh Token for 7 days.
**Rationale**: Token rotation prevents replay attacks if a Refresh Token is stolen, immediately alerting the system to revoke all access for that user.

## Data Flow

### 1. Dual JWT Authentication Flow
    Client (Browser)                 Next.js App                 Express Backend
         │                               │                             │
         │─── POST /api/auth/login ─────►│─── Forward ────────────────►│
         │                               │                             │ Verify Credentials
         │                               │                             │ Generate Access & Refresh Tokens
         │◄── Set-Cookie (Access & Ref) ─│◄── Set-Cookie ──────────────│
         │                               │                             │

### 2. Frontend Edge Validation (Middleware)
    Client (Browser)                 Next.js Edge Middleware
         │                               │
         │─── Request /dashboard/* ─────►│ Read 'access_token' Cookie
         │                               │ Validate JWT with `jose`
         │                               │─── [Valid] ───► Render Page
         │                               │─── [Invalid] ─► Redirect to /login
         
### 3. Token Lifetime & Refresh Flow
    Client (Browser)                 Express Backend
         │                               │
         │─── POST /api/auth/refresh ───►│ Read 'refresh_token' Cookie
         │                               │ Validate Token signature & Check Redis Blacklist
         │                               │ Invalidate used token (save to Redis Blacklist)
         │                               │ Generate New Access & Refresh Tokens
         │◄── Set-Cookie (Access & Ref) ─│ Respond 200 OK

### 4. Widget Security Flow
    Widget Client                    Express Backend
         │                               │
         │─── Request /api/widget/* ────►│ widgetSecurity.ts
         │                               │ 1. Validate `Origin/Referer` vs `brand.allowed_origins`
         │                               │ 2. Check Rate Limit in Redis (e.g., 100 req/15min)
         │◄── 200 OK / 403 / 429 ────────│


## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/utils/jwt.ts` | Modify | Update to export `generateAccessToken`, `generateRefreshToken`, `verifyAccessToken`, and `verifyRefreshToken`. |
| `backend/src/types/index.ts` | Modify | Update `JwtPayload` to include `type: 'access' \| 'refresh'` and `jti` (JWT ID). |
| `backend/src/controllers/auth.controller.ts` | Modify | Update login/registration methods to generate dual tokens (`access_token` and `refresh_token` cookies). Add the `refresh` controller logic. |
| `backend/src/routes/auth.routes.ts` | Modify | Expose `POST /api/auth/refresh`. |
| `backend/src/middleware/widgetSecurity.ts`| Create | Express middleware enforcing dynamic CORS (`allowed_origins`) and Redis rate limiting. |
| `frontend/src/middleware.ts` | Create | Next.js Edge middleware to read `access_token` cookie and validate it via `jose` before allowing access to `/dashboard/*` or `/admin/*`. |

## Interfaces / Contracts

**JWT Payload:**
```typescript
// backend/src/types/index.ts
export interface JwtPayload {
  brandId?: string;
  adminId?: string;
  email: string;
  type: 'access' | 'refresh';
  jti?: string; // Unique Token ID for revocation
  iat?: number;
  exp?: number;
}
```

**Database Changes (Supabase):**
```sql
-- Migration to support Widget Security
ALTER TABLE brands ADD COLUMN allowed_origins text[] DEFAULT '{}';
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `jwt.ts` | Test generation and verification of both access and refresh tokens, including expiration. |
| Integration | `/api/auth/refresh` | Ensure refresh token generates new tokens, and blacklisted tokens are rejected. |
| Integration | `widgetSecurity.ts` | Mock Redis and Supabase to test allowed origins (403) and rate limit blocking (429). |
| E2E | Next.js Middleware | Verify that navigating to `/dashboard` without a valid `access_token` cookie redirects to `/login`. |

## Migration / Rollout

1. **DB Migration**: Add `allowed_origins` to `brands` table.
2. **Backward Compatibility**: During the transition, the backend auth middleware should fall back to accepting the legacy `token` cookie if `access_token` is missing. New logins will issue the new cookies.
3. **Rollout Sequence**: Deploy DB changes -> Deploy Backend -> Deploy Frontend. No downtime required.

## Open Questions

- [ ] What is the exact rate limit threshold for the Widget API? (e.g., 100 requests per 15 minutes per IP).
- [ ] For the Next.js Middleware, do we need to trigger a silent refresh token request if the access token is expired, or rely on the frontend client to catch 401s and call `/api/auth/refresh`?
