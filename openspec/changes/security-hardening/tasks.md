# Tasks: Security Hardening Lookitry

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 300-400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 |
| Delivery strategy | ask-on-risk |
| Chain strategy | stacked-to-main |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Session/Auth Hardening | PR 1 | Base: main |
| 2 | Input Validation/Sanitization | PR 2 | Base: PR #1 |
| 3 | Logging/Audit/Network | PR 3 | Base: PR #2 |

## Phase 1: Authentication & Session Hardening (Kira)

- [x] 1.1 Implement secure cookie flags (httpOnly, secure, sameSite: strict) in backend/auth.
- [ ] 1.2 Update JWT handling to implement secure rotation strategy.
- [x] 1.3 Update session TTL in configuration.

## Phase 2: Input Validation & Sanitization (Kira)

- [ ] 2.1 Refactor input handling to use Zod schemas for all public-facing endpoints.
- [ ] 2.2 Implement robust sanitization middleware for `POST` requests.

## Phase 3: Monitoring & Audit (Nadia)

- [ ] 3.1 Setup centralized audit logging table for sensitive actions.
- [ ] 3.2 Integrate log ingestion into the application logic for auth events.

## Phase 4: Network & Security (Zephyr)

- [x] 4.1 Harden CORS configuration to restrict allowed origins dynamically per brand.
- [x] 4.2 Validate and restrict allowed network traffic to/from external services.
