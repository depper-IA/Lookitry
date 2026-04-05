# Auditoría del Sistema de Registro y Checkout - Lookitry

## 1. Diagnóstico Técnico: ¿Por qué se rompió el sistema?

Tras auditar el código actual en `backend/src/controllers/auth.controller.ts` y `frontend/src/app/register/page.tsx`, se identificaron las siguientes fallas críticas:

| Causa Raíz | Descripción | Consecuencia |
| :--- | :--- | :--- |
| **Inconsistencia de Contratos (DTOs)** | El frontend envía `brandName` y `contactName`, pero el backend espera `name` y `contact_name`. | El registro manual falla con errores de validación (400) o crea registros incompletos. |
| **Creación Prematura de Cuentas** | El sistema crea la marca en la base de datos *antes* de confirmar el pago del Trial. | Genera registros "fantasma" que bloquean el email y el slug si el usuario abandona el checkout. |
| **Duplicidad de Lógica** | Existen dos flujos paralelos (`register` y `registerPostPayment`) con validaciones de slug y contraseña duplicadas y no sincronizadas. | Inconsistencias en la seguridad y dificultad para mantener el código. |
| **Fricción en Google Auth** | El flujo actual de Google intenta crear la marca inmediatamente sin preguntar por el `slug` personalizado, lo que rompe la lógica de Marca Personalizada. | Usuarios de Google terminan con slugs genéricos basados en su ID de Google. |

---

## 2. Propuesta: Nuevo Sistema de Registro y Checkout (Greenfield)

He diseñado un flujo unificado que prioriza la **integridad de datos** y la **conversión**, separando la autenticación de la configuración de la marca.

### A. El Flujo Unificado (User Flow)
1.  **Selección de Plan**: El usuario elige Trial ($20k), Basic o Pro en la Landing.
2.  **Autenticación (Paso 1)**:
    *   **Google Auth**: Se autentica y obtenemos su Email/Nombre.
    *   **Registro Manual**: Ingresa Email y Password (validación fuerte en frontend).
3.  **Configuración de Marca (Paso 2)**:
    *   Aquí es donde ingresa el **Nombre de la Marca** y el **Slug** personalizado.
    *   Validación en tiempo real de disponibilidad de Slug.
4.  **Checkout (Paso 3)**:
    *   Se procesa el pago según el plan.
    *   La **Landing Page** se maneja como un `add-on` (booleano `has_landing_page: true`).
5.  **Activación Final**: Solo tras el éxito del pago (webhook), se marca la cuenta como activa y se asignan los beneficios del plan.

### B. Lógica de Planes y Add-ons

| Plan | Trial | Basic | Pro |
| :--- | :--- | :--- | :--- |
| **Precio** | $20.000 COP (Pago único) | Mensual / Anual | Mensual / Anual |
| **Duración** | 7 Días | Recurrente | Recurrente |
| **Landing Add-on** | No disponible | Opcional (+$) | Incluido o Opcional |

> **Nota sobre el Slug**: El slug debe ser único y seguir el formato `^[a-z0-9-]+$`. En el nuevo sistema, si el usuario viene de Google, el sistema le sugerirá un slug basado en su nombre, pero **debe** confirmarlo o cambiarlo antes de pagar.

---

## 3. Guía de Implementación Técnica

### Backend (Node.js/TypeScript)
1.  **Unificar DTO de Registro**: Crear una interfaz `UnifiedRegisterDto` que incluya `authProvider` (google/password).
2.  **Middleware de Validación**: Un solo lugar para validar complejidad de password y formato de slug.
3.  **Webhook de Pago Robusto**: El webhook de Wompi/PayPal debe ser el único responsable de cambiar el estado de `plan` de `PENDING` a `ACTIVE`.

### Frontend (Next.js/React)
1.  **Componente `BrandOnboarding`**: Un formulario modular que se muestra tanto para usuarios nuevos manuales como para los que acaban de entrar con Google.
2.  **Estado Global**: Usar un store (Zustand o Context) para mantener los datos de la marca durante el proceso de checkout sin persistirlos en DB prematuramente.

---

**Recomendación Final**: Dado que el sistema actual tiene múltiples "parches" de campañas anteriores, la mejor opción es implementar este nuevo flujo en una ruta limpia (`/v2/register`) y, una vez probado, reemplazar la anterior.
