# Lookitry - Revenue & Payment Evidence

**Last Updated:** May 31, 2026
**Submission:** https://www.geminixprize.com

---

## 1. Payment Architecture

### 1.1 Supported Payment Methods

| Method | Currency | Status | Integration |
|--------|----------|--------|-------------|
| **Wompi** | COP (Colombian Pesos) | ✅ Active | https://checkout.wompi.com |
| **PayPal** | USD (US Dollars) | ✅ Active | PayPal Express Checkout |
| **Bank Transfer** | COP | ✅ Enterprise | Manual verification |
| **Cash** | COP | ✅ Enterprise | Manual verification |

### 1.2 Payment Flow (Wompi)

```
User selects plan
    ↓
Backend generates Wompi checkout URL
    ↓
User redirected to Wompi (hosted checkout)
    ↓
Wompi processes payment
    ↓
Wompi webhook → POST /api/payments/wompi/webhook
    ↓
Backend validates signature & updates subscription
    ↓
User redirected to /pago-exitoso
```

**Webhook Endpoint:** `POST https://api.lookitry.com/api/payments/wompi/webhook`

### 1.3 Wompi Configuration (Environment Variables)

```bash
WOMPI_PUBLIC_KEY       # Wompi merchant public key
WOMPI_PRIVATE_KEY      # Wompi merchant private key
WOMPI_INTEGRITY_SECRET # Webhook signature verification
```

---

## 2. Database Schema

### 2.1 `subscription_payments` Table

Records all payment transactions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `brand_id` | UUID | FK to brands |
| `amount` | INTEGER | Amount in smallest currency unit (COP cents, USD cents) |
| `currency` | TEXT | 'COP' or 'USD' |
| `status` | TEXT | 'pending', 'completed', 'failed' |
| `payment_method` | TEXT | 'wompi', 'paypal', 'transfer', 'cash' |
| `payment_date` | TIMESTAMP | When payment was confirmed |
| `reference` | TEXT | External payment reference (Wompi transaction ID) |
| `plan` | TEXT | 'BASIC', 'PRO', 'ENTERPRISE' |
| `months` | INTEGER | Subscription duration |
| `created_at` | TIMESTAMP | Record creation |

### 2.2 `brands` Table (Revenue-Related Fields)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `name` | TEXT | Brand/company name |
| `email` | TEXT | Contact email |
| `plan` | TEXT | Current plan |
| `subscription_status` | TEXT | 'active', 'trial', 'expired', 'suspended' |
| `plan_started_at` | TIMESTAMP | Subscription start |
| `plan_expires_at` | TIMESTAMP | Subscription end |
| `referral_code` | TEXT | Referral program |
| `referred_by` | UUID | FK to brands (referrer) |

### 2.3 `pricing_config` Table

Dynamic pricing configuration (no hardcoded prices).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `plan` | TEXT | 'BASIC', 'PRO', 'ENTERPRISE' |
| `monthly_price_cop` | INTEGER | Monthly price in COP |
| `annual_price_cop` | INTEGER | Annual price in COP |
| `monthly_price_usd` | INTEGER | Monthly price in USD cents |
| `annual_price_usd` | INTEGER | Annual price in USD cents |
| `is_active` | BOOLEAN | Whether this pricing is active |

---

## 3. Pricing Structure (Live from Database)

### 3.1 Current Active Pricing

| Plan | Monthly (COP) | Annual (COP) | Monthly (USD) | Annual (USD) |
|------|---------------|--------------|---------------|---------------|
| **BASIC** | $180,000 | $1,620,000 | $45 | $405 |
| **PRO** | $350,000 | $3,150,000 | $87.50 | $787.50 |
| **ENTERPRISE** | Custom | Custom | Custom | Custom |

**Source:** Retrieved from `pricing_config` table, not hardcoded.

### 3.2 Trial Pricing

| Trial | Price | Duration |
|-------|-------|----------|
| 7-day Trial | $20,000 COP | 7 days |

---

## 4. Payment API Endpoints

### 4.1 Public Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/payments/wompi/webhook` | POST | Wompi payment confirmation |
| `GET /api/payments/wompi/config` | GET | Public payment configuration |
| `GET /api/payments/wompi/checkout-url` | GET | Generate Wompi checkout URL |
| `GET /api/payments/wompi/transaction/:id` | GET | Check transaction status |

### 4.2 Admin Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/admin/revenue/payments` | GET | List all payments |
| `GET /api/admin/revenue/summary` | GET | Revenue summary |
| `POST /api/admin/subscriptions/:id/payment` | POST | Manual payment registration |

---

## 5. Revenue Service Code Reference

### 5.1 Payment Processing (wompi.service.ts)

```typescript
// Key function: verifyAndProcessPayment
// Validates Wompi webhook signature
// Updates subscription_payments table
// Activates brand subscription

const result = await wompiService.verifyAndProcessPayment(webhookPayload);
// Returns: { success: boolean, payment_id: string, subscription_id: string }
```

### 5.2 Subscription Activation Flow

```
1. Webhook received from Wompi
2. Validate HMAC-SHA256 signature
3. Check transaction already processed (idempotency)
4. Upsert payment record in subscription_payments
5. Update brand subscription_status → 'active'
6. Set plan_expires_at based on months purchased
7. Return success
```

---

## 6. Admin Dashboard Revenue Features

### 6.1 Revenue Metrics Available

- Total revenue (COP/USD)
- Payments by status (completed, pending, failed)
- Revenue by plan (BASIC, PRO, ENTERPRISE)
- Revenue by payment method (Wompi, PayPal)
- Monthly/annual trends
- Failed payment tracking

### 6.2 Screenshot Evidence

Admin dashboard available at: `https://lookitry.com/admin/revenue`

---

## 7. Wompi Integration Details

### 7.1 Wompi Merchant ID

Configured via `WOMPI_PUBLIC_KEY` environment variable.

### 7.2 Webhook Security

All Wompi webhooks are validated using HMAC-SHA256:

```typescript
const isValid = wompiService.validateWebhookSignature(
  payload,
  signature,
  integritySecret
);
```

### 7.3 Idempotency

Duplicate webhooks are detected and ignored using transaction reference.

---

## 8. Subscription Plans Available

| Plan | Features | Target |
|------|----------|--------|
| **BASIC** | 50 generations/month, 1 brand | Small stores |
| **PRO** | 200 generations/month, 3 brands | Growing brands |
| **ENTERPRISE** | Unlimited, custom integrations | Large retailers |
| **TRIAL** | 3 free generations | Prospect evaluation |

---

## 9. Evidence URLs

| Evidence | URL |
|----------|-----|
| **Payment Webhook** | `https://api.lookitry.com/api/payments/wompi/webhook` |
| **Admin Revenue Dashboard** | `https://lookitry.com/admin/revenue` |
| **Wompi Portal** | https://merchant.wompi.com |
| **PayPal Dashboard** | https://seller.paypal.com |

---

## 10. Code References

| File | Purpose |
|------|---------|
| `backend/src/services/wompi.service.ts` | Wompi integration |
| `backend/src/controllers/wompi.controller.ts` | Payment webhook handler |
| `backend/src/services/subscription.service.ts` | Subscription management |
| `backend/src/services/admin/payment.admin.service.ts` | Admin revenue queries |
| `backend/src/controllers/revenue.controller.ts` | Revenue API |
| `backend/src/routes/wompi.routes.ts` | Payment routes |

---

**This document demonstrates the complete payment and revenue infrastructure of Lookitry, showing real payment integrations with Wompi and PayPal for processing real transactions.**

**Payment system is live and processing transactions at: https://api.lookitry.com**