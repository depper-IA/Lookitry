# JWT Management Specification

## Purpose

Secure JWT lifecycle management including strict env-based secret loading, configurable expiry, and key rotation support.

## ADDED Requirements

### Requirement: JWT Secret Strict Load

The backend MUST load `JWT_SECRET` exclusively from `process.env` at startup. No hardcoded fallbacks are permitted.

- GIVEN the backend service starts
- WHEN `JWT_SECRET` is absent from environment
- THEN the process MUST crash immediately with error `JWT_SECRET no está definido`

#### Scenario: Valid secret loaded

- GIVEN `JWT_SECRET` is set in `.env`
- WHEN the service starts
- THEN `generateToken()` and `verifyToken()` use the secret without error

### Requirement: Dual-Secret Key Rotation

The system SHOULD support rotating JWT secret without immediate session invalidation.

- GIVEN `JWT_SECRET` and `JWT_SECRET_PREVIOUS` are both set in environment
- WHEN `verifyToken()` fails with current secret
- THEN retry verification with `JWT_SECRET_PREVIOUS` before rejecting
- AND if both fail, return `401 Unauthorized`

#### Scenario: Token from previous secret

- GIVEN a token was signed with old secret
- WHEN it arrives at `verifyToken()`
- THEN current secret verification fails → retry with PREVIOUS → success

### Requirement: Access Token Short Expiry

Access tokens MUST have a maximum lifetime of 15 minutes.

- GIVEN `generateAccessToken()` is called
- WHEN a brand authenticates
- THEN issue token with `expiresIn: '15m'`

### Requirement: Refresh Token Long Expiry

Refresh tokens MUST have a maximum lifetime of 7 days.

- GIVEN `generateRefreshToken()` is called
- WHEN a brand authenticates
- THEN issue token with `expiresIn: '7d'`
- AND store in HTTP-only cookie `refresh_token`

### Requirement: Separate Token Generation

The system MUST provide distinct functions for access and refresh tokens.

- `generateAccessToken(payload)` → 15-minute token
- `generateRefreshToken(payload)` → 7-day token

#### Scenario: Both tokens generated on login

- GIVEN a brand logs in successfully
- WHEN login completes
- THEN return access token in body AND set refresh token cookie