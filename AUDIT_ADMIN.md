# AUDIT_ADMIN.md - Auditoria del Panel Admin

**Fecha:** 06 April 2026  
**Auditor:** WebWizard  
**Modelo:** MiniMax-M2.7

---

## 1. SIDEBAR SIMPLIFICADO

### Problema
El sidebar del admin tenla ms de 41 items en 10 grupos, haciendo la navegacion confusa y lenta.

### Accion
Simplificado a 5 grupos con ~15 items maximo:

```
COMANDO         -> Mission Control, Funnel, Agentes (3)
CLIENTES        -> Marcas, Suscripciones, Pagos (3)
ANALYTICS       -> Estadisticas, Leads, Revenue (3)
MARKETING       -> Promociones, Trial (2)
CONFIGURACION   -> General, Pagos, Enterprise (3)
```

### Archivos modificados
- `frontend/src/app/admin/layout.tsx` - Simplified adminNav array

---

## 2. WOOCOMMERCE ERROR

### Problema
El frontend llamaba `/api/admin/woocommerce/brands-summary` pero no estaba verificado si el endpoint exista.

### Verificacion
- El endpoint existe en `backend/src/routes/admin.routes.ts` linea 166
- El controlador existe en `backend/src/controllers/admin/woo.admin.controller.ts`
- El flujo es correcto: GET `/api/admin/woocommerce/brands-summary`

### Resultado
**OK** - El endpoint existe y es accesible. No requiere cambios.

---

## 3. RUTA /api/admin/health NO ENCONTRADA

### Problema
`frontend/src/app/admin/health/page.tsx` llama `adminApi.get('/admin/health')` que se traduce a `/api/admin/health`.

### Accion
Agregada ruta en `backend/src/routes/admin.routes.ts`:

```typescript
router.get('/health', requirePermission('health'), async (_req: any, res: any) => {
  const { getHealthStatus } = await import('../controllers/health.controller');
  return getHealthStatus(_req, res);
});
```

### Archivos modificados
- `backend/src/routes/admin.routes.ts` - Agregada ruta health

---

## 4. ENTERPRISE COLORES INCORRECTOS

### Problema
`frontend/src/app/admin/enterprise/page.tsx` usaba colores hardcoded como `#3b82f6`, `#8b5cf6` para elementos de UI.

### Accion
Reemplazados:
- `#3b82f6` -> `var(--accent)` para pending status
- `linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)` -> `var(--accent)` para boton "Crear cliente Enterprise"

### Archivos modificados
- `frontend/src/app/admin/enterprise/page.tsx`

---

## 5. SOCIAL-API-CONFIG EMOJIS

### Problema
`frontend/src/app/admin/social-api-config/page.tsx` contena emojis `📸` (Instagram) y `🎵` (TikTok).

### Accion
- Reemplazados emojis con iconos lucide-react: `Instagram` y `Music`
- Convertida la propiedad `icon` a `IconComponent` para mejor compatibilidad
- Actualizado el render para usar `<platform.IconComponent className="w-5 h-5" />`
- Corregido texto `text-[#0a0a0a]` -> `style={{ color: 'var(--text-primary)' }}`
- Corregido texto `text-[#999]` -> `style={{ color: 'var(--text-muted)' }}`
- Corregido texto `text-[#666]` -> `style={{ color: 'var(--text-muted)' }}`
- Agregado escape `&quot;` para comillas en "Instagram Graph API"

### Archivos modificados
- `frontend/src/app/admin/social-api-config/page.tsx`

---

## VERIFICACIONES

### Build
- `npm run build` pasa sin errores

### Emojis
- Verificado: no hay emojis en ningun archivo del admin

### Colores CSS
- Todos los colores usan CSS variables: `var(--accent)`, `var(--bg-card)`, `var(--text-primary)`, etc.
- Excepcion: datos de status (success/pending/etc) que usan valores especificos como `#10b981`

---

## RESUMEN DE CAMBIOS

| Problema | Estado | Archivo |
|----------|--------|---------|
| Sidebar simplificado | CORREGIDO | layout.tsx |
| WooCommerce endpoint | VERIFICADO OK | - |
| Health route | CORREGIDO | admin.routes.ts |
| Enterprise colores | CORREGIDO | enterprise/page.tsx |
| Social-api emojis | CORREGIDO | social-api-config/page.tsx |

---

## NOTAS

- La ruta `/admin/health` requiere permiso `health` en el admin
- El health check extendido incluye services: supabase, n8n, email, minio
- El backend ya tena el controlador `getHealthStatus` en `health.controller.ts`
- Solo faltaba registrar la ruta en admin.routes.ts
