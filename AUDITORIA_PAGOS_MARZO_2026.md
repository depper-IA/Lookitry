# Auditoría del Sistema de Pagos y Suscripciones — Lookitry
**Fecha:** 19 de marzo de 2026
**Estado:** Crítico / Requiere Acción Inmediata

---

## 1. Resumen de Hallazgos

Se ha detectado que el sistema de pagos presenta fallos estructurales y de configuración que impiden el registro correcto de transacciones, la activación automática de planes y el registro de nuevos usuarios en producción.

### Problemas Críticos Identificados:
1. **Endpoint de Verificación Hardcodeado:** El servicio de Wompi consulta transacciones exclusivamente en el entorno de Sandbox, rompiendo el flujo en Producción.
2. **Invisibilidad de Pagos en Admin:** El backend no expone las transacciones de la tabla `subscription_payments` al panel de administración.
3. **Bloqueo en Registro Post-Pago:** Usuarios existentes que pagan sin estar logueados no pueden activar su plan mediante el flujo `/registro-pro` debido a conflictos de duplicidad de cuenta.
4. **Dependencia del Prorrateo:** La lógica de upgrades depende de registros históricos de pagos que no se están visualizando/verificando correctamente.

---

## 2. Análisis Detallado

### A. Fallo en el Registro del Panel de Administrador
*   **Causa:** El `AdminService` carece de métodos para consultar la tabla `subscription_payments`. Los endpoints actuales (`/api/admin/stats`) solo cuentan el número de marcas por plan, pero no extraen montos ni estados de pago reales.
*   **Consecuencia:** El administrador no puede ver quién ha pagado, cuánto, ni por qué medio.

### B. Fallo en Transición Trial → Básico/Pro (Producción)
*   **Causa:** El método `wompiService.getTransactionByReference` apunta a `https://sandbox.wompi.co`. 
*   **Ubicación:** `backend/src/services/wompi.service.ts`, línea 148.
*   **Consecuencia:** Cuando un usuario paga en producción y llega a `/registro-pro`, el backend intenta verificar el pago en Sandbox. Como el pago no existe allí, devuelve `PAYMENT_REQUIRED` (402), impidiendo que el usuario cree su cuenta a pesar de haber pagado.

### C. Fallo en Upgrades y Prorrateo
*   **Causa:** `SubscriptionService.calculateUpgradeProration` busca el último pago exitoso en la base de datos. Si el pago inicial (Trial → Básico) no se registró correctamente en la tabla `subscription_payments` (debido a fallos en el webhook), el sistema no tiene base para calcular el crédito por días restantes.
*   **Consecuencia:** El usuario termina pagando el precio total del nuevo plan sin recibir el descuento por el tiempo no usado de su plan anterior.

### D. Conflicto de Usuarios "Visitor" vs Existentes
*   **Causa:** Si un usuario con cuenta Trial paga desde la landing pública (sin sesión activa), el sistema le asigna una referencia `visitor_`. Al redirigirlo a `/registro-pro`, el formulario intenta crear una cuenta nueva. 
*   **Consecuencia:** Si el usuario usa su email de siempre, el sistema responde `CONFLICT` (409) porque la cuenta ya existe. El pago queda "huérfano" y la cuenta sigue en Trial.

---

## 3. Hoja de Ruta de Correcciones Recomendadas

### 1. Corregir Entorno de Wompi (Urgente)
Modificar `getTransactionByReference` para usar la URL dinámica según el modo (`testMode`) configurado en `payment_settings`.

### 2. Crear API de Pagos para Admin
Implementar `GET /api/admin/revenue/payments` en el backend que devuelva el contenido de `subscription_payments` con filtros por fecha, marca y estado.

### 3. Mejorar el Webhook de Wompi
Asegurar que `renewSubscription` sea infalible y que, en caso de error, se genere una notificación interna para el administrador en la tabla `admin_notifications` para acción manual.

### 4. Flujo de Activación para Usuarios Logueados
Modificar el checkout para que, si hay una sesión activa, se use siempre el `brandId` real y el webhook active la cuenta inmediatamente sin pasar por `/registro-pro`.

### 5. Resolver Conflicto de Registro Post-Pago
En `registerPostPayment`, si el email ya existe, el sistema debería permitir "vincular" el pago a la cuenta existente tras una verificación de contraseña, en lugar de simplemente fallar por conflicto.

---
**Auditoría realizada por:** Gemini CLI (Senior Frontend/Fullstack Specialist)
