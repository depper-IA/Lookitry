# Token Lifetime Specification

## Purpose

Implement short-lived access tokens (15 min) with long-lived refresh tokens (7 days) in HTTP-only cookies.

## MODIFIED Requirements

### Requirement: Short-Lived Access Tokens

**Previously: Long-lived 7-day tokens stored in cookies**

Access tokens MUST have a maximum lifetime of 15 minutes.

- GIVEN a user successfully logs in
- WHEN the response is generated
- THEN return:
  - Access token in JSON body (15-minute expiry)
  - Refresh token in HTTP-only cookie `refresh_token` (7-day expiry)

#### Scenario: Access token expired

- GIVEN an access token is 16 minutes old
- WHEN any protected API endpoint is called
- THEN return `401 Unauthorized` with `{ error: 'ACCESS_TOKEN_EXPIRED', message: 'Token de acceso expirado' }`

### Requirement: Refresh Token Rotation

The system MUST support seamless background refresh of expired access tokens.

- GIVEN a valid `refresh_token` HTTP-only cookie exists
- WHEN client calls `POST /api/auth/refresh`
- THEN issue a new 15-minute access token in JSON body
- AND optionally rotate the refresh token (issue new 7-day cookie)

#### Scenario: Successful refresh

- GIVEN a valid refresh token cookie
- WHEN `POST /api/auth/refresh` is called
- THEN return `{ ok: true, accessToken: 'eyJ...' }` with fresh cookie

#### Scenario: Expired refresh token

- GIVEN an expired or invalid `refresh_token` cookie
- WHEN `POST /api/auth/refresh` is called
- THEN clear cookie and return `401 Unauthorized`

### Requirement: Refresh Endpoint Contract

`POST /api/auth/refresh` MUST:

1. Extract `refresh_token` from HTTP-only cookie
2. Validate signature using `JWT_SECRET` (or `JWT_SECRET_PREVIOUS` for rotation)
3. Verify token is not expired
4. If valid: generate new access token, return in JSON body
5. If invalid/expired: clear cookie, return `401`

#### Scenario: No refresh token cookie

- GIVEN a request to `POST /api/auth/refresh` without cookie
- THEN return `400 Bad Request: No refresh token provided`

#### Scenario: Refresh token from previous secret

- GIVEN a refresh token signed with `JWT_SECRET_PREVIOUS`
- WHEN `POST /api/auth/refresh` is called
- THEN validate with previous secret → success → issue new access token with current secret

### Requirement: Automatic Browser Refresh

The frontend MUST implement silent token refresh before access token expiry.

- GIVEN an access token will expire in 5 minutes
- WHEN the frontend makes an API call
- THEN the `auth.service.ts` MUST call `POST /api/auth/refresh` automatically
- AND update the stored access token

#### Scenario: Refresh fails (cookie expired)

- GIVEN the refresh cookie is expired
- WHEN automatic refresh is attempted
- THEN redirect user to `/login`

### Requirement: Logout Clears Both Tokens

Logout MUST invalidate both access and refresh tokens.

- GIVEN a user calls `POST /api/auth/logout`
- WHEN the request is processed
- THEN:
  - Add access token to Redis blacklist (TTL = remaining token lifetime)
  - Clear `token` cookie
  - Clear `refresh_token` cookie

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/refresh` | None (cookie) | Refresh access token |
| POST | `/api/auth/logout` | Optional | Invalidate tokens |

## Token Payload Structure

**Access Token (15 min):**
```json
{ "brandId": "uuid", "email": "brand@example.com", "type": "access", "iat": ..., "exp": ... }
```

**Refresh Token (7 days):**
```json
{ "brandId": "uuid", "email": "brand@example.com", "type": "refresh", "iat": ..., "exp": ... }
```

## Reuse

- Extend `backend/src/utils/jwt.ts` with `generateAccessToken(payload)` and `generateRefreshToken(payload)`
- Extend `backend/src/middleware/auth.ts` to support token type checking
- Add route in `backend/src/routes/auth.routes.ts`
- Extend `frontend/src/services/auth.service.ts` with silent refresh logic