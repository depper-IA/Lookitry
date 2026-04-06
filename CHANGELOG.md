# Changelog - Lookitry (AI Assisted)

## [2026-04-06] - Streaming en Sammy

### Sammy streaming de respuestas

- Sammy ahora muestra progreso en tiempo real via Telegram
- Mensaje inicial "⏳ Procesando..." que se actualiza con cada parte
- Muestra: iteración, herramientas usadas, respuesta parcial
- Archivos modificados: `sammy/src/index.ts`, `sammy/src/opencode/client.ts`
- README.md actualizado con documentación de streaming

---

## [2026-04-06] - Sistema de Agentes Integración Completa

### Agentes actualizados con MCPs, modelos y optimización de tokens

| Agente | MCPs | Modelo Principal | Fallback | Subagentes |
|--------|------|-------------------|----------|------------|
| Sammy | memory | MiniMax | DeepSeek Coder | GROQ |
| WebWizard | supabase, n8n | MiniMax | DeepSeek Coder | GROQ |
| DevGuardian | supabase, context7 | MiniMax | DeepSeek Coder | GROQ |
| DataAlchemist | supabase, n8n, context7 | MiniMax | DeepSeek Coder | GROQ |
| GrowthPilot | supabase, hostinger-mcp | MiniMax | DeepSeek Coder | GROQ |
| ArchitectAI | hostinger-mcp, supabase | MiniMax | DeepSeek Coder | GROQ |

### Modelos gratuitos utilizados

- **MiniMax** (principal): `minimax-coding-plan/MiniMax-M2.7`
- **DeepSeek Coder** (fallback): `deepseek/deepseek-coder-33b-instruct`
- **GROQ** (subagentes): `groq/llama-3.3-70b-instruct`

### Archivos modificados

- `AGENTS.md` — Tabla de agentes + protocolo comunicación + modelos
- `REGLAS_IMPORTANTES.md` — Sección 10: Sistema de Agentes IA
- `.claude/SKILL.md` — Índice de agentes especializados
- `.opencode/agents/*.md` — Todos los agentes actualizados

### Limpieza realizada

- Eliminada carpeta `para agentes/` (migrado a .opencode/agents/)
- Eliminado `creador_agentes.md`
- Archivado CHANGELOG.md → `CHANGELOG_ARCHIVE_2026_Q1.md`
- Creado nuevo CHANGELOG.md limpio

---
