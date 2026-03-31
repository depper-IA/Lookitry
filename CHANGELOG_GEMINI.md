# Changelog - Lookitry (AI Assisted)

## [2026-03-31] - Corrección de Marca y Flujo Post-Registro

### Cambios Realizados
- **`checkout/page.tsx`**: Eliminado plan ENTERPRISE del selector público. Solo quedan TRIAL, BASIC, PRO y LANDING. Paleta de colores migrada de indigo/violet a naranja institucional `#FF5C3A`. Corrección de grises (secundarios `#555`–`#999`).
- **`StepProgress.tsx`**: Reescritura completa usando `#FF5C3A` para pasos activos/completados, eliminando todas las clases `indigo-*`.
- **`registro-pro/page.tsx`**: Fix crítico de UX — cambiado `router.push('/dashboard')` por `window.location.href='/dashboard'` para forzar recarga completa y asegurar que el JWT en localStorage sea leído antes de la verificación de auth. Añadido `autoComplete="off"` al campo slug para prevenir autofill de email del navegador.

### Archivos Modificados
- `frontend/src/app/checkout/page.tsx`
- `frontend/src/components/payments/StepProgress.tsx`
- `frontend/src/app/registro-pro/page.tsx`

### Motivo
Corrección de incumplimiento de las reglas de diseño (#FF5C3A como único acento cromático), eliminación del plan Enterprise del flujo público, y fix del flujo post-registro que enviaba al login en vez del dashboard.

---

## [2026-03-31] - Cierre de Auditoría de Registro y Pago


### Cambios Realizados
- **Frontend**:
  - `frontend/src/app/pago-exitoso/page.tsx`: Integración de `StepProgress` (Paso 4) y humanización integral de mensajes post-pago.
  - `frontend/src/app/registro-pro/page.tsx`: Evolución a "Paso 4: Activación" con `StepProgress`. Refuerzo de seguridad: contraseñas de 8+ caracteres y campo de confirmación obligatorio. Eliminación de etiquetas técnicas (`ref`, `status`).
  - `frontend/src/components/auth/LoginForm.tsx`: Implementación de botón y lógica para reenvío de email de verificación ante error `EMAIL_NOT_VERIFIED`.
- **Servicios**:
  - `frontend/src/services/auth.service.ts`: Adición del método `resendVerification` para comunicación con el backend.

### Motivo
Cumplir con los estándares de seguridad y UX de la auditoría técnica, asegurando un flujo de onboarding continuo de 4 pasos, sin lenguaje técnico crudo y con mecanismos de recuperación de cuenta (reenvío de activación) integrados.

### Archivos Modificados
- `frontend/src/app/pago-exitoso/page.tsx`
- `frontend/src/app/registro-pro/page.tsx`
- `frontend/src/components/auth/LoginForm.tsx`
- `frontend/src/services/auth.service.ts`
- `CHANGELOG_GEMINI.md`
