# MISSION_CONTROL_SPEC.md — OBSOLETO

> **ESTADO:** ⚠️ ELIMINADO DEL CÓDIGO
> **Última actualización real:** Abril 2026
> **Este archivo es histórico y NO refleja el estado actual**

---

## Nota de Obsolescencia (22 Abril 2026)

El sistema Mission Control descrito en este documento **fue eliminado del código** en el commit `7ee0317`. Los siguientes archivos ya no existen:

```
frontend/src/app/mission-control/agents/page.tsx       — ELIMINADO
frontend/src/app/api/agents/status/route.ts            — ELIMINADO
frontend/src/components/admin/agents/                   — ELIMINADO (8 archivos)
```

### Razones de la eliminación:
- El sistema de tracking de agentes nunca se conectó a datos reales
- Operaba con MOCK_AGENTS como fallback permanente
- La complejidad del dashboard no justificaba el mantenimiento
- El equipo usa Telegram + Agentes direct asincrónicamente

---

## Resumen del Sistema Eliminado

El Mission Control iba a ser un dashboard cyberpunk/sci-fi con:
- 10 Agent Cards en grid 5x2
- Try-On Queue panel
- Business KPIs (MRR, ARR, Trial→Paid)
- Security Dashboard (Cipher)
- Trading Panel (Leo)
- Autolookitry [BETA] kanban

### Componentes eliminados:
| Categoría | Componentes |
|-----------|-------------|
| **Atoms** | StatusDot, Badge, StatCard, MonoNumber, LiveClock, etc. |
| **Molecules** | AgentCard, QueueBar, WebhookFeed, AlertItem, ServiceTile |
| **Organisms** | MCHeader, MCSidebar, AgentsGrid, TryOnQueue, BusinessKPIs |

---

## Alternativa Actual

El monitoreo del proyecto se hace a través de:
1. **Sammantha (Telegram)** — Orquestación y coordinación
2. **CHANGELOG.md** — Registro de cambios
3. **Supabase** — Métricas de negocio reales
4. **n8n** — Estado de workflows y jobs

---

## Archivos Relacionados (también eliminados o archivados)

- `frontend/src/app/mission-control/` — Ruta completa eliminada
- `frontend/src/lib/mission-control/` — Tipos, constants eliminados
- `frontend/src/hooks/useMissionControl.ts` — Hook eliminado

---

*Este archivo se mantiene por razones históricas y de auditoría.*
*Para información actual del proyecto, ver: AGENTS.md, REGLAS_IMPORTANTES.md, CHANGELOG.md*