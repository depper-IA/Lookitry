## Playbook de soporte (beta) — pagos y activaciones

### 1) “Pagué pero no se activó”
- **Primero** pedir al cliente:
  - Email con el que pagó
  - Método (Wompi o PayPal)
  - Captura del pago (ID transacción / orderId)
  - Link donde quedó (ideal: `ref` si llegó a `/registro-pro`)

#### Si tiene `ref` (lo ideal)
- Revisar `pending_registrations` por `reference=ref`
  - Si `status=pending`: pedir esperar 1–2 minutos y reintentar “Volver a verificar pago” en `/registro-pro`.
  - Si `status=paid`: que complete el registro (o se auto-vincule si ya tiene sesión).
  - Si `status=used`: ya se consumió; validar si la marca quedó con plan activo.

#### Wompi
- Verificar que llegó webhook `transaction.updated` con `APPROVED`.
- Verificar firma: si hay `401 Firma inválida` revisar `WOMPI_EVENTS_SECRET`/modo test/prod.

#### PayPal
- Confirmar que `PAYPAL_WEBHOOK_ID` está configurado en producción.
- Si el webhook se rechaza por firma, PayPal no activará asíncronamente; el flujo aún puede activarse por `capture` o por registro post-pago, pero se debe corregir la verificación para estabilidad.

### 2) “Me cobró dos veces / se extendió dos veces”
- Revisar `subscription_payments` filtrando por `reference` (debe ser única).
- Si hay duplicados, causa típica: doble activación (capture + webhook). La plataforma ya tiene idempotencia por `reference`; si vuelve a ocurrir, revisar que todos los inserts usen la `reference` interna y no el `orderId`.

### 3) “Mi plan dice BASIC pero pagué PRO”
- Revisar `reference` (contiene `P{PLAN}` en Wompi/PayPal) y confirmar que `renewSubscription` recibió el plan correcto.
- Revisar `pricing_config` (valores de `basic` y `pro`) y que el backend recalcula el monto en checkout.

### 4) Reglas rápidas (para soporte)
- **Fuente de verdad**: `subscription_end_date`, `subscription_status`, `plan` en `brands`.
- **Auditoría**: `subscription_payments` (buscar por `reference` y `payment_method`).
- **Registro sin cuenta**: siempre pasa por `pending_registrations` + `/registro-pro`.

