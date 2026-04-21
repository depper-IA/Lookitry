# Spec: Programa de Referidos Lookitry — Mejora de Marketing

**Fecha:** 2026-04-20
**Estado:** Listo para implementación

---

## Resumen del Cambio

Rediseñar la página `dashboard/referral/page.tsx` para que comunique claramente los beneficios de AMBAS partes (referidor y referido), con CTAs accionables y urgencia legítima.

---

## Sistema de Créditos (Confirmado)

| Rol | Beneficio | Condición |
|-----|-----------|-----------|
| **Referidor** | +500 créditos | Cuando el referido paga su primer plan (Basic/Pro/Enterprise) |
| **Referido** | +100 créditos | Cuando activa su cuenta (YA sea trial o pago? → verificar) |

> **Nota técnica:** `creditReferred()` se llama dentro de `convertReferralForFirstPaidPlan()`, lo que significa que el referido recibe sus 100 créditos cuando el referidor convierte. Esto sugiere que AMBOS créditos se otorgan al MISMO momento (primer pago elegible del referido).
>
> **Esto es un problema de marketing:** el referido debería recibir sus 100 créditos AL REGISTRARSE con código de referido, no esperar a que convierta. Pero ese cambio requiere modificar el backend. Por ahora, la UI puede decir "Desbloquea tus 100 créditos cuando actives tu plan".

---

## Arquitectura de UI

### Estructura de Página

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "Recomienda y gana" + tagline                       │
├─────────────────────────────────────────────────────────────┤
│  HERO CARD (código de referido prominente)                   │
│  - Tu código: CODE123                                       │
│  - "Copia tu código para compartir"                         │
│  - Botón copiar                                             │
├─────────────────────────────────────────────────────────────┤
│  DOS COLUMNAS: Beneficios                                   │
│  ┌─────────────────┐  ┌─────────────────┐                   │
│  │ 🏆 Tu beneficio  │  │ 🎁 Beneficio    │                   │
│  │ 500 créditos    │  │ del referido    │                   │
│  │ al convertir    │  │ 100 créditos    │                   │
│  │                 │  │ al suscribir    │                   │
│  └─────────────────┘  └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  STATS: Invitados | Convertidos | Créditos ganados          │
├─────────────────────────────────────────────────────────────┤
│  SECCIÓN: "¿Tienes un código?" (para quien RECIBE)           │
│  - Explica el beneficio: "Gana 100 créditos"                │
│  - Muestra el estado: cómo desbloquear                      │
│  - Input para canjear código                               │
├─────────────────────────────────────────────────────────────┤
│  "Cómo funciona" (flujo completo referidor + referido)      │
├─────────────────────────────────────────────────────────────┤
│  Lista de referidos recientes                               │
└─────────────────────────────────────────────────────────────┘
```

### Principios de Diseño

1. **Separación clara de beneficios** — el referidor y el referido ven su propio beneficio
2. **Urgencia legítima** — "El referido debe suscribirse a Basic o Pro"
3. **Estado visible** — para quienes ya tienen código aplicado, mostrar progreso
4. **Copy marketing-driven** — no técnico, sino emocional y claro

### Copy Clave

**Header:**
- "Recomienda y gana"
- "Cada tienda que conviertas te da 500 créditos extra. Y tu invitado también gana 100."

**Hero del código:**
- "Tu código de referido"
- Subtext: "Compártelo con tiendas de moda que necesiten un probador virtual"

**Beneficio referidor:**
- Título: "Ganas 500 fotos"
- Body: "Cuando tu invitado pague su primer plan Basic o Pro"

**Beneficio referido:**
- Título: "Gana 100 fotos"
- Body: "Al activar tu plan (Basic o Pro) con este código"
- Badge: "Código aplicado" si ya tiene uno

**Sección para quien RECIBE:**
- Título: "¿Te invitaron?"
- Beneficio claro: "Gana 100 créditos gratis al suscribirte"
- Estado: "Activa tu plan Basic o Pro para desbloquearlos"
- Input: Código de referido

**Cómo funciona (mejorado):**
1. Compartes tu código → Tu invitado lo usa al registrarse
2. Tu invitado se suscribe a Basic o superior → Él gana 100 créditos, tú ganas 500
3. Los créditos se acreditan automáticamente

---

## Cambios Técnicos

### Frontend (`dashboard/referral/page.tsx`)

1. Añadir `referredRewardCredits` desde el API (para mostrar 100 créditos)
2. Rediseñar hero card con código prominente
3. Crear dos columnas de beneficios (referidor vs referido)
4. Mejorar la sección "claim" con marketing copy
5. Actualizar "cómo funciona" para incluir ambos lados

### API (`/api/brands/me/referral`)

Devolver también:
```ts
{
  referralCode: string;
  rewardCredits: number;        // 500 para referidor
  referredRewardCredits: number; // 100 para referido  
  referralCount: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  hasReferredCode: boolean;     // si el usuario actual tiene código aplicado
  referredCodeStatus: 'pending' | 'converted'; // estado del código aplicado
  recentReferrals: [...]
}
```

---

## Estados del UI

### Usuario SIN código de referido aplicado
- Ve la sección "¿Te invitaron?" con input activo
- Badge: "Ingresa tu código"

### Usuario CON código aplicado (pendiente)
- Badge: "Código aplicado"
- Mensaje: "Activa tu plan Basic o Pro para desbloquear tus 100 créditos"
- Sin input

### Usuario CON código ya convertido
- Badge: "100 créditos desbloqueados"
- Mensaje: "Ya tienes tus 100 créditos en tu cuenta"

---

## Anti-Patrones Evitados

- ❌ No gradients en texto
- ❌ No border-left stripes (AI slop)
- ❌ No cards anidados
- ❌ No center everything
- ❌ No monetización de colores (cyan/purple neon)
- ✅ Uso de +Jakarta Sans + DM Sans (fonts del proyecto)
- ✅ Espaciado de 4pt scale
- ✅ Contraste de tipografía 1.25 ratio mínimo