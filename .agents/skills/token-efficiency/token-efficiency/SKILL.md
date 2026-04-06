---
name: lookitry-token-efficiency
description: Optional compressed communication protocol. Load when user requests brevity or context is >75% full. Does NOT modify other skills.
---

# Token Efficiency (Optional)

**NO impacta otros skills — solo cargar si se pide explícitamente.**

## Símbolos Esenciales

| Símbolo | Significado |
|---------|-------------|
| `→` | leads to / implica |
| `»` | sequence / entonces |
| `✅` | complete / pass |
| `❌` | failed / error |
| `⚠️` | warning |
| `🔄` | in progress |
| `⏳` | pending |

## Dominios (Lookitry)

| Símbolo | Dominio |
|---------|---------|
| `⚡` | performance |
| `🔍` | analysis |
| `🛡` | security |
| `🏗` | architecture |
| `🎨` | UI/UX |
| `📊` | data/DB |
| `🔗` | integration |
| `🚀` | deploy |

## Abreviaturas

`cfg, deps, val, perf, sec, err, api, wh, fe, be, ag, tsk, ctx`

## Formato Comprimido

```
auth.js:45 → 🛡 sec risk in user val()
build ✅ » test 🔄 » deploy ⏳
✅ tsk:widget | 🎨 fe | 2h
```

## Cuándo Activar

- Usuario pide "brevity" o "short"
- Contexto >75% lleno
- Logs extensos
- Reports de agentes

## Ejemplo

**Standard:**
> "El webhook de pagos Wompi está fallando. Error en validación HMAC."

**Compressed:**
```
wh/wompi → ❌ HMAC val fail
```