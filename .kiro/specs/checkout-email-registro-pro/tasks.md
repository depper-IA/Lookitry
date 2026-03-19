# Plan de Implementación: checkout-email-registro-pro

## Overview

Implementación incremental del flujo de pago para usuarios nuevos en Lookitry. Se parte de la migración de base de datos, luego se construye la capa de servicio, se modifican los controladores backend, y finalmente se actualiza el frontend. Cada paso integra lo anterior para evitar código huérfano.

## Tasks

- [x] 1. Migración SQL — tabla `pending_registrations`
  - Crear el archivo `backend/src/db/migrations/001_pending_registrations.sql` con el DDL de la tabla
  - Incluir: `id` (uuid PK), `email` (text NOT NULL), `reference` (text UNIQUE NOT NULL), `plan` (text NOT NULL), `months` (integer NOT NULL), `created_at` (timestamptz DEFAULT now())
  - Agregar `ALTER TABLE pending_registrations DISABLE ROW LEVEL SECURITY;`
  - El archivo debe ser ejecutable manualmente en el SQL Editor de Supabase
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [~] 2. Agregar `getTransactionByReference` a `WompiService`
  - [~] 2.1 Implementar el método en `backend/src/services/wompi.service.ts`
    - Firma: `async getTransactionByReference(reference: string): Promise<{ status: string } | null>`
    - Llamar a `GET https://sandbox.wompi.co/v1/transactions?reference={reference}` con el header `Authorization: Bearer {WOMPI_PRIVATE_KEY}`
    - Retornar el primer elemento de `data` o `null` si el array está vacío o la llamada falla
    - En caso de error de red → lanzar error con mensaje `"Error al verificar el pago con Wompi"` para que el controlador lo capture como 502
    - _Requirements: 5.1_

  - [ ]* 2.2 Escribir test de propiedad para `getTransactionByReference`
    - **Property 5: Transacción no aprobada bloquea el registro**
    - **Validates: Requirements 5.1, 5.2**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Usar `fc.oneof(fc.constant('DECLINED'), fc.constant('VOIDED'), fc.constant('ERROR'), fc.constant(null))` para estados no aprobados
    - Mockear `wompiService.getTransactionByReference` para retornar cada estado y verificar que el controlador retorna 402

- [~] 3. Modificar `GET /api/payments/wompi/checkout-url` — crear pending_registration
  - [~] 3.1 Actualizar `getCheckoutUrl` en `backend/src/controllers/wompi.controller.ts`
    - Leer `email` desde `req.query` (opcional)
    - Si `!brand?.id` (sin sesión) **y** hay `email` → insertar en `pending_registrations` usando `supabaseAdmin` con `{ email, reference, plan: planStr, months: monthsNum }`
    - La `reference` se extrae de la `checkoutUrl` generada por `wompiService.getCheckoutUrl` (o generarla antes de llamar al servicio)
    - Cambiar `successPath` para usuarios sin sesión a `/registro-pro?ref={reference}` (incluir la referencia en la URL de redirect)
    - Si falla el INSERT → retornar 500 y no retornar `checkoutUrl`
    - Si no hay `email` y no hay sesión → mantener flujo legacy sin crear pending
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 3.2 Escribir test de propiedad para round-trip de pending_registration
    - **Property 2: Pending registration round-trip**
    - **Validates: Requirements 2.1, 2.5**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Usar `fc.record({ email: fc.emailAddress(), plan: fc.constantFrom('BASIC', 'PRO'), months: fc.integer({ min: 1, max: 12 }) })`
    - Mockear `supabaseAdmin` y verificar que el INSERT recibe exactamente los valores generados

- [~] 4. Modificar `POST /api/payments/wompi/webhook` — ignorar referencias `visitor_`
  - [~] 4.1 Actualizar `handleWebhook` en `backend/src/controllers/wompi.controller.ts`
    - Después de extraer `brandId`, verificar si empieza con `visitor_`
    - Si empieza con `visitor_` → consultar `pending_registrations` con `supabaseAdmin` donde `reference = reference`
    - Si existe el pending → `console.log('[Wompi] Pending sin marca, ignorando activación')` y retornar `res.status(200).json({ received: true })`
    - Si no existe el pending → `console.warn('[Wompi] Referencia visitor_ sin pending conocido:', reference)` y retornar `res.status(200).json({ received: true })`
    - Si `brandId` es UUID real → flujo actual sin cambios
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ]* 4.2 Escribir test de propiedad para webhook con referencias `visitor_`
    - **Property 7: Webhook ignora referencias visitor_ con pending**
    - **Validates: Requirements 7.1, 7.3**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Usar `fc.string({ minLength: 1, maxLength: 20 })` para generar sufijos de `visitor_`
    - Mockear `supabaseAdmin.from('brands').update` y verificar que nunca se llama cuando el brandId empieza con `visitor_`

- [~] 5. Checkpoint — verificar backend hasta aquí
  - Asegurarse de que todos los tests pasen. Consultar al usuario si hay dudas antes de continuar con el controlador de registro.

- [~] 6. Modificar `POST /api/auth/register-post-payment` — flujo con `ref`
  - [~] 6.1 Reescribir `registerPostPayment` en `backend/src/controllers/auth-post-payment.controller.ts`
    - Cambiar body esperado: recibir `ref` en lugar de `email` (eliminar `email` y `phone` del destructuring)
    - Validar que `ref` esté presente → si no, retornar 400 `"La referencia de pago es requerida"`
    - Buscar en `pending_registrations` con `supabaseAdmin` donde `reference = ref`
    - Si no existe → retornar 404 `"Referencia de pago no encontrada"`
    - Llamar a `wompiService.getTransactionByReference(ref)` para verificar el estado
    - Si `status !== 'APPROVED'` → retornar 402 `"El pago no ha sido confirmado aún"`
    - Si falla la llamada a Wompi → retornar 502 `"Error al verificar el pago con Wompi"`
    - Usar `email`, `plan` y `months` del pending para llamar a `authService.register`
    - Mantener el envío asíncrono del email de verificación con el email del pending
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3_

  - [ ]* 6.2 Escribir test de propiedad — referencia inexistente retorna 404
    - **Property 3: Referencia inexistente retorna 404**
    - **Validates: Requirements 4.2**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Usar `fc.string({ minLength: 1 })` para referencias arbitrarias
    - Mockear `supabaseAdmin` para retornar `{ data: null }` y verificar que la respuesta es 404

  - [ ]* 6.3 Escribir test de propiedad — email del pending se propaga a la cuenta
    - **Property 4: Email del pending se propaga a la cuenta creada**
    - **Validates: Requirements 4.1, 4.3**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Usar `fc.emailAddress()` para generar emails arbitrarios en el pending
    - Mockear `supabaseAdmin`, `wompiService` (APPROVED) y `authService.register`
    - Verificar que `authService.register` recibe exactamente el email del pending

  - [ ]* 6.4 Escribir test de propiedad — plan y months del pending en la suscripción
    - **Property 6: Plan y months del pending se usan en la suscripción**
    - **Validates: Requirements 5.3**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Usar `fc.record({ plan: fc.constantFrom('BASIC', 'PRO'), months: fc.integer({ min: 1, max: 12 }) })`
    - Verificar que `authService.register` recibe el `plan` y `months` del pending

- [~] 7. Modificar frontend `/registro-pro` — eliminar email y teléfono, validar `ref`
  - [~] 7.1 Actualizar `frontend/src/app/registro-pro/page.tsx`
    - Eliminar `email` y `phone` del estado `form` y del JSX
    - Eliminar la validación de email del método `validate()`
    - Si `!ref` al montar el componente → renderizar bloque de error en lugar del formulario (mensaje: "Referencia de pago requerida. Accede desde el enlace de confirmación de tu pago.")
    - En `handleSubmit` → eliminar `email` y `phone` del body enviado al backend; asegurarse de que `ref` se envía
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.2 Escribir test de propiedad — emails inválidos rechazados en checkout
    - **Property 1: Emails inválidos son rechazados en checkout**
    - **Validates: Requirements 1.2**
    - Archivo: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
    - Extraer la función `isValidEmail` a un módulo compartido o testear la regex directamente
    - Usar `fc.oneof(fc.string().filter(s => !s.includes('@')), fc.constant(''), fc.constant('   '))` para emails inválidos
    - Verificar que `isValidEmail(invalidEmail) === false` para todos los casos generados

- [~] 8. Modificar frontend `/checkout` — agregar campo email para usuarios sin sesión
  - [~] 8.1 Actualizar el componente de checkout público (`frontend/src/app/checkout/page.tsx` o equivalente)
    - Agregar estado `email` y `emailError`
    - Detectar sesión: `const hasSession = !!localStorage.getItem('token')`
    - Si `!hasSession` → renderizar campo de email antes del botón "Pagar"
    - Validar formato de email con regex `[^\s@]+@[^\s@]+\.[^\s@]+` antes de llamar al backend
    - Si email inválido → mostrar error inline y no proceder
    - Pasar `email` como query param en la llamada a `checkout-url`: `?amount=...&months=...&plan=...&email=${encodeURIComponent(email)}`
    - Si `hasSession` → omitir campo de email y proceder como antes
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [~] 9. Checkpoint final — integración completa
  - Asegurarse de que todos los tests pasen.
  - Verificar que el flujo completo está conectado: checkout → pending_registration → registro-pro → register-post-payment → activación de suscripción.
  - Consultar al usuario si hay dudas antes de dar por terminada la implementación.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los tests de propiedad usan `fast-check` con `numRuns: 100` mínimo
- El archivo de tests de propiedad es único: `backend/src/__tests__/properties/checkout-email-registro-pro.property.test.ts`
- `supabaseAdmin` se usa en todas las operaciones sobre `pending_registrations` (bypasea RLS)
- La migración SQL se ejecuta manualmente en Supabase SQL Editor, no como parte del código
