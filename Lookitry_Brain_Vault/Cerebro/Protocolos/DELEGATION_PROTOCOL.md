---
title: "Protocolo de Delegación de Agentes"
description: "Reglas para delegar tareas correctamente a cada agente especializado"
lastUpdated: "2026-04-19 11:54 GMT-5"
---

# 📋 Protocolo de Delegación de Agentes — Lookitry

## Regla de Oro

**SAMMANTHA NUNCA hace trabajo de otro agente. Siempre delega.**

```
❌ SAMMANTHA: "Voy a revisar el código del frontend..."
✅ SAMMANTHA: "Spawneo a Pixel para que revise el frontend"
```

---

## Tabla de Delegación por Especialidad

| Tarea | Agente Encargado | Ejemplo de Prompt |
|-------|------------------|------------------|
| **UI / Frontend** | Pixel | "Revisa el componente de checkout" |
| **Code Review / Testing** | Kira | "Haz code review del servicio de pagos" |
| **DB / Queries / IA / n8n** | Nadia | "Optimiza la query de generations" |
| **Marketing / CRM / Leads** | Marlo | "Genera reporte de leads esta semana" |
| **Infra / VPS / Docker / Deploy** | Zephyr | "Verifica el estado del VPS" |
| **Documentación** | Lina | "Actualiza el CHANGELOG con los cambios" |
| **Seguridad / Pentesting** | Cipher | "Audita vulnerabilidades en auth" |
| **Pagos / Auth / Webhooks** | Kira | "Valida la firma del webhook de Wompi" |

---

## Flujo de Trabajo con Agentes

### Paso 1 — Recepción de Tarea
```
Sam → Sammantha: "Pixel, revisa el deploy de producción"
```

### Paso 2 — Identificar Agente Correcto
- Si Sam especifica agente → usar ese
- Si Sam no especifica → Sammantha elige según tabla de arriba

### Paso 3 — Spawn Agente
```javascript
Sammantha → sessions_spawn(
  agent: "[agente-especifico]",
  task: "[tarea-especifica]",
  runtime: "subagent"
)
```

### Paso 4 — Actualizar Dashboard
```
Sammantha → Actualiza AGENT_STATUS_DASHBOARD.md:
- Agente: 🔴 OCUPADO
- Tarea: [descripción]
- Inicio: [timestamp]
```

### Paso 5 — Agente Trabaja
El agente:
1. Lee su archivo de configuración (ej: webwizard.md)
2. Ejecuta la tarea
3. Reporta a Sammantha al terminar

### Paso 6 — Sammantha Notifica a Sam
```
Sammantha → "✅ Pixel terminó la revisión del deploy:
- Build OK
- Sin errores de TypeScript
- Deploy verificado en producción"
```

### Paso 7 — Actualizar Dashboard
```
- Agente: 🟡 DISPONIBLE
- Tarea: — (vacío)
```

---

## Protocolo de Comunicación

### Agente → Sammantha (siempre)
Al terminar una tarea, el agente reporta a Sammantha con:
- Status: ✅ completado / ❌ error
- Descripción breve del resultado
- Archivos modificados (si aplica)
- Tiempo total (si > 5 min)

### Sammantha → Sam (siempre)
Sammantha notifica a Sam con:
- Qué agente completó la tarea
- Resultado breve
- Link o archivo si relevante

### Sammantha supervisa
- Si un agente tarda > 15 min sin actualizar → Sammantha investiga
- Si un agente falla → Sammantha reporta error a Sam con posibles soluciones
- Si un agente no puede completar → Sammantha re-delega a otro agente

---

## Casos Especiales

### Tarea que requiere 2+ agentes
```
1. Sammantha delega al agente #1
2. #1 spawnea al agente #2 según necesite
3. #1 reporta a Sammantha cuando #2 termina
```

### Agente no disponible
Si un agente está 🔴 OCUPADO con otra tarea:
- Sammantha puede esperar o
- Sammantha pide a Sam que reprograme la tarea

### Error del agente
```
1. Agente reporta error a Sammantha
2. Sammantha evalúa:
   - ¿Se puede resolver fácilmente? → Sammantha lo resuelve
   - ¿Requiere intervención especializada? → Re-delega
3. Sammantha reporta a Sam
```

---

## Actualización del Dashboard

**OBLIGATORIO:** Después de cada spawn y después de cada completación, Sammantha debe actualizar `AGENT_STATUS_DASHBOARD.md`.

El dashboard es la **fuente única de verdad** del estado de los agentes.

---

## Reglas de No-Incumplimiento

❌ **NUNCA** Sammantha haciendo trabajo de Pixel/Kira/Nadia/etc.
❌ **NUNCA** Agents reportando directamente a Sam sin pasar por Sammantha
❌ **NUNCA** Agentes haciendo trabajo de otros agentes (sin autorización)

✅ Siempre delegar al agente correcto
✅ Siempre actualizar el dashboard
✅ Siempre reportar a través de Sammantha

---

_Last updated: 2026-04-19 11:54 GMT-5_
_Creado por: Sammantha_
