# Conversión COP → USD — Método Único Oficially Approved

**Última actualización:** 29 de Abril 2026

---

## Regla de Oro

**Para calcular precios USD a partir de COP, SIEMPRE usar la fórmula:**

```
precioUSD = Math.ceil((precioCOP + 10000) / trm)
```

**PROHIBIDO** usar cualquier otra fórmula como:
- ❌ `precioCOP / trm` (sin margen)
- ❌ `Math.floor(precioCOP / trm)` (redondeo incorrecto)
- ❌ `Math.round(precioCOP / trm)` (redondeo incorrecto)

---

## Constantes

| Constante | Valor | Descripción |
|-----------|-------|-------------|
| `MINIMUM_MARGIN_COP` | `10000` | Margen mínimo obligatorio en COP |
| `FALLBACK_TRM` | `4000` | TRM por defecto si no se provee válida |

---

## Funciones Aprobadas

### Backend

**`backend/src/utils/pricingCurrency.ts`**
```typescript
const MINIMUM_MARGIN_COP = 10000;
const FALLBACK_TRM = 4000;

export function calculatePriceUSD(amountCOP: number, trm?: number | null): number {
  const safeTrm = trm && trm > 0 ? trm : FALLBACK_TRM;
  return Math.ceil((amountCOP + MINIMUM_MARGIN_COP) / safeTrm);
}

export function getMinimumTrmForConsistency(amountCOP: number, priceUSD: number): number {
  return (amountCOP + MINIMUM_MARGIN_COP) / priceUSD;
}
```

**`backend/src/services/paypal.service.ts`**
```typescript
// Alias aprobado - usa calculatePriceUSD internamente
convertCopToUsd(amountCOP: number, trm: number): number {
  return calculatePriceUSD(amountCOP, trm);
}
```

### Frontend

**`frontend/src/lib/pricing.ts`**
```typescript
const MINIMUM_MARGIN_COP = 10000;

export function precioEnUSD(precioCop: number, trm: number): number {
  const safeTrm = trm > 0 ? trm : 4000;
  return Math.ceil((precioCop + MINIMUM_MARGIN_COP) / safeTrm);
}
```

**`frontend/src/utils/currency.ts`**
```typescript
const MINIMUM_MARGIN_COP = 10000;

export function formatPrice(amountInCOP: number, paymentMethodOrCurrency: 'wompi' | 'paypal' | 'COP' | 'USD', trm: number): string {
  const isUSD = paymentMethodOrCurrency === 'paypal' || paymentMethodOrCurrency === 'USD';
  if (isUSD) {
    const safeTrm = trm > 0 ? trm : 4000;
    const amountInUSD = Math.ceil((amountInCOP + MINIMUM_MARGIN_COP) / safeTrm);
    return formatCurrency(amountInUSD, 'USD');
  }
  return formatCurrency(amountInCOP, 'COP');
}
```

**`frontend/src/lib/paymentDisplay.ts`**
```typescript
const MINIMUM_MARGIN_COP = 10000;

export function priceInUsd(amountCop: number, trm: number): number {
  const safeTrm = trm > 0 ? trm : 4000;
  return Math.ceil((amountCop + MINIMUM_MARGIN_COP) / safeTrm);
}
```

---

## Verificación de Precios

| Plan | Precio COP | TRM 4000 | Precio USD | Equivalente COP | Margen |
|------|------------|----------|------------|------------------|--------|
| BASIC | 180,000 | 4000 | **48 USD** | 192,000 | 12,000 ✅ |
| PRO | 350,000 | 4000 | **90 USD** | 360,000 | 10,000 ✅ |
| Landing | 650,000 | 4000 | **165 USD** | 660,000 | 10,000 ✅ |

---

## Puntos de Uso Verificados

| Archivo | Función | Estado |
|---------|---------|--------|
| `backend/src/utils/pricingCurrency.ts` | `calculatePriceUSD()` | ✅ ÚNICA fuente de verdad |
| `backend/src/services/paypal.service.ts` | `convertCopToUsd()` | ✅ Alias |
| `frontend/src/lib/pricing.ts` | `precioEnUSD()` | ✅ Verificado |
| `frontend/src/utils/currency.ts` | `formatPrice()` | ✅ Verificado |
| `frontend/src/lib/paymentDisplay.ts` | `priceInUsd()` | ✅ Verificado |
| `frontend/src/components/checkout/PaymentMethodSelector.tsx` | `formatUSD()` | ✅ Verificado |
| `frontend/src/components/checkout/CheckoutSummary.tsx` | cálculo inline | ✅ Verificado |
| `frontend/src/app/dashboard/checkout/page.tsx` | `formatPaypalUsd()` | ✅ Verificado |
| `frontend/src/app/dashboard/checkout-landing/page.tsx` | `formatPaypalUsd()` | ✅ Verificado |

---

## Cómo Agregar Nuevos Cálculos USD

1. **Importar** la función de pricingCurrency si está en backend
2. **Usar** la fórmula `Math.ceil((amountCOP + 10000) / safeTrm)`
3. **Nunca** hardcodear `amountCOP / trm` directo
4. **Verificar** que el resultado cumple el margen de 10,000 COP

---

## Reglas de Negocio

1. **El precio USD SIEMPRE debe ser más caro en COP equivalente** que el precio COP original
2. **Margen mínimo**: 10,000 COP entre precio COP y equivalente USD
3. **Redondeo**: Siempre `Math.ceil` (hacia arriba, nunca hacia abajo)
4. **TRM inválida**: Usar fallback de 4000 si trm ≤ 0

---

_Last updated: 2026-04-29_
