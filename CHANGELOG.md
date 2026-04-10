# CHANGELOG — Lookitry

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
