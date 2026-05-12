# Proposal: Security Audit Implementation

## Intent

Address critical security vulnerabilities identified in the recent system audit for Lookitry. This change is necessary to ensure the integrity, confidentiality, and availability of the platform by properly securing authentication mechanisms, authorization boundaries, and public-facing APIs.

## Scope

### In Scope
1. **JWT Secret Management**: Secure rotation, environment variable strictness, and separation of environments.
2. **Frontend Route Protection**: Robust route-level authorization in Next.js (App Router middleware).
3. **Widget API Security**: Securing public-facing endpoints (CORS, rate limiting, integration key validation).
4. **Token Lifetime**: Implementing short-lived access tokens and secure (HTTP-only) refresh token rotation.

### Out of Scope
- Full system penetration testing.
- Database-level Row Level Security (RLS) policies not directly related to authentication.
- Security of third-party payment integrations (Wompi/PayPal) beyond current session handling.

## Capabilities

### New Capabilities
- `widget-api-security`: Rate limiting, origin verification, and abuse protection for the Widget API.

### Modified Capabilities
- `user-auth`: Updating token generation, refresh logic, and lifetime management.
- `route-protection`: Enforcement of protected frontend routes via Next.js Middleware.

## Specs

| Domain | Spec File |
|--------|-----------|
| JWT Management | `specs/jwt-management/spec.md` |
| Frontend Middleware | `specs/frontend-middleware/spec.md` |
| Widget API Security | `specs/widget-api-security/spec.md` |
| Token Lifetime | `specs/token-lifetime/spec.md` |

## Approach

1. **JWT Secret Management**: Centralize JWT configuration, ensure secrets are strictly injected via `.env`, and implement logic to support key rotation.
2. **Frontend Route Protection**: Implement Next.js Middleware (`frontend/src/middleware.ts`) to intercept requests to protected paths, verifying the JWT cookie before allowing render.
3. **Widget API Security**: Apply strict CORS policies to widget endpoints, implement IP/origin-based rate limiting via Redis, and validate integration keys.
4. **Token Lifetime**: Reduce access token expiry (e.g., to 15-30 minutes) and issue long-lived refresh tokens stored exclusively in secure, HTTP-only, SameSite cookies.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/utils/jwt.ts` | Modified | Add dual-secret support, separate access/refresh generation |
| `backend/src/middleware/auth.ts` | Modified | Support token type checking and refresh endpoint |
| `backend/src/routes/auth.routes.ts` | Modified | Add `/api/auth/refresh` route |
| `frontend/src/middleware.ts` | New | Route protection for `/dashboard` and `/admin` |
| `backend/src/middleware/rateLimiter.ts` | Modified | Add origin validation for widget endpoints |
| `frontend/src/services/auth.service.ts` | Modified | Add silent refresh logic |

## New Data Structures

### Table: `widget_ip_whitelist`
| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands NULLABLE | NULL = global whitelist |
| `ip_address` | text NOT NULL | |
| `description` | text | |
| `is_active` | boolean DEFAULT true | |
| `created_at` | timestamptz | |

### Table: `brands` (additions)
| Column | Type | Notes |
|--------|------|-------|
| `allowed_origins` | text[] | Array of allowed CORS origins |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Active user session invalidation during deployment. | Medium | Temporarily support both old and new token formats/secrets during the transition window. |
| Widget breaking on legitimate client websites due to strict CORS. | Medium | Implement an "allowed origins" whitelist in Supabase `brands` table and validate dynamically. |

## Rollback Plan

If critical authentication failures occur in production, revert the backend deployment to the previous commit. Ensure the old JWT secret is still valid in the environment variables to allow existing tokens to function until the issue is patched. Disable the strict Next.js middleware temporarily if frontend routing loops occur.

## Dependencies

- Redis must be operational for rate limiting the Widget API.

## Success Criteria

- [ ] JWT secrets are strictly managed via environment variables without hardcoded fallbacks.
- [ ] Unauthenticated users attempting to access `/dashboard` or `/admin` are immediately redirected to `/login`.
- [ ] Widget API endpoints successfully block requests from unregistered origins and enforce rate limits.
- [ ] Access tokens expire quickly and are seamlessly refreshed in the background using HTTP-only cookies.