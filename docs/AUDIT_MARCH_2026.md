# Auditoría Técnica Lookitry — Marzo 2026

## Hallazgos Críticos (Bloqueantes)
- [ ] **Onboarding Wizard**: Paso 4 redirige a `/dashboard/embed` (404). Debe redirigir a configuración de integraciones.
- [ ] **PayPal Checkout**: Actualmente es simulado (WhatsApp). Debe procesar pagos reales en USD.
- [ ] **Conversión de Moneda**: Riesgo de enviar montos USD a Wompi (que solo acepta COP).

## Hallazgos de Alta Prioridad
- [ ] **Sidebar**: El estado `isActive` falla en subrutas de documentación e integraciones.
- [ ] **Estado del Sistema**: Usa datos `Math.random()`. Debe mostrar telemetría real o un "All systems operational" estático basado en salud real.
- [ ] **Enlaces Placeholder**: Múltiples `href="#"` en páginas de productos y documentación.

## Hallazgos de Media Prioridad
- [ ] **Tailwind**: Clase inválida `border(--border-color)` en el home del dashboard.
- [ ] **Accesibilidad Móvil**: Uso extensivo de `text-[8px]` a `text-[10px]`. Recomendado mínimo `text-xs` (12px).
- [ ] **Seguridad**: Enlaces externos sin `rel="noopener noreferrer"`.

## Hallazgos de Baja Prioridad
- [ ] **Contenido**: Texto placeholder en secciones de soporte y números de teléfono genéricos.
