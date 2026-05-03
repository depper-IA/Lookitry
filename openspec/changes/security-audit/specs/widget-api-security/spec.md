# Widget API Security Specification

## Purpose

Secure public-facing widget endpoints with dynamic CORS, rate limiting per brand/IP, and origin validation.

## ADDED Requirements

### Requirement: Dynamic CORS Origin Validation

Widget API endpoints MUST validate `Origin` header against allowed origins in `brands.allowed_origins`.

- GIVEN a request to `/api/pruebalo/:slug/generate` with `Origin: https://customer-site.com`
- WHEN the endpoint receives the request
- THEN verify `customer-site.com` is in `brands.allowed_origins` for the matching brand
- AND if not allowed, return `403 Forbidden: Origin not allowed`

#### Scenario: Allowed origin

- GIVEN brand `acme` has `allowed_origins = ['https://acme.com', 'https://shop.acme.com']`
- WHEN request arrives with `Origin: https://acme.com`
- THEN process request normally

#### Scenario: Disallowed origin

- GIVEN brand `acme` has `allowed_origins = ['https://acme.com']`
- WHEN request arrives with `Origin: https://evil-site.com`
- THEN return `403 Forbidden`

### Requirement: IP Whitelist from DB with Redis Cache

Rate limiter MUST support dynamic IP whitelists from `widget_ip_whitelist` table with 5-minute Redis cache.

- GIVEN a new IP is added to `widget_ip_whitelist`
- WHEN 5 minutes pass (cache expires)
- THEN the rate limiter MUST load the new IP on next check

- GIVEN cache is stale and Redis is available
- WHEN whitelist is requested
- THEN fetch from `widget_ip_whitelist` table

### Requirement: Per-Brand Rate Limiting

Widget endpoints MUST enforce rate limits per brand-slug.

- GIVEN brand `acme` receives 20 generation requests within 1 hour
- WHEN the 21st request arrives
- THEN return `429 Too Many Requests` with header `Retry-After: {seconds}`

#### Scenario: Under limit

- GIVEN brand `acme` has received 10 requests in current window
- WHEN another request arrives
- THEN allow request to proceed

### Requirement: Per-IP Rate Limiting

Widget endpoints MUST enforce rate limits per IP address.

- GIVEN an IP makes 50 requests within 15 minutes to `/api/pruebalo/*`
- WHEN the 51st request arrives
- THEN return `429 Too Many Requests`

### Requirement: Integration Key Validation

Widget endpoints MUST validate that the calling domain is registered.

- GIVEN a request to `/api/pruebalo/:slug/generate`
- WHEN `Origin` header is absent AND brand doesn't exist
- THEN fallback to IP-based validation

### Requirement: CORS Preflight Handling

Widget endpoints MUST handle CORS preflight (`OPTIONS`) requests correctly.

- GIVEN a preflight request to `/api/pruebalo/:slug/generate`
- WHEN the `Origin` header is valid
- THEN return `200 OK` with appropriate `Access-Control-Allow-*` headers

## Data Structures

### Table: `widget_ip_whitelist`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `brand_id` | uuid FK → brands NULLABLE | NULL = global whitelist |
| `ip_address` | text NOT NULL | IPv4 or IPv6 |
| `description` | text | Optional note |
| `is_active` | boolean DEFAULT true | |
| `created_at` | timestamptz | |

### Table: `brands` (additions)

| Column | Type | Notes |
|--------|------|-------|
| `allowed_origins` | text[] | Array of allowed CORS origins |

## Reuse

- Extend `backend/src/middleware/rateLimiter.ts` with `widgetOriginValidator` middleware
- Reuse existing `isWhitelistedSync()` for IP checks
- Reuse existing Redis cache pattern for `allowed_origins`