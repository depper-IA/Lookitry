# Tasks — Virtual Try-On SaaS

## TASK 5 — Template por defecto "Bare" en Apariencia ✅
**Archivo:** `frontend/src/components/dashboard/SettingsForm.tsx`
- Cambiar `widgetTemplate: brand.widgetTemplate || 'minimal'` → `|| 'bare'` en el estado inicial y en el `useEffect`

---

## TASK 4 — Subir logo directamente (file picker) ✅
**Archivos:** `frontend/src/components/dashboard/SettingsForm.tsx`
- Reemplazar el input de texto de logo por un file picker
- Convertir imagen a base64 en el cliente
- Llamar al endpoint `POST /api/upload` existente para obtener la URL pública
- Mostrar preview del logo subido

---

## TASK 3 — Sin campañas trial activas → redirigir a pago ✅
**Archivos:**
- `frontend/src/components/auth/RegisterForm.tsx`
- `frontend/src/app/planes/page.tsx`

Lógica:
- Si `trialActive === false`, mostrar mensaje "No hay prueba gratuita disponible" y botón "Ver planes" en lugar del formulario de registro
- En `/planes`, si no hay trial activo, cambiar textos de "Empezar gratis" → "Contratar ahora"
- Botón CTA de la landing también debe reflejar el estado

---

## TASK 1 — Correo de confirmación de email antes de entrar al dashboard ✅
**Archivos backend:**
- `backend/src/services/auth.service.ts` — agregar campo `email_verified: false` al crear usuario, generar token de verificación
- `backend/src/controllers/auth.controller.ts` — después del registro, enviar email de verificación (no de bienvenida)
- `backend/src/templates/email-templates.ts` — agregar template `verifyEmailTemplate`
- `backend/src/routes/auth.routes.ts` — agregar `GET /api/auth/verify-email?token=`

**Archivos frontend:**
- `frontend/src/app/register/page.tsx` — después del registro, redirigir a `/verify-email` en lugar de `/dashboard`
- `frontend/src/components/auth/RegisterForm.tsx` — cambiar redirect
- Crear `frontend/src/app/verify-email/page.tsx` — pantalla "Revisa tu correo"
- Crear `frontend/src/app/auth/verify/page.tsx` — página que consume el token y redirige al dashboard
- Middleware o guard en dashboard para bloquear acceso si `email_verified === false`

**BD (Supabase):**
- Agregar columna `email_verified BOOLEAN DEFAULT false` a tabla `brands`
- Agregar columna `email_verification_token TEXT` a tabla `brands`

---

## TASK 2 — Verificación con tarjeta de crédito para trial (tipo Spotify) ✅
**Archivos backend:**
- `backend/src/services/wompi.service.ts` — ya existe, usar `getCheckoutUrl` con monto $0 o $1
- `backend/src/routes/` — agregar endpoint `POST /api/trial/initiate` que genera URL de Wompi y guarda `pending_trial`
- `backend/src/routes/` — webhook de Wompi ya existe, extender para activar trial al confirmar pago $0

**Archivos frontend:**
- `frontend/src/components/auth/RegisterForm.tsx` — después de crear cuenta, si hay trial activo, redirigir a Wompi para tokenizar tarjeta
- Crear `frontend/src/app/trial-payment/page.tsx` — pantalla intermedia con explicación + botón de Wompi
- `frontend/src/app/register/page.tsx` — ajustar flujo

**Flujo completo:**
1. Usuario llena formulario de registro
2. Backend crea cuenta con `trial_status: 'pending_payment'`
3. Frontend redirige a `/trial-payment` con token temporal
4. Usuario ingresa tarjeta en widget Wompi (cobro $0 o $1 reembolsable)
5. Wompi webhook confirma → backend activa trial (`trial_status: 'active'`)
6. Frontend redirige al dashboard

---

## Estado general
| # | Tarea | Estado |
|---|-------|--------|
| 5 | Template Bare por defecto | ✅ Completado |
| 4 | File picker para logo | ✅ Completado |
| 3 | Sin trial → redirigir a pago | ✅ Completado |
| 1 | Verificación de email | ✅ Completado |
| 2 | Tarjeta para trial (Wompi) | ✅ Completado |
