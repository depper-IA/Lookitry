---
name: context-optimizer
description: Resume contexto de conversación, elimina mensajes antiguos y previene overflow de contexto. Activa manualmente o cuando el contexto está >75% lleno.
---

# Context Optimizer — OpenCode

Optimiza el contexto de la conversación para prevenir overflow de tokens y mantener respuestas rápidas.

## Cuándo Activar

| Gatillante | Acción |
|-----------|--------|
| Contexto >75% lleno | Resumir y limpiar automáticamente |
| Usuario dice "optimiza contexto" | Resumir inmediatamente |
| Sesión >30 minutos | Guardar resumen a memoria |
| Antes de tarea compleja | Consolidar contexto |

## Proceso de Optimización

### 1. Identificar Información Activa

Extrae del contexto actual:
- **Tareas en progreso** — qué se está haciendo ahora
- **Decisiones recientes** —choicesmade
- **Archivos abiertos** — files in play
- **Errores pendientes** — unresolved errors
- **Próximos pasos** — next steps

### 2. Generar Summary

Guardar en `memory/context-summary-YYYY-MM-DD.md`:

```markdown
# Context Summary — 2026-04-06

## Proyecto: Lookitry
## Sesión: Morning session

### Estado Actual
- Implementando FASE 3: Cola Redis para generaciones
- Backend deployeado y corriendo
- Worker pendiente de activar

### Decisiones Tomadas
- Usar Redis para slots de concurrency
- Cola persistente para jobs de n8n
- Rate limiting por plan (BASIC=2, PRO=5, ENTERPRISE=20)

### Archivos en Juego
- `backend/src/services/generation-queue.service.ts`
- `backend/src/services/generation-concurrency.service.ts`
- `backend/src/controllers/pruebalo.controller.ts`

### Pendientes
- Activar queue-worker en VPS
- Documentar nuevas reglas en REGLAS_IMPORTANTES.md

### Facts Persistentes (para MEMORY.md)
- VPS: 31.220.18.39, 8GB RAM
- Redis corriendo en root-redis-1
- FASE 1-3 implementadas: RAM limits + concurrency + queue
```

### 3. Consolidar Facts Importantes

Agregar a `memory/MEMORY.md`:

```markdown
## Lookitry — Facts Importantes

### Infraestructura
- VPS: 31.220.18.39, 8GB RAM KVM
- Contenedores: lookitry-frontend, lookitry-backend, root-n8n-1, root-redis-1, minio

### Features Implementadas (2026-04-06)
- FASE 1: Límites RAM Docker + NODE_OPTIONS
- FASE 2: Rate limiting concurrency por plan (Redis)
- FASE 3: Cola persistente + queue-worker para n8n
```

### 4. Registrar en History

Agregar a `memory/context-history.json`:

```json
{
  "date": "2026-04-06T10:30:00Z",
  "action": "context_optimized",
  "tokens_saved": "~15K",
  "summary_file": "memory/context-summary-2026-04-06.md"
}
```

## Comandos

| Comando | Función |
|---------|---------|
| `optimiza contexto` | Resumir inmediatamente |
| `guarda sesión` | Guardar summary + facts |
| `resume contexto` | Leer último summary y restaurar |
| ` limpia contexto` | Eliminar mensajes redundantes |

## Límites

| Límite | Valor |
|--------|-------|
| Contexto máximo antes de optimizar | 75% |
| Historial a mantener | Últimas 10 sesiones |
| Facts en MEMORY.md | Top 50 más relevantes |
| Summary files a retener | 30 días |

## Integración con Agentes

Cuando optimizes contexto, incluye:

1. **Brand actual** si hay uno en juego
2. **Plan de trabajo** definido por el usuario
3. **Estado de deploy** si se han hecho cambios
4. **Pendientes técnicos** — deudas o follow-ups

## Ejemplo de Uso

**Entrada (contexto bloated):**
```
 Usuario: implementa auth JWT
 Asistente: [implementa auth JWT]
 Usuario: ahora añade refresh tokens
 [20 mensajes después]
 Usuario: optimiza contexto
```

**Salida (summary generado):**
```
✅ Contexto optimizado — Tokens: 24K → 9K

Resumen guardado:
- memory/context-summary-2026-04-06.md
- memory/MEMORY.md actualizado
- context-history.json actualizado
```

---

## Notas de Implementación

- Usar `memory_search_nodes` para verificar facts existentes antes de agregar
- Los summaries son para Auditor/Sammy — no para el usuario final
- Mantener siempre: brandSlug actual, plan, ambiente (prod/dev), urgencia de tareas
