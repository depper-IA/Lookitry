# Plan de Correcciones de Seguridad - Lookitry

## Resumen
Auditoría de seguridad con énfasis en pagos. Se identificaron 22 vulnerabilidades (5 críticas, 7 altas, 6 medias, 4 bajas).

---

## CRÍTICOS

### 1. Race condition en `redeemCoupon`
**Archivo:** `backend/src/controllers/coupons.controller.ts:161-185`
**Problema:** Patrón read-then-write no atómico en `uses_count`
**Solución:** Usar RPC de Supabase con incremento atómico:
```sql
CREATE OR REPLACE FUNCTION increment_coupon_uses(coupon_id_input UUID)
RETURNS INTEGER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE coupons 
  SET uses_count = uses_count + 1 
  WHERE id = coupon_id_input 
    AND (max_uses IS NULL OR uses_count < max_uses)
  RETURNING uses_count INTO new_count;
  RETURN new_count;
END;
$$ LANGUAGE plpgsql;
```
Luego en el controller:
```ts
const { data, error } = await supabaseAdmin
  .rpc('increment_coupon_uses', { coupon_id_input: coupon_id });
```

### 2. `/api/coupons/redeem` sin auth ni rate limiting
**Archivo:** `backend/src/app.ts:86`
**Solución:** Agregar `authRateLimiter` y requerir autenticación:
```ts
app.post('/api/coupons/redeem', authRateLimiter, authMiddleware, redeemCoupon);
```

### 3. Credenciales hardcodeadas de MinIO
**Archivo:** `backend/src/services/upload.service.ts:40-41`
**Solución:** Eliminar fallbacks y lanzar error si no existen:
```ts
private readonly accessKey = process.env.MINIO_ACCESS_KEY;
private readonly secretKey = process.env.MINIO_SECRET_KEY;
// En constructor:
if (!this.accessKey || !this.secretKey) {
  throw new Error('MINIO_ACCESS_KEY y MINIO_SECRET_KEY son requeridas');
}
```

### 4. Tokens JWT en localStorage
**Archivos:** `frontend/src/services/auth.service.ts:55,59,70,75`, `frontend/src/services/api.ts:22`
**Solución:** Eliminar `localStorage.setItem('token', ...)` y `localStorage.setItem('brand', ...)`. Confiar exclusivamente en cookies httpOnly. El backend ya envía cookies httpOnly, solo hay que limpiar el código frontend que usa localStorage.

### 5. SSRF en img-proxy
**Archivo:** `frontend/src/app/api/img-proxy/route.ts:8`
**Solución:** Agregar:
- Allowlist de dominios permitidos
- Bloqueo de IPs internas (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x)
- Validación de content-type antes de servir

---

## ALTOS

### 6. `freeCheckout` sin verificación de cupón
**Archivo:** `backend/src/controllers/wompi.controller.ts:316-413`
**Solución:** Requerir `coupon_id` validado en request body y verificar server-side que el descuento es 100% antes de activar suscripción gratis.

### 7. Webhook Wompi retorna 200 en errores
**Archivo:** `backend/src/controllers/wompi.controller.ts:203-216`
**Solución:** Retornar HTTP 500 en errores de procesamiento para que Wompi reintente:
```ts
res.status(500).json({ error: 'Error interno procesando webhook' });
```

### 8. IDs de visitante predecibles
**Archivo:** `backend/src/controllers/wompi.controller.ts:456,533`
**Solución:** Reemplazar `visitor_${Date.now()}` por `visitor_${crypto.randomUUID()}`

### 9. Error messages expuestos en responses 500
**Archivos:** Múltiples controllers
**Solución:** Crear utility `sanitizeError(err)` que retorna mensaje genérico en producción y loguea el detalle.

### 10. XSS en DashboardLayout
**Archivo:** `frontend/src/components/dashboard/DashboardLayout.tsx:159,258`
**Solución:** Reemplazar `innerHTML` por `textContent`:
```tsx
onError={(event) => {
  const parent = (event.target as HTMLImageElement).parentElement;
  if (parent) {
    parent.textContent = currentBrand?.name?.charAt(0)?.toUpperCase() ?? 'M';
  }
}}
```

### 11. XSS en blog con dangerouslySetInnerHTML
**Archivo:** `frontend/src/app/blog/[slug]/page.tsx:213`
**Solución:** Instalar DOMPurify y sanitizar HTML antes de renderizar.

---

## MEDIOS

### 12. Auth bypass en development mode
**Archivo:** `frontend/src/middleware.ts:72,84`
**Solución:** Reemplazar `!isDev` por variable de entorno explícita `ALLOW_DEV_AUTH_BYPASS` que defaultea a `false`.

### 13. CSP débil
**Archivo:** `frontend/src/middleware.ts:121`
**Solución:** Remover `'unsafe-inline'` y `'unsafe-eval'` de script-src en producción.

### 14. Rate limiting en endpoints de pago
**Archivos:** `backend/src/routes/wompi.routes.ts:48,54`
**Solución:** Agregar rate limiter específico a `free-checkout` y `apply-free-upgrade`.

### 15. User enumeration en checkEmail
**Archivo:** `backend/src/controllers/auth.controller.ts:355-377`
**Solución:** Retornar solo `{ exists: true/false }` sin detalles de la marca.

---

## Archivos a modificar

1. `backend/src/controllers/coupons.controller.ts` - Fix race condition + sanitizar errores
2. `backend/src/app.ts` - Agregar auth y rate limiting a coupon redeem
3. `backend/src/services/upload.service.ts` - Eliminar credenciales hardcodeadas
4. `frontend/src/services/auth.service.ts` - Eliminar localStorage de tokens
5. `frontend/src/services/api.ts` - Eliminar Bearer token de localStorage
6. `frontend/src/app/api/img-proxy/route.ts` - Agregar protección SSRF
7. `backend/src/controllers/wompi.controller.ts` - Fix freeCheckout, webhook, visitor IDs
8. `frontend/src/components/dashboard/DashboardLayout.tsx` - Fix XSS innerHTML
9. `frontend/src/app/blog/[slug]/page.tsx` - Agregar DOMPurify
10. `frontend/src/middleware.ts` - Fix auth bypass + CSP
11. `backend/src/routes/wompi.routes.ts` - Agregar rate limiting
12. `backend/src/controllers/auth.controller.ts` - Fix user enumeration
13. `backend/src/utils/sanitizeError.ts` - Nuevo archivo utility
14. `supabase/migrations/` - Nueva migración para RPC de cupones

## Dependencias nuevas
- `dompurify` + `@types/dompurify` (frontend)
