## 2024-03-31 - [Insecure Randomness for Admin Temp Passwords]
**Vulnerability:** Weak random number generation (`Math.random()`) was used to generate temporary passwords for admins in `backend/src/services/admin.service.ts`.
**Learning:** This repo has custom logic for admin lifecycle. When reviewing such functions, ensuring crypto-safe random generation like `crypto.randomInt` over `Math.random` is key.
**Prevention:** Always use `crypto.randomBytes`, `crypto.randomInt`, or similar cryptographically secure PRNG when generating tokens, passwords, or authentication factors.
