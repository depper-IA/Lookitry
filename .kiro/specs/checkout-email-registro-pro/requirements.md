# Requirements Document

## Introduction

Mejora al flujo de pago y registro post-venta de Lookitry. Actualmente, cuando un usuario nuevo paga a través de Wompi y es redirigido a `/registro-pro`, si no completa el registro el pago queda huérfano sin ningún registro en el sistema. Esta feature resuelve ese problema capturando el email del usuario **antes** de generar la URL de Wompi, guardándolo junto con la referencia de pago en una tabla `pending_registrations`, y usando esa información para completar el registro post-pago sin volver a pedir el email.

## Glossary

- **Checkout**: Página pública `/checkout` donde el usuario selecciona plan, meses y paga.
- **Pending_Registration**: Registro temporal en la tabla `pending_registrations` que asocia un email con una referencia de pago de Wompi antes de que el usuario cree su cuenta.
- **Reference**: Identificador único de transacción generado por el sistema y enviado a Wompi (formato existente: `brandId-plan-months-timestamp`). Para usuarios nuevos, el `brandId` es un ID temporal (`visitor_TIMESTAMP`).
- **Registro_Pro_Form**: Formulario en `/registro-pro` donde el usuario completa su cuenta tras el pago.
- **Auth_Post_Payment_Controller**: Controlador Express en `backend/src/controllers/auth-post-payment.controller.ts` que procesa el registro post-pago.
- **Wompi_Controller**: Controlador Express en `backend/src/controllers/wompi.controller.ts` que genera la URL de checkout y maneja el webhook.
- **Wompi**: Pasarela de pagos colombiana utilizada por Lookitry.
- **Supabase_Admin**: Cliente de Supabase con service role que bypasea RLS, usado para operaciones administrativas en el backend.

---

## Requirements

### Requirement 1: Captura de email antes del pago

**User Story:** Como usuario nuevo que quiere contratar un plan, quiero ingresar mi email antes de ser redirigido a Wompi, para que mi pago quede vinculado a mi correo aunque no complete el registro de inmediato.

#### Acceptance Criteria

1. WHEN el usuario hace clic en "Pagar" en `/checkout` sin sesión activa, THE Checkout SHALL mostrar un campo de email antes de generar la URL de Wompi.
2. WHEN el usuario ingresa un email con formato inválido, THE Checkout SHALL mostrar un mensaje de error de validación y no proceder al pago.
3. WHEN el usuario ingresa un email válido y confirma el pago, THE Checkout SHALL enviar el email al backend junto con los parámetros de pago (plan, meses, monto) antes de redirigir a Wompi.
4. WHERE el usuario ya tiene sesión activa (JWT válido en localStorage), THE Checkout SHALL omitir el campo de email y proceder directamente al pago como en el flujo actual.

---

### Requirement 2: Persistencia del pending_registration

**User Story:** Como sistema, quiero guardar el email del usuario junto con la referencia de pago antes de redirigirlo a Wompi, para poder recuperar ese email durante el registro post-pago.

#### Acceptance Criteria

1. WHEN el backend recibe una solicitud de checkout URL para un usuario sin sesión con email incluido, THE Wompi_Controller SHALL crear un registro en la tabla `pending_registrations` con los campos: `id` (uuid), `email`, `reference`, `plan`, `months`, `created_at`.
2. WHEN el registro en `pending_registrations` se crea exitosamente, THE Wompi_Controller SHALL retornar la `checkoutUrl` al frontend.
3. IF la creación del registro en `pending_registrations` falla, THEN THE Wompi_Controller SHALL retornar un error 500 y no redirigir al usuario a Wompi.
4. THE Wompi_Controller SHALL usar `supabaseAdmin` para todas las operaciones sobre `pending_registrations`.
5. WHEN se genera la referencia para un usuario sin sesión, THE Wompi_Controller SHALL incluir el email en el campo `reference` de `pending_registrations` usando la referencia generada por `wompiService.getCheckoutUrl`.

---

### Requirement 3: Formulario de registro post-pago sin campo de email

**User Story:** Como usuario que ya pagó, quiero completar mi registro sin tener que ingresar mi email de nuevo, para tener una experiencia más fluida y sin fricción.

#### Acceptance Criteria

1. THE Registro_Pro_Form SHALL mostrar únicamente los campos: nombre completo (`contact_name`), nombre de marca (`name`), slug (`slug`) y contraseña (`password`).
2. THE Registro_Pro_Form SHALL eliminar el campo de email del formulario visible.
3. WHEN el formulario carga con un parámetro `ref` en la URL, THE Registro_Pro_Form SHALL mostrar los campos de registro sin campo de email.
4. IF el parámetro `ref` no está presente en la URL, THEN THE Registro_Pro_Form SHALL mostrar un mensaje de error indicando que la referencia de pago es requerida.
5. THE Registro_Pro_Form SHALL eliminar el campo de teléfono del formulario (no es requerido en el flujo post-pago).

---

### Requirement 4: Recuperación del email desde pending_registrations en el submit

**User Story:** Como sistema, quiero recuperar el email guardado en `pending_registrations` al momento del submit del registro, para crear la cuenta con el email correcto sin pedírselo al usuario de nuevo.

#### Acceptance Criteria

1. WHEN el usuario hace submit del formulario de registro post-pago con una `reference` válida, THE Auth_Post_Payment_Controller SHALL buscar el registro en `pending_registrations` usando la `reference` recibida.
2. IF no existe un `pending_registration` con la `reference` proporcionada, THEN THE Auth_Post_Payment_Controller SHALL retornar un error 404 con mensaje `"Referencia de pago no encontrada"`.
3. WHEN se encuentra el `pending_registration`, THE Auth_Post_Payment_Controller SHALL usar el `email` almacenado en ese registro para crear la cuenta de la marca.
4. WHEN la cuenta se crea exitosamente, THE Auth_Post_Payment_Controller SHALL retornar el token JWT y los datos de la marca al frontend.
5. THE Auth_Post_Payment_Controller SHALL usar `supabaseAdmin` para consultar `pending_registrations`.

---

### Requirement 5: Verificación de transacción Wompi en el registro

**User Story:** Como sistema, quiero verificar que la transacción de Wompi asociada a la referencia fue aprobada antes de crear la cuenta, para evitar registros sin pago real.

#### Acceptance Criteria

1. WHEN el Auth_Post_Payment_Controller encuentra el `pending_registration`, THE Auth_Post_Payment_Controller SHALL consultar la API de Wompi para verificar el estado de la transacción usando la `reference`.
2. IF la transacción no existe o su estado no es `APPROVED`, THEN THE Auth_Post_Payment_Controller SHALL retornar un error 402 con mensaje `"El pago no ha sido confirmado aún"`.
3. WHEN la transacción está `APPROVED`, THE Auth_Post_Payment_Controller SHALL proceder a crear la marca y activar la suscripción con el `plan` y `months` del `pending_registration`.
4. WHEN la suscripción se activa exitosamente, THE Auth_Post_Payment_Controller SHALL insertar un registro en `subscription_payments` con `status: 'completed'`.

---

### Requirement 6: Envío de email de verificación post-registro

**User Story:** Como usuario que acaba de crear su cuenta post-pago, quiero recibir un email de verificación, para poder verificar mi correo desde el dashboard con la lógica ya existente.

#### Acceptance Criteria

1. WHEN la cuenta se crea exitosamente en el flujo post-pago, THE Auth_Post_Payment_Controller SHALL enviar un email de verificación al email del `pending_registration` usando el `EmailService` existente.
2. THE Auth_Post_Payment_Controller SHALL enviar el email de verificación de forma asíncrona (sin bloquear la respuesta al frontend).
3. IF el envío del email de verificación falla, THEN THE Auth_Post_Payment_Controller SHALL registrar el error en consola y continuar sin retornar error al usuario.

---

### Requirement 7: Comportamiento del webhook de Wompi con pending_registrations

**User Story:** Como sistema, quiero que el webhook de Wompi maneje correctamente las referencias de usuarios nuevos que aún no completaron el registro, para no generar errores ni activaciones incorrectas.

#### Acceptance Criteria

1. WHEN el webhook de Wompi recibe una transacción `APPROVED` con una referencia que tiene un `pending_registration` pero no tiene una marca asociada, THE Wompi_Controller SHALL registrar el evento en consola y retornar `200 OK` sin intentar activar ninguna suscripción.
2. WHEN el webhook de Wompi recibe una transacción `APPROVED` con una referencia que corresponde a una marca existente (flujo de renovación), THE Wompi_Controller SHALL procesar la renovación normalmente como en el flujo actual.
3. THE Wompi_Controller SHALL distinguir entre referencias de usuarios nuevos (con `pending_registration`) y referencias de marcas existentes antes de procesar el webhook.

---

### Requirement 8: Migración de base de datos — tabla pending_registrations

**User Story:** Como desarrollador, quiero que la tabla `pending_registrations` exista en Supabase con la estructura correcta, para que el sistema pueda persistir los registros pendientes.

#### Acceptance Criteria

1. THE tabla `pending_registrations` SHALL contener los campos: `id` (uuid, PK, default `gen_random_uuid()`), `email` (text, NOT NULL), `reference` (text, UNIQUE, NOT NULL), `plan` (text, NOT NULL), `months` (integer, NOT NULL), `created_at` (timestamptz, default `now()`).
2. THE tabla `pending_registrations` SHALL tener un índice único sobre el campo `reference`.
3. THE tabla `pending_registrations` SHALL tener RLS deshabilitado o con política que permita solo operaciones desde service role (el backend usa `supabaseAdmin`).
4. THE script de migración SQL SHALL ser proporcionado como archivo ejecutable manualmente en Supabase SQL Editor.
