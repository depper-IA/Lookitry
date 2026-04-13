# CHANGELOG — Lookitry

## 13 de Abril 2026

### Fix: Jobs Atascados en Cola Try-On

**Problema identificado:** Un job quedó atascado en `queue:tryon:processing` por ~26 minutos (timeout de n8n) porque:
1. El queue worker no tenía mecanismo para recuperar jobs "huérfanos" (sin timeout real)
2. No había validación de que el webhook de n8n estuviera activo antes de procesar
3. El workflow de n8n puede tardar más de lo esperado en responder

**Soluciones implementadas:**

| # | Componente | Cambio |
|---|-----------|--------|
| 1 | `generation-queue.service.ts` | Nuevo método `recoverStaleJobs()` - recupera jobs en processing > 5 min |
| 2 | `queue.routes.ts` | `recoverStaleJobs()` se ejecuta cada 10s en el interval del queue worker |
| 3 | `queue.routes.ts` | Validación `isWebhookRegistered()` antes de llamar a n8n |
| 4 | `queue.routes.ts` | Interval ajustado de 2s a 10s para evitar sobrecarga |
| 5 | `n8n.client.ts` | Nuevo método `isWebhookRegistered()` - verifica si n8n responde con 404 |

**Parámetros configurados:**
- `STALE_JOB_TIMEOUT_MS`: 300000 (5 minutos)
- Queue worker interval: 10000ms (10 segundos)

---

## 10 de Abril 2026

### Auditoría Web Completa

Se realizó auditoría por 3 agentes especializados (WebWizard + DevGuardian + GrowthPilot):
- **Score SEO:** 6.5/10
- **Score Seguridad:** 7.2/10
- **Score UX:** 6.5/10
- **Score Conversión:** 5.0/10

### Cambios Aplicados

| # | Categoría | Cambio | Archivos |
|---|----------|--------|----------|
| 1 | Seguridad | Secretos hardcodeados en docker-compose → variables de entorno | `docker-compose.frontend.yml`, `frontend/.env.example` |
| 2 | SEO | Redirecciones 301 para URLs 404 | `frontend/next.config.js` |
| 3 | Datos | Precios unificados en /terminos y /planes ($180K BASIC, $350K PRO) | `frontend/src/app/terminos/TerminosClient.tsx` |
| 4 | Conversión | Clarificado trial: $20.000 COP (pago único 7 días) | `LandingNav.tsx`, `PlanesClient.tsx` |
| 5 | Datos | **Precios 100% dinámicos** en todas las páginas | 15 archivos actualizados |

### Detalle de Precios Dinámicos

Todas las páginas ahora leen precios desde `pricing_config` en Supabase via `getPricingConfig()`:

| Archivo | Cambio |
|---------|--------|
| `frontend/src/app/terminos/page.tsx` | Server Component con ISR → pasa `pricing` prop |
| `frontend/src/app/terminos/TerminosClient.tsx` | `buildArticles(pricing)` genera content dinámico |
| `frontend/src/app/page.tsx` | Fallback actualizado a $180K/$350K |
| `frontend/src/app/checkout/page.tsx` | `PLAN_BASE_FALLBACK` dinámico |
| `frontend/src/app/dashboard/checkout/page.tsx` | Fallback actualizado |
| `frontend/src/app/dashboard/checkout-landing/page.tsx` | IDs corregidos (`landing` → `mini_landing`) |
| `frontend/src/components/auth/RegisterForm.tsx` | Fetch dinámico en `useEffect` |
| `frontend/src/app/admin/revenue/page.tsx` | Fallback actualizado |
| `frontend/src/app/admin/subscriptions/page.tsx` | MRR recalculado |
| `frontend/src/components/payments/PaymentSuccessScreen.tsx` | Amount por URL param |

### Pendiente (Issues Known)

| Issue | Severidad | Estado |
|-------|-----------|--------|
| Implementar HSTS en frontend | ALTO | ⚠️ Pendiente |
| Invalidación JWT en logout | ALTO | ⚠️ Pendiente |
| Skeleton loaders | MEDIO | ⚠️ Pendiente |
| Testimoniales reales con foto | MEDIO | ⚠️ Pendiente |
| CSRF Protection | MEDIO | ⚠️ Pendiente |

---
