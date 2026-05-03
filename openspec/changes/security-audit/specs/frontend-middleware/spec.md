# Frontend Middleware Specification

## Purpose

Protect `/dashboard` and `/admin` routes in Next.js App Router using JWT cookie validation.

## ADDED Requirements

### Requirement: Protected Route Interception

The frontend middleware MUST intercept all requests to `/dashboard` and `/admin` paths.

- GIVEN a user navigates to `/dashboard` without a valid JWT cookie
- WHEN the request reaches Next.js middleware
- THEN redirect to `/login`

- GIVEN a user navigates to `/admin` without a valid JWT cookie
- WHEN the request reaches Next.js middleware
- THEN redirect to `/login`

### Requirement: JWT Cookie Validation

The middleware MUST validate the JWT cookie using `NEXT_PUBLIC_JWT_SECRET`.

- GIVEN a request to a protected path with a JWT cookie
- WHEN the middleware extracts the token from `cookie.token`
- THEN verify using `jwt.verify(token, process.env.NEXT_PUBLIC_JWT_SECRET)`
- AND if invalid or expired, redirect to `/login`

### Requirement: Public Paths Bypass

The middleware MUST allow requests to public paths to bypass authentication.

- GIVEN a request to any of: `/login`, `/register`, `/planes`, `/pruebalo/*`, `/`, `/blog`
- WHEN the request reaches the middleware
- THEN pass through without redirect

### Requirement: Static Assets Bypass

The middleware MUST allow requests to static assets to bypass authentication.

- GIVEN a request to paths matching `/_next/*`, `/favicon.ico`, `/assets/*`
- WHEN the request reaches the middleware
- THEN pass through without redirect

### Requirement: API Routes Exclusion

The middleware MUST NOT intercept API routes (they handle their own auth).

- GIVEN a request to `/api/*`
- WHEN the request reaches the middleware
- THEN pass through without redirect

### Requirement: Supabase SDK Alternative

The middleware MAY use `@supabase/ssr` for cookie-based session validation.

- GIVEN `supabase` client configured with `NEXT_PUBLIC_SUPABASE_URL`
- WHEN validating session for protected route
- THEN `supabase.auth.getUser()` MAY be used instead of manual `jwt.verify()`

#### Scenario: Supabase session valid

- GIVEN `getUser()` returns a valid user
- WHEN on protected route
- THEN allow request to continue

#### Scenario: Supabase session invalid

- GIVEN `getUser()` returns no user or error
- WHEN on protected route
- THEN redirect to `/login`