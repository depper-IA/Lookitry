## Checklist Go / No-Go — Beta (Lookitry)

### Pasarelas y configuración (bloqueante)
- **Wompi**
  - `payment_settings.wompi_enabled = true`
  - `WOMPI_EVENTS_SECRET` configurado (o en `payment_settings`), y el webhook responde **200** para eventos válidos y **401** para firmas inválidas.
  - Verificado con un pago real en sandbox y otro en producción (si aplica).
- **PayPal**
  - `payment_settings.paypal_enabled = true`
  - Variables de entorno configuradas para producción:
    - `PAYPAL_WEBHOOK_ID` (obligatorio en prod; sin esto el webhook se rechaza)
    - `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_SANDBOX=false`
  - Webhook `POST /api/payments/paypal/webhook` valida firma y rechaza firmas inválidas (401).

### Flujos E2E (debe pasar antes de vender)
- **TRIAL (guest) + Wompi**
  - `/trial-checkout` → pagar → redirección a `/pago-exitoso?ref=...` → completar cuenta → acceso a `/dashboard`.
- **TRIAL (guest) + PayPal**
  - Mismo flujo anterior en USD/PayPal (verificar que `custom_id`/`invoice_id` tengan la `reference` interna).
- **BASIC + Wompi (sin sesión)**
  - `/checkout` (público) → pagar → `/registro-pro?ref=...` → crear cuenta → plan activo en dashboard.
- **PRO + PayPal (sin sesión)**
  - `/checkout` → PayPal → `/registro-pro?ref=...` → crear cuenta → plan activo.
- **Renovación con sesión**
  - `/dashboard/checkout` (marca autenticada) → pagar → “Pago recibido” → `/dashboard/subscription` refleja nueva fecha.
- **Idempotencia**
  - Repetir el mismo webhook/capture no crea doble renovación ni doble registro de pago (ver `subscription_payments` por `reference`).

### UX mínimo (para cobrar con baja fricción)
- Si `currency=USD` o Wompi está deshabilitado, el checkout debe **forzar PayPal**.
- `registro-pro` muestra estado del pago y ofrece “Volver a verificar pago”.
- Mensajes post-pago: “activación en minutos” + fallback de soporte.

### Observabilidad mínima
- Logs para:
  - webhook Wompi (checksum, firma válida/invalid)
  - webhook PayPal (event_type + verificación exitosa/denegada)
  - activación post-pago (`reference`, `brandId`, `plan`, `months`)

### Seguridad / Operación
- CORS: `CORS_ORIGIN` incluye `https://lookitry.com` (y/o dominios necesarios).
- Cookies auth en prod: `COOKIE_DOMAIN` (si se usa) y `sameSite=none` + `secure=true`.
- SMTP: credenciales válidas y envío verificado (bienvenida + confirmación).

