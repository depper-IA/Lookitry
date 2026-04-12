# 📬 Shared Inbox — Lookitry Coordination

Este folder es el punto de coordinación central entre Sammy, Rebecca, y Leo.

## Cómo funciona

1. **Cuando necesites algo** de otro agente, crea un archivo aquí
2. **El receptor revisa** este folder periódicamente
3. **完成标记** — Cuando termines, marca como done o elimina

## Formato de mensajes

```
DE: [rebecca|leo|sammy]
PARA: [rebecca|leo|sammy]
TIPO: [task|question|update|approval]
URGENTE: [true|false]
---
TÍTULO: [breve descripción]
CONTENIDO: [detalle completo]
---
RECIBIDO: YYYY-MM-DD HH:MM
STATUS: [pending|in-progress|done|blocked]
```

## Archivos activos

(No hay mensajes pendientes por ahora)

## Referencias

- **Sammy** (orchestrator): `/home/travis/Lookitry/Lookitry/sammy/`
- **Rebecca** (embajadora): `/home/travis/.openclaw/workspaces/rebecca/`
- **Leo** (colaborador): `/home/travis/.openclaw/workspaces/leo/`
