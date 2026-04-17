# Lookitry Project Reference

## Project Overview
Lookitry es un SaaS de **Virtual Try-On** (probador virtual de ropa) que permite a usuarios probarse ropa virtualmente usando IA.

## Project Structure
```
Lookitry/
├── frontend/              # Next.js 14 (App Router)
├── backend/              # Express + TypeScript
├── lookitry-woocommerce/ # Plugin WordPress/WooCommerce
├── supabase/             # Schema de base de datos
└── brain/               # Lookitry Brain Vault
```

## Quick Access
- **Project root:** `/home/travis/Lookitry/Lookitry`
- **Frontend:** `/home/travis/Lookitry/Lookitry/frontend`
- **Backend:** `/home/travis/Lookitry/Lookitry/backend`
- **Brain Vault:** `/home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Cerebro`

## Key Files
- `REGLAS_IMPORTANTES.md` — Reglas del proyecto
- `MAPA_MAESTRO.md` — Mapa general
- `PRD.md` — Product Requirements Document
- `TECH_STACK.md` — Tech stack completo

## Communication with Sammy
Para comunicarte con Sammy:
- **Directo (urgente)**: `sessions_send(sessionKey="agent:sammy:main", message="...")`
- **No urgente**: Crea archivo en `/home/travis/Lookitry/Lookitry/.shared-inbox/`
- **Ver inbox compartido**: `/home/travis/Lookitry/Lookitry/.shared-inbox/INBOX.md`

## Communication with Rebecca
Para comunicarte con Rebecca:
- **Directo**: `sessions_send(sessionKey="agent:rebecca:main", message="...")`
- **No urgente**: Usa el inbox compartido

## Main Technologies
- **Frontend:** Next.js 14, Tailwind CSS, Framer Motion, TypeScript
- **Backend:** Express, TypeScript, Supabase, Redis, n8n
- **Payments:** Wompi, PayPal
- **Email:** Brevo
- **Storage:** MinIO (S3-compatible)
- **Deployment:** Docker, Traefik, VPS Hostinger
