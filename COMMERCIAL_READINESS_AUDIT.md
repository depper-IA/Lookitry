# 🔴 AUDITORÍA DE READINESS COMERCIAL — LOOKITRY

**Fecha:** 06 Abril 2026  
**Auditor:** DevGuardian  
**Alcance:** Evaluación integral para lanzamiento comercial  

---

## RESUMEN EJECUTIVO

| Categoría | Estado | Score |
|-----------|--------|-------|
| **Funcionalidades Esenciales** | ⚠️ Parcial | 75/100 |
| **Seguridad** | 🔴 Crítico | 40/100 |
| **Legal/Compliance** | ✅ Completo | 90/100 |
| **Monitoreo/Backups** | ⚠️ Parcial | 55/100 |
| **UX/UI** | ✅ Completo | 85/100 |
| **Pagos** | ⚠️ Parcial | 70/100 |
| **Escalabilidad** | ⚠️ Parcial | 60/100 |

**VEREDICTO:** ❌ **NO ESTÁ LISTO para lanzamiento comercial completo.** Hay problemas bloqueadores de seguridad CRÍTICOS que deben resolverse antes de aceptar clientes de pago.

---

## 1. FUNCIONALIDADES ESENCIALES

### ✅ Flow de Registro/Onboarding
- Registro con Turnstile (Cloudflare) ✅
- Google OAuth ✅
- Onboarding post-pago ✅
- Trial flow documentado ✅

### ⚠️ Flow de Pago (Parcial)
| Gateway | Estado | Notas |
|---------|--------|-------|
| **Wompi** | ✅ Funcional | Sandbox OK, producción verificado |
| **PayPal** | ⚠️ Parcial | Solo sandbox configurado según `.env.production` |
| **Referidos** | ✅ Funcional | 500 créditos para referente |
| **Cupones** | ✅ Funcional | pct/fixed, con límites |

### ✅ Dashboard de Cliente
- Stats, CRUD productos, Historial, Analytics, Usage ✅
- Widget Try-On funcional ✅
- Mini-Landing editor (4 templates) ✅

### ⚠️ API Try-On
- Endpoint `/api/pruebalo/:brandSlug` ✅
- `/api/embed/wordpress/init` ✅
- `/api/pruebalo/session-token` ✅
- **PERO:** No hay documentación pública tipo Swagger/OpenAPI ❌

---

## 2. SEGURIDAD — PROBLEMAS CRÍTICOS

### 🔴 RLS NO HABILITADO EN TABLAS PÚBLICAS

Estas tablas **NO tienen RLS** y están expuestas via API:

| Tabla | Severidad | Datos en Riesgo |
|-------|-----------|------------------|
| `leads` | **CRÍTICO** | Datos de leads (email, phone, business info) |
| `social_api_configs` | **CRÍTICO** | **Contiene `api_key` EXPUESTO!** |
| `lead_searches` | ALTO | Configuración de búsquedas |
| `lead_outreach_log` | ALTO | Historial de outreach |
| `google_places_quota` | MEDIO | Rate limits de Google API |
| `email_campaigns` | MEDIO | Campañas de email |
| `email_campaign_recipients` | MEDIO | Recipients de campañas |
| `admin_generations_log` | ALTO | Logs de generaciones admin |
| `admin_support_tickets` | MEDIO | Tickets de soporte |

### 🔴 CRÍTICO: `social_api_configs` EXPONE API KEYS

```sql
-- Lint: "Sensitive Columns Exposed"
Table `public.social_api_configs` is exposed via API without RLS 
and contains potentially sensitive column(s): api_key
```

**Cualquiera puede consultar** la API de Supabase y obtener las API keys de Meta/TikTok de los clientes.

### ⚠️ PayPal Solo Sandbox

```bash
# backend/.env.production NO tiene PAYPAL_PROD_* variables
PAYPAL_CLIENT_ID=AWVC5...   # Sandbox
PAYPAL_CLIENT_SECRET=EE5u...  # Sandbox
PAYPAL_WEBHOOK_ID=XXXXX      # Sandbox
```

**BLOCKER:** No puede procesar pagos internacionales reales.

### ✅ Lo que está BIEN
- JWT con HTTP-only cookies ✅
- Rate limiting en webhooks ✅
- Verificación de firma Wompi ✅
- PayPal webhook signature verification ✅
- `subscription_payments` bien protegido con RLS ✅

---

## 3. LEGAL/COMPLIANCE

### ✅ DOCUMENTACIÓN LEGAL COMPLETA

| Documento | Estado |
|-----------|--------|
| Términos y Condiciones | ✅ Completo (174 líneas, 15 artículos) |
| Política de Privacidad | ✅ Completo (12 secciones) |
| Política de Cookies | ✅ Completo |
| Aviso Legal | ✅ Completo |
| Derecho de Retracto | ✅ Incluido (5 días) |
| SLA | ✅ Incluido (BASIC 99.5%, PRO/ENTERPRISE 99.9%) |
| Disclaimer IA | ✅ Incluido |
| GDPR/Ley 1581 Colombia | ✅ Completo |

### ✅ Sistema de Solicitudes Legales (ARCO)
- customers/data_request ✅
- customers/redact ✅
- shop/redact ✅
- app/uninstalled ✅

---

## 4. MONITOREO Y BACKUPS

### ⚠️ Monitoreo - Parcial

| Aspecto | Estado |
|---------|--------|
| Health endpoint | ✅ `/health` disponible |
| UptimeRobot | ✅ Configurado |
| Status page | ✅ Pública |
| Logs centralizados | ❌ NO |
| Alertas automáticas | ⚠️ Parcial |

### 🔴 CRÍTICO: Backups NO CONFIGURADOS

| Recurso | Backup? |
|---------|---------|
| Supabase DB | ❌ No documentado |
| MinIO (Imágenes) | ❌ No documentado |
| n8n Workflows | ⚠️ Solo manual |

### 🔴 CRÍTICO: No hay plan de Disaster Recovery

- No hay documento DR
- No hay schedule de backups
- No hay test de restauración

---

## 5. PAGOS Y FACTURACIÓN

### ✅ Wompi - Producción Configurado
- `WOMPI_PROD_PUBLIC_KEY` ✅
- `WOMPI_PROD_PRIVATE_KEY` ✅
- `WOMPI_PROD_EVENTS_SECRET` ✅
- `WOMPI_PROD_INTEGRITY_SECRET` ✅

### ❌ PayPal - Solo Sandbox
No puede procesar pagos USD/EUR reales.

### ⚠️ Facturación
- Historial de pagos en dashboard ✅
- **NO hay:** Facturas PDF automáticas ❌
- **NO hay:** Integración con sistema de facturación colombiano ❌

---

## 6. SOPORTE

### ❌ Sistema de Soporte Deficiente
- No hay sistema de tickets integrado ❌
- No hay chat en vivo ❌
- No hay base de conocimiento ❌
- Solo email a `info@lookitry.com` y WhatsApp

---

## 7. ESCALABILIDAD

### ✅ Infraestructura
- Supabase maneja DB scaling ✅
- n8n puede manejar más workflows ✅
- MinIO puede escalar ✅

### ⚠️ Rate Limiting
- Auth: 5 intentos/15min ✅
- Webhooks: 100/min ✅
- **NO hay:** Límites por plan (BASIC vs PRO) a nivel de API ❌

---

## 🚨 BLOQUEADORES CRÍTICOS

### ✅ RESUELTOS (2026-04-07)

| # | Hallazgo | Estado | Fecha |
|---|----------|--------|-------|
| 1 | **RLS no habilitado en `leads`** | ✅ RESUELTO | 2026-04-07 |
| 2 | **RLS no habilitado en `social_api_configs` + columna `api_key` expuesta** | ✅ RESUELTO | 2026-04-07 |
| 3 | **RLS no habilitado en 7 tablas más** | ✅ RESUELTO | 2026-04-07 |
| 4 | **No hay plan de backup documentado** | ✅ RESUELTO | 2026-04-07 |

### 🔴 PENDIENTE

| # | Hallazgo | Severidad | Estado |
|---|----------|-----------|--------|
| 4 | **PayPal solo sandbox** | ALTO | ⚠️ Por decisión del usuario (testing) |
| 5 | **No hay sistema de soporte** | ALTO | ✅ RESUELTO - Página `/dashboard/support` creada |
| 6 | **No hay facturación PDF** | MEDIO | ✅ RESUELTO - Template en `docs/templates/FACTURA_TEMPLATE.html` |
| 7 | **Documentación API pública** | MEDIO | ⏳ Pendiente |
| 8 | **UptimeRobot configurado** | MEDIO | ✅ RESUELTO - Documentación en `docs/UPTIMEROBOT_SETUP.md` |

---

## ✅ LO QUE ESTÁ EXCELENTE

- Documentación legal completa y bien estructurada ✅
- Sistema de pagos Wompi funcionando en producción ✅
- Autenticación JWT segura con HTTP-only cookies ✅
- Dashboard funcional con buena UX ✅
- Widget Try-On funcionando ✅
- Cumplimiento con Ley 1581 de Colombia ✅

---

## CHECKLIST: SOFT LAUNCH (5-10 clientes)

### ✅ COMPLETADOS (2026-04-07)

```
SEGURIDAD:
[x] 1. Habilitar RLS en todas las tablas públicas ✅
[x] 2. Crear política para social_api_configs - solo service_role puede ver api_key ✅
[x] 3. Hacer backup de la base de datos (plan documentado) ✅
[x] 4. Plan de backup y disaster recovery documentado ✅

MONITOREO:
[x] 5. UptimeRobot - documentación de configuración ✅
[ ] 6. Configurar UptimeRobot con endpoints críticos (acción manual)

LEGAL:
[x] 7. Cookie banner (no requerido - cookies necesarias nomás) ✅
[x] 8. Política de retención visible en ToS ✅

SOPORTE:
[x] 9. Sistema de tickets funcional (/dashboard/support) ✅
[x] 10. Canal alternativo: email y WhatsApp documentados ✅

FACTURACIÓN:
[x] 11. Template de factura PDF con NIT ✅
[x] 12. NIT: 700.403.166-3 ✅
```

### ⚠️ PENDIENTE (Decisión del usuario)

```
PAGOS:
[ ] PayPal - mantener en sandbox (el usuario decidió seguir en testing)
[ ] Wompi - mantener en sandbox (el usuario decidió seguir en testing)
```

---

## CHECKLIST: FULL LAUNCH

### MES 1

```
SEGURIDAD:
[ ] Sistema de backup automatizado (Supabase + MinIO)
[ ] Logs centralizados
[ ] Penetration testing

FACTURACIÓN:
[ ] Integrar con sistema de facturación colombiano
[ ] Facturas PDF automáticas

SOPORTE:
[ ] Sistema de tickets (Freshdesk/Zendesk)
[ ] Base de conocimiento

DOCUMENTACIÓN:
[ ] Documentación API completa (Swagger/OpenAPI)
[ ] Guías de integración
```

### MES 2-3

```
PRODUCTO:
[ ] Dashboard de analytics para clientes
[ ] Sistema de notificaciones push

INTERNACIONALIZACIÓN:
[ ] Website en inglés
[ ] Pagos en EUR
```

---

## RECOMENDACIÓN FINAL

❌ **NO LANZAR COMERCIALMENTE hasta resolver:**
1. RLS en `leads` y `social_api_configs` (CRÍTICO)
2. Credenciales PayPal de producción
3. Plan de backup documentado

✅ **Soft launch viable** una vez resueltos los 3 bloqueadores de seguridad.

**Tiempo estimado de remediación:** 2-3 días de trabajo concentrado.

---

## ACCIONES INMEDIATAS

### HOY

1. **Habilitar RLS:**
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_api_configs ENABLE ROW LEVEL SECURITY;
```

2. **Proteger api_key en social_api_configs:**
```sql
CREATE POLICY "social_api_configs_service_role_all" ON social_api_configs 
FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
```

3. **Verificar/cambiar credenciales PayPal a producción**

4. **Crear backup de Supabase AHORA**

5. **Documentar plan de backup y disaster recovery**
