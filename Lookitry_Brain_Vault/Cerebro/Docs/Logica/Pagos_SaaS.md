# Lógica Maestra: Pagos, Prorrateo y Upgrades

Este documento detalla cómo Lookitry gestiona la facturación, los cambios de plan y el crédito a favor del usuario. Es el motor financiero del SaaS.

## 1. El Core de Pagos (Wompi)
Lookitry utiliza **Wompi** como pasarela principal. La lógica reside en `wompi.controller.ts` y se apoya en `subscription.service.ts`.

### Ciclo de vida de una transacción:
1. **Generación de Referencia**: Se crea una referencia única (ej. `PRO-brandId-timestamp`) que codifica el plan y los meses.
2. **Webhook de Aprobación**: Al recibir un pago `APPROVED`, el sistema:
   - Valida el **checksum** (seguridad HMAC).
   - Verifica que el monto pagado coincida con el esperado (tolerancia del 2%).
   - Ejecuta `renewSubscription`.

## 2. Lógica de Upgrade (BASIC → PRO)
Configurada para que el usuario nunca pierda dinero al subir de nivel.

### El cálculo del Prorrateo:
```
Crédito = (Precio Pagado Plan Actual / Días Totales) * Días Restantes
Monto a Pagar = Máximo(0, Precio Nuevo Plan - Crédito)
```
- **Si el Monto es > 0**: Se genera una pasarela de pago normal.
- **Si el Monto es 0**: Se activa el `applyFreeUpgrade` inmediatamente.

### Reglas de Oro del Upgrade:
- **Fecha de Fin**: Al hacer upgrade, la nueva suscripción comienza **HOY**. No se suma al final de la anterior para evitar que el usuario pague por un servicio "PRO" que no puede usar de inmediato.
- **Landing Page**: El pago de la Mini-landing es único y **no entra** en el prorrateo de suscripción mensual.

## 3. Checkout Gratuito (Cupones del 100%)
Permite registros sin pasarela de pago si:
- Se usa un cupón válido del 100%.
- El administrador lo activa manualmente para una marca (`free_checkout`).

## 4. Tipos de Referencias Especiales
| Prefijo | Uso |
|---------|-----|
| `TRIAL-` | Período de prueba gratuito. |
| `FREE-` | Upgrades que no requirieron cobro por crédito a favor. |
| `ADDON-` | Compra de créditos extra de generación. |
| `GUEST-` | Compras realizadas por usuarios no logueados. |

> [!IMPORTANT]
> **Seguridad**: El webhook de Wompi solo procesa transacciones con estado `APPROVED`. Cualquier otro estado se loguea en `payment_logs` pero no activa servicios.
