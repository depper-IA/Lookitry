# Lookitry Project — Agent Reference Guide

## Agent Workspaces

Each agent has a dedicated workspace in `/home/travis/.openclaw/workspaces/`.

| Agent | Workspace | Last Known Task |
|-------|-----------|-----------------|
| WebWizard | `workspaces/webwizard` | Frontend (Next.js 14, Tailwind) |
| DevGuardian | `workspaces/devguardian` | Testing & Security |
| DataAlchemist | `workspaces/dataalchemist` | Supabase, MinIO, n8n |
| GrowthPilot | `workspaces/growthpilot` | Brevo, WooCommerce, referidos |
| ArchitectAI | `workspaces/architectai` | Docker, Traefik, VPS deploy |

## OpenClaw Config

Gateway config: `/home/travis/.openclaw/openclaw.json`

```json
{
  "agents": {
    "defaults": { "model": "minimax/MiniMax-M2.7" },
    "list": [
      { "id": "sammy", "name": "Sammy", "workspace": "/home/travis/Lookitry/Lookitry/sammy", "default": true },
      { "id": "webwizard", "name": "WebWizard", "workspace": "/home/travis/.openclaw/workspaces/webwizard" },
      { "id": "devguardian", "name": "DevGuardian", "workspace": "/home/travis/.openclaw/workspaces/devguardian" },
      { "id": "dataalchemist", "name": "DataAlchemist", "workspace": "/home/travis/.openclaw/workspaces/dataalchemist" },
      { "id": "growthpilot", "name": "GrowthPilot", "workspace": "/home/travis/.openclaw/workspaces/growthpilot" },
      { "id": "architectai", "name": "ArchitectAI", "workspace": "/home/travis/.openclaw/workspaces/architectai" }
    ]
  }
}
```

## Project Physical Paths

```
/home/travis/Lookitry/Lookitry/          # Main project root
├── frontend/                             # Next.js frontend app
│   └── src/app/                          # App Router pages
│       ├── page.tsx                      # Landing page
│       ├── planes/                       # Pricing plans
│       ├── checkout/                     # Checkout flow
│       ├── dashboard/                     # User dashboard
│       ├── probador-virtual/             # Try-on page
│       └── blog/                          # Blog pages
├── backend/                              # Express API
│   └── src/
│       ├── routes/                       # API route handlers
│       ├── controllers/                   # Business logic
│       ├── services/                     # External integrations
│       ├── jobs/                          # Cron/scheduled jobs
│       └── db/                            # Supabase interactions
├── lookitry-woocommerce/                 # WordPress plugin
├── supabase/                             # DB schema & migrations
│   └── supabase-schema.sql
├── sammy/                                # Sammy's workspace
└── brain/                                 # Lookitry Brain Vault
```

## Key API Endpoints (Backend)

| Route | Description |
|-------|-------------|
| `POST /auth/register` | User registration |
| `POST /auth/login` | User login |
| `GET /products/plans` | List subscription plans |
| `POST /payments/wompi` | Wompi payment initiation |
| `POST /payments/paypal` | PayPal payment initiation |
| `POST /webhooks/wompi` | Wompi webhook callback |
| `POST /generations` | Image generation request |
| `GET /generations/:id` | Get generation status |
| `POST /subscriptions` | Create subscription |
| `GET /subscriptions/:id` | Get subscription status |
| `POST /referals/credit` | Credit referrer |
| `GET /usage/stats` | Usage statistics |

## Environment Variables (Production)

### Backend (.env.production)
```
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://...
SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
SUPABASE_SERVICE_KEY=...
JWT_SECRET=...
BLOG_WEBHOOK_SECRET=<newly generated>
ENTERPRISE_SYNC_TOKEN=<newly generated>
WOMPI_MERCHANT_ID=...
WOMPI_API_KEY=...
PAYPAL_CLIENT_ID=...
PAYPAL_SECRET=...
BREVO_API_KEY=...
REDIS_URL=redis://localhost:6379
```

### Frontend (.env.production)
```
NEXT_PUBLIC_API_URL=https://api.lookitry.com
NEXT_PUBLIC_APP_URL=https://lookitry.com
NEXT_PUBLIC_SUPABASE_URL=https://vkdooutklowctuudjnkl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

## Docker Services (VPS)

| Container | Port | URL |
|-----------|------|-----|
| lookitry-frontend | 3000 | https://lookitry.com |
| lookitry-backend | 3001 | https://api.lookitry.com |
| lookitry-sammy | - | OpenClaw orchestrator |
| traefik | 80/443 | Reverse proxy |
| minio | 9000/9001 | S3 storage + console |

## Security Secrets (Roted)

After recent commit `449aba4`:
- `BLOG_WEBHOOK_SECRET=a1108af730b7dc565b3d60d50ea3cdef5a3c73d66aeaf40130b07dd1cf6be2ce`
- `ENTERPRISE_SYNC_TOKEN=ef204017cf64e604b9feeecbcd9a42d92d015ad2dd4362e793a556138bb9ffd686a07dd3dd13e2dd`

## Recent Security Fixes

- Commit `449aba4`: Removed hardcoded secrets from codebase
  - `webhook_secret` default changed to `'CHANGE_ME_IN_ENV'`
  - `ENTERPRISE_SYNC_TOKEN` removed from docker-compose (now in .env only)
  - `iframe` removed from blog sanitization (XSS risk)
  - Duplicate `GOOGLE_CLIENT_ID` ENV removed from Dockerfile
