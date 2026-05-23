# AGENTS_CONFIG_MASTER.md — Configuración de Agentes

**Última actualización**: 2026-04-22
**Versión**: 3.0
**Estado**: ✅ ACTUAL

---

## RESUMEN DE CAMBIOS v3.0

### Sistema Mission Control ELIMINADO

- El dashboard Mission Control fue removido del código (commit `7ee0317`)
- Los siguientes archivos fueron eliminados:
  - `frontend/src/app/mission-control/agents/page.tsx`
  - `frontend/src/app/api/agents/status/route.ts`
  - `frontend/src/components/admin/agents/` (8 componentes)

### Modelo Default: MiniMax-M2.7

- **Mantenido**: Todos los agentes usan `minimax/MiniMax-M2.7`
- Groq disponible solo como `small_model` fallback de emergencia (no para uso regular)
- DeepSeek removido de todos los systemPromptOverride

---

## EQUIPO COMPLETO DE AGENTES

| Nombre | Workspace | Rol | Modelo Default |
|--------|-----------|-----|----------------|
| **Sammantha** | sammy | Orquestadora Maestra | MiniMax-M2.7 |
| **Pixel** | webwizard | Frontend Magician | MiniMax-M2.7 |
| **Kira** | devguardian | Guardiana de Calidad | MiniMax-M2.7 |
| **Nadia** | dataalchemist | Alquimista de Datos | MiniMax-M2.7 |
| **Marlo** | growthpilot | Piloto de Crecimiento | MiniMax-M2.7 |
| **Zephyr** | architectai | Arquitecto de Infra | MiniMax-M2.7 |
| **Lina** | docs-writter | Documentadora | MiniMax-M2.7 |
| **Cipher** | security-auditor | Hacker Ético | MiniMax-M2.7 |

---

## DELEGACIÓN DE TAREAS

### Tabla de Delegación por Problema

| Problema Descrito | Tipo | Agente Encargado |
|-------------------|------|------------------|
| "El checkout falla en mobile" | Frontend/UI/Responsive | Pixel |
| "El widget de try-on no carga" | Frontend/Componente | Pixel |
| "Hay errores en el build" | Frontend/Debug | Pixel |
| "Los webhooks de Wompi no funcionan" | Pagos/Backend | Kira |
| "El login está fallando" | Auth/Seguridad | Kira |
| "Hay errores de TypeScript" | Code Review | Kira |
| "Las búsquedas están lentas" | DB/Queries | Nadia |
| "El RAG no responde bien" | IA/Embeddings | Nadia |
| "El workflow de n8n está caído" | Automatización/n8n | Nadia |
| "Quiero un reporte de leads" | Marketing/CRM | Marlo |
| "La campaña de email no envía" | Email/Marketing | Marlo |
| "El servidor está caído" | Infraestructura/VPS | Zephyr |
| "Necesito hacer deploy" | DevOps/Deploy | Zephyr |
| "Docker no arranca" | Docker/Infra | Zephyr |
| "El CHANGELOG está desactualizado" | Documentación | Lina |
| "Necesito documentar X" | Documentación | Lina |

### Regla de Oro — Sammantha NUNCA hace trabajo de otro agente

```
❌ SAMMANTHA: "Voy a revisar el código del frontend..."
✅ SAMMANTHA: "Spawneo a Pixel para que revise el frontend"
```

---

## PERSONAS REALES (No Agentes)

| Nombre | Rol | ID Telegram |
|--------|-----|------------|
| **Sam Wilkie** | Founder / Owner | 1049458877 |
| **Melissa Urbano** | Junior Front-End Developer | 942528796 |

**Nota**: Melissa es COLABORADORA de Pixel, NO subordinada a agentes. Trabaja JUNTO CON Pixel en frontend.

---

## ESTADO DE CONFIGURACIÓN DE AGENTES

### Agentes Completamente Configurados (8/8)

| Agente | Status | Archivos |
|--------|--------|----------|
| **Sammantha** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Pixel** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Kira** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Nadia** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Marlo** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Lina** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Cipher** | ✅ Completo | AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md |
| **Zephyr** | ⚠️ Parcial | Agentes/architectai.md (1 archivo) |

### Agentes Pendientes de Documentación Completa

| Agente | Status | Archivos Existentes |
|--------|--------|---------------------|
| **Zephyr** | ⚠️ Parcial | Agentes/architectai.md (1 archivo) |

---

## NOTAS IMPORTANTES

### Mission Control (ELIMINADO)
- El sistema Mission Control fue eliminado del código
- Ya no existe `/mission-control/agents` ni componentes asociados
- El monitoreo se hace vía Sammantha (Telegram) + CHANGELOG.md

---

## REGISTRO DE CAMBIOS

| Fecha | Cambio | Descripción |
|-------|--------|-------------|
| 2026-04-22 | v3.0 | Eliminación de Mission Control; actualización de estado de agentes |
| 2026-04-14 | v2.0 | Modelo unificado MiniMax-M2.7; 8 agentes completamente configurados |

---

_Last updated: 2026-04-22 12:00 UTC-5_