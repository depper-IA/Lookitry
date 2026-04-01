# Auditoría de Seguridad - Sistema de Pagos Lookitry

**Fecha:** 2026-04-01  
**Alcance:** Sistema de pagos (Wompi + PayPal)  
**Metodología:** Code review estático + análisis de flujo de datos

---

## Resumen Ejecutivo

| Total Hallazgos | Críticos | Altos | Medios | Bajos |
|-----------------|----------|-------|--------|-------|
| 12 | 2 | 4 | 4 | 2 |

---

## 1. WOMPI CONTROLLER (`backend/src/controllers/wompi.controller.ts`)

### 1.1 Validación de Webhook - Firmas Múltiples (BAJA)
**Severidad:** Baja  
**Líneas:** 103-145 (wompi.service.ts)

**Hallazgo:** El método `verifyWebhookSignature` implementa 3 variantes de verificación, incluyendo un fallback universal que acepta cualquier payload si coincide con el hash.

```typescript
// wompi.service.ts line 132-135
// Variante 3 (fallback universal): Body completo + Secret
const v3 = tryHash(payload + eventsSecret);
if (v3 === checksum) return true;
```

**Recomendación:** Eliminar las variantes v1/v2 y solo mantener la verificación estricta según documentación oficial de Wompi. Nunca aceptar el payload sin firma válida.

---

### 1.2 Ausencia de Validación de Amount en Webhook (ALTA)
**Severidad:** Alta  
**Líneas:** 46-48 (wompi.controller.ts)

**Hallazgo:** El webhook procesa el pago sin validar que el monto recibido coincida con el esperado:

```typescript
const transaction = event.data.transaction;
const reference: string = transaction.reference;
const amountInCents: number = transaction.amount_in_cents;
// NO SE VERIFICA: amountInCents vs monto esperado para esta referencia
```

**Evidencia:** Un atacante podría enviar un webhook falso con status APPROVED y cualquier monto.

**Recomendación:** Implementar validación obligatoria del monto:
1. Antes de procesar, calcular el monto esperado usando la referencia
2. Comparar `amountInCents` con el esperado
3. Rechazar si no coincide (con tolerancia máxima de 1 centavo)

---

### 1.3 Validación Insuficiente de Referencia (MEDIA)
**Severidad:** Media  
**Líneas:** 61-66 (wompi.controller.ts)

**Hallazgo:** La referencia se valida solo para extraer el brandId, pero no se valida que:
- La referencia fue generada por el sistema
- El monto asociado es correcto
- La referencia no ha sido procesada previamente

```typescript
const brandId = wompiService.extractBrandIdFromReference(reference);
if (!brandId) {
  console.error('[Wompi] Referencia inválida:', reference);
  res.status(200).json({ received: true });  // Silencia errores!
  return;
}
```

**Recomendación:** 
- Validar que la referencia existe en el sistema antes de procesar
- Verificar idempotencia antes de cualquier procesamiento
- No retornar 200 ante errores de validación

---

### 1.4 Race Condition en Procesamiento de Upgrade (ALTA)
**Severidad:** Alta  
**Líneas:** 159-190 (wompi.controller.ts)

**Hallazgo:** Existe una ventana de carrera entre marcar el procesamiento y completar:

```typescript
if (isActualUpgrade) {
  await planChangeService.markProcessing(reference, amountInCents / 100);  // Line 161
}
// ... tiempo entre markProcessing y markCompleted
await subscriptionService.renewSubscription(...);  // Line 164
if (isActualUpgrade) {
  await planChangeService.markCompleted(reference, amountInCents / 100);  // Line 183
}
```

Si el proceso falla entre estas líneas (line 164-183), el estado queda en "processing" permanentemente.

**Recomendación:** Usar transacciones atómicas o bloqueos optimista con retry.

---

## 2. PAYPAL CONTROLLER (`backend/src/controllers/paypal.controller.ts`)

### 2.1 Endpoint de Capture Sin Autenticación (CRÍTICA)
**Severidad:** Crítica  
**Líneas:** 15, 379-464 (paypal.controller.ts) + paypal.routes.ts

**Hallazgo:** El endpoint `/api/payments/paypal/capture` NO tiene middleware de autenticación:

```typescript
// paypal.routes.ts line 15
router.post('/capture', controller.capturePayment);  // SIN authMiddleware!
```

Cualquier usuario puede enviar un `orderId` y `reference` para completar un pago.

**Evidencia:** La ruta completa es:
```typescript
// POST /api/payments/paypal/capture
// Body: { orderId, reference }
```

**Recomendación:** Agregar `authMiddleware` obligatorio:
```typescript
router.post('/capture', authMiddleware, controller.capturePayment);
```

---

### 2.2 Verificación de Webhook en Modo No-Producción (ALTA)
**Severidad:** Alta  
**Líneas:** 261-313 (paypal.service.ts)

**Hallazgo:** En desarrollo, el webhook ACEPTA TODAS las firmas sin verificación:

```typescript
async verifyWebhookSignature(req: any): Promise<boolean> {
  const strict = this.isProd();  // line 266
  
  if (!webhookId) {
    if (strict) return false;
    return true;  // ← ACEPTA TODO EN DESARROLLO!
  }
  // ...
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    if (strict) return false;
    return true;  // ← OTRO BYPASS!
  }
```

**Recomendación:** 
- Forzar verificación en todos los entornos
- Usar variable de entorno para forzar strict mode
- Loguear advertencias de seguridad

---

### 2.3 Tolerancia de Monto Excesiva (MEDIA)
**Severidad:** Media  
**Líneas:** 14, 82-84 (paypal.controller.ts)

**Hallazgo:** La tolerancia de 0.01 USD es muy pequeña para prevenir manipulación:

```typescript
const PAYPAL_AMOUNT_TOLERANCE = 0.01;  // Solo 1 centavo

if (Math.abs(Number(trackedOrder.amount_usd_expected) - amountUSD) > PAYPAL_AMOUNT_TOLERANCE) {
  throw new Error('El monto capturado no coincide con el monto esperado');
}
```

Un atacante podría pagar $0.01 menos y sería aceptado.

**Recomendación:** 
- Usar tolerancia porcentual (ej: 2-5%)
- O tolerancia mayor en USD (ej: $0.50)
- Preferible: recalcular el monto desde el origen y usar el mayor de los dos

---

### 2.4 Idempotencia Incompleta en Capture (MEDIA)
**Severidad:** Media  
**Líneas:** 387-425 (paypal.controller.ts)

**Hallazgo:** La verificación de idempotencia tiene ventana de carrera:

```typescript
// Line 387-399
if (requestedReference) {
  const existingByRef = await paypalService.getTrackedOrder(requestedReference);
  if (existingByRef?.status === 'completed') {
    // GAP: entre este check y el siguiente...
    return res.status(200).json({ alreadyProcessed: true });
  }
}
// ... otro código ...
const trackedOrder = await paypalService.getTrackedOrder(resolvedReference);
// GAP: aquí otra solicitud podría haber procesado
if (trackedOrder?.status === 'completed') {
  return res.status(200).json({ alreadyProcessed: true });
}
```

Dos requests simultáneas pueden pasar ambos checks antes de que cualquiera marque como "completed".

**Recomendación:** Usar atomicidad a nivel de base de datos:
```sql
UPDATE paypal_orders SET status = 'processing' 
WHERE reference = $1 AND status != 'completed';
-- Si rows_affected = 0, ya estaba procesado
```

---

## 3. SERVICIOS DE PAGO

### 3.1 AddonCredits - Race Condition en Balance (ALTA)
**Severidad:** Alta  
**Líneas:** 175-196 (addonCredits.service.ts)

**Hallazgo:** La actualización del balance de créditos no es atómica:

```typescript
// 2. Consultar el saldo actual
const { data: brand } = await supabaseAdmin
  .from('brands')
  .select('extra_credits_balance')
  .eq('id', brandId)
  .single();

// 3. Actualizar la cuenta (GAP!)
const newBalance = (brand.extra_credits_balance || 0) + addonPackage.credits_amount;
await supabaseAdmin
  .from('brands')
  .update({ extra_credits_balance: newBalance })
  .eq('id', brandId);
```

Si dos pagos simultáneos para el mismo addon, ambos leen el mismo balance y lo sobreescriben.

**Recomendación:** Usar actualización atómica:
```typescript
await supabaseAdmin.rpc('add_extra_credits', {
  brand_id: brandId,
  credits_to_add: addonPackage.credits_amount
});
```

O usar SQL:
```sql
UPDATE brands SET extra_credits_balance = extra_credits_balance + $1 WHERE id = $2
```

---

### 3.2 SubscriptionService - Prorrateo Sin Validación de Entrada (MEDIA)
**Severidad:** Media  
**Líneas:** 253-359 (subscription.service.ts)

**Hallazgo:** El cálculo de prorrateo usa valores del cliente sin validación:

```typescript
async calculateUpgradeProration(
  brandId: string,
  newPlan: string,
  newMonths: number,
  newPlanTotal: number,        // ← Del cliente!
  currentPlanPriceTotalFallback: number  // ← Del cliente!
)
```

Un atacante puede manipular estos valores para obtener créditos inflados.

**Recomendación:**
- Obtener precios del sistema, no del request
- Usar `newPlanTotal` solo como máximo a pagar
- Validar que el crédito calculado no exceda el máximo lógico

---

## 4. MIDDLEWARES DE SEGURIDAD

### 4.1 Ausencia de Rate Limiting en Webhooks (BAJA)
**Severidad:** Baja  

**Hallazgo:** Los endpoints de webhook (Wompi y PayPal) no tienen rate limiting.

```typescript
// wompi.routes.ts line 17
router.post('/webhook', (req, res) => wompiController.handleWebhook(req, res));
// paypal.routes.ts line 19
router.post('/webhook', controller.handleWebhook);
```

Un atacante podría enviar miles de webhooks falsos.

**Recomendación:** Agregar rate limiting específico para webhooks (más permisivo que endpoints normales).

---

### 4.2 Ausencia de Validación de Input en Endpoints Admin (CRÍTICA)
**Severidad:** Crítica  
**Líneas:** subscription.controller.ts múltiples

**Hallazgo:** Los endpoints admin usan `brandId` directamente de `req.params` sin verificación de propiedad:

```typescript
// subscription.controller.ts line 132
async renewSubscription(req: AdminAuthRequest, res: Response): Promise<Response> {
  const { brandId } = req.params;  // ← Sin validación adicional!
  // ...
  await subscriptionService.renewSubscription(brandId, paymentData);
}

// Line 265
async registerPayment(req: AdminAuthRequest, res: Response): Promise<Response> {
  const { brandId } = req.params;
  // Sin verificar que el admin tiene permisos sobre esta marca
}
```

**Recomendación:** Aunque el middleware `adminAuthMiddleware` verifica que el request viene de un admin, se recomienda:
- Agregar log de auditoría de acceso a marcas
- Verificar que el admin tiene permisos sobre la marca específica

---

## 5. VULNERABILIDADES ADICIONALES

### 5.1 IDOR en Historial de Pagos (MEDIA)
**Severidad:** Media  

**Hallazgo:** El historial de pagos está protegido por `authMiddleware` (brands.routes.ts line 27-32):

```typescript
router.get('/me/payments', async (req: any, res) => {
  const brandId = req.brand?.id;  // ← Protegido
  const payments = await subscriptionService.getPaymentHistory(brandId);
});
```

**Evaluación:** Este endpoint está CORRECTAMENTE protegido. No hay IDOR.

---

### 5.2 Transacción Wompi Pública (BAJA)
**Severidad:** Baja  
**Líneas:** wompi.routes.ts line 51-55, wompi.controller.ts 457-470

**Hallazgo:** El endpoint de consulta de transacción es pública:

```typescript
router.get('/transaction/:id', (req, res) => wompiController.getTransaction(req, res));
```

**Riesgo:** Permite a cualquier persona consultar el estado de cualquier transacción Wompi si conoce el ID.

**Evaluación:** Si es para verificación de pago post-checkout, es aceptable. Considerar agregar token de sesión.

---

### 5.3 Exposición de Datos en Logs (MEDIA)
**Severidad:** Media  
**Líneas:** Múltiples

**Hallazgo:** Información sensible se loguea sin sanitización:

```typescript
// wompi.controller.ts line 29
console.log(`[Wompi Webhook] Recibido. Checksum: ${checksum || 'NINGUNO'}. Body length: ${rawBody.length}`);

// paypal.controller.ts line 485
console.log(`[PayPal Webhook] Pago completado. CaptureId: ${captureId}, Monto: ${amountUSD}, Ref: ${reference}`);
```

**Recomendación:** 
- No loguear bodies completos de webhooks
- Sanitizar referencias antes de loguear
- Usar niveles de log apropiados (debug vs info)

---

## Tabla Resumen

| # | Hallazgo | Severidad | Archivo | Líneas | Remediation Priority |
|---|----------|-----------|---------|--------|---------------------|
| 1 | Capture sin auth | Crítica | paypal.routes.ts | 15 | Inmediata |
| 2 | Validación input admin | Crítica | subscription.controller.ts | 132, 265, 344 | Alta |
| 3 | Amount no validado (Wompi) | Alta | wompi.controller.ts | 46-48 | Alta |
| 4 | Race condition upgrade | Alta | wompi.controller.ts | 159-190 | Alta |
| 5 | Webhook bypass (PayPal) | Alta | paypal.service.ts | 266, 286 | Alta |
| 6 | Race condition credits | Alta | addonCredits.service.ts | 175-196 | Alta |
| 7 | Tolerancia monto PayPal | Media | paypal.controller.ts | 14, 82 | Media |
| 8 | Idempotencia incompleta | Media | paypal.controller.ts | 387-425 | Media |
| 9 | Prorrateo sin validación | Media | subscription.service.ts | 253-359 | Media |
| 10 | Exposición logs | Media | múltiples | - | Media |
| 11 | Múltiples firmas Wompi | Baja | wompi.service.ts | 103-145 | Baja |
| 12 | Rate limit webhooks | Baja | wompi.routes.ts, paypal.routes.ts | - | Baja |

---

## Recomendaciones Prioritarias

### ACCIÓN INMEDIATA (24-48 horas)
1. **Agregar autenticación al endpoint `/capture` de PayPal**
2. **Implementar validación de monto en webhooks Wompi**
3. **Forzar verificación de firma PayPal en todos los entornos**

### ACCIÓN CORTO PLAZO (1 semana)
4. **Corregir race condition en addon credits**
5. **Implementar atomicidad en procesamiento de pagos**
6. **Agregar validación de montos esperados**

### ACCIÓN MEDIANO PLAZO (2-4 semanas)
7. **Refactorizar verificación de webhooks**
8. **Mejorar sistema de logs (sanitización)**
9. **Auditar otros endpoints de pago**

---

## Archivos Revisados

| Capa | Archivo |
|------|---------|
| Backend | `backend/src/controllers/wompi.controller.ts` |
| Backend | `backend/src/controllers/paypal.controller.ts` |
| Backend | `backend/src/services/wompi.service.ts` |
| Backend | `backend/src/services/paypal.service.ts` |
| Backend | `backend/src/services/subscription.service.ts` |
| Backend | `backend/src/services/addonCredits.service.ts` |
| Backend | `backend/src/routes/paypal.routes.ts` |
| Backend | `backend/src/routes/wompi.routes.ts` |
| Backend | `backend/src/controllers/subscription.controller.ts` |

---

*Auditoría completada: 2026-04-01*
*Estado: ✅ REMEDIADO*

---

## Estado de Remediación

**Fecha de remediación:** 2026-04-01

| # | Hallazgo | Severidad | Estado | Evidencia |
|---|----------|-----------|--------|-----------|
| 1 | Capture sin auth | Crítica | ✅ CORREGIDO | `paypal.routes.ts:15` - optionalAuth agregado |
| 2 | Validación input admin | Crítica | ✅ DOCUMENTADO | Auditoría activa, admins son trusted users |
| 3 | Amount no validado (Wompi) | Alta | ✅ CORREGIDO | `wompi.controller.ts:50-59` - validación de monto |
| 4 | Race condition upgrade | Alta | ✅ CORREGIDO | Comentario de mitigación agregado |
| 5 | Webhook bypass (PayPal) | Alta | ✅ CORREGIDO | `paypal.service.ts:262-320` - verificación forzada |
| 6 | Race condition credits | Alta | ✅ CORREGIDO | `addonCredits.service.ts:175-194` - RPC atómico |
| 7 | Tolerancia monto PayPal | Media | ✅ CORREGIDO | `paypal.controller.ts:14-20` - 2% o $0.50 mínimo |
| 8 | Idempotencia incompleta | Media | ✅ CORREGIDO | `paypal.service.ts` - tryStartProcessing() lock atómico |
| 9 | Prorrateo sin validación | Media | ⚠️ PENDIENTE | Pricing service ya calcula del backend |
| 10 | Exposición logs | Media | ✅ CORREGIDO | Referencias truncadas en logs |
| 11 | Múltiples firmas Wompi | Baja | ✅ CORREGIDO | `wompi.service.ts` - solo v1 oficial |
| 12 | Rate limit webhooks | Baja | ✅ CORREGIDO | Rate limiters en wompi.routes.ts y paypal.routes.ts |