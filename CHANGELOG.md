# Changelog - Lookitry (AI Assisted)

## [2026-04-06] - Fix errores build y completado pendientes admin

### Fix errores de build

- **`admin/security/page.tsx`**: Eliminado import duplicado de `motion` (framer-motion)
- **`admin/dashboard/page.tsx`**: Reemplazado componente `BrutalBadge` inexistente por badge inline con estilos inline (colores según plan: PRO=violeta, TRIAL=índigo, BASIC=verde)
- **`admin/funnel/page.tsx`**: Corregido tipo `boolean | 0 | undefined` en `hasStalledTrials` usando `Boolean()` cast

### Completado pendientes auditoría admin dashboard

- **Funnel clickeable**: Cada etapa ahora navega a la página filtrada correspondiente (Trial → brands?plan=TRIAL, Pro → brands?plan=PRO, Riesgo → /admin/risk)
- **Playbooks embebidos**: Nuevo componente `EmbeddedPlaybook` integrado en:
  - `/admin/risk` → playbook churn-prevention (cuando high_risk > 0)
  - `/admin/payments` → playbook payment-failed (cuando hay pagos fallidos)
  - `/admin/funnel` → playbook trial-stalled (cuando conversión Trial <50%)
  - `/admin/ia-costs` → playbook ia-costs-spike (cuando balance bajo)

### Archivos modificados

- `frontend/src/app/admin/security/page.tsx`
- `frontend/src/app/admin/dashboard/page.tsx`
- `frontend/src/app/admin/funnel/page.tsx`
- `frontend/src/components/admin/EmbeddedPlaybook.tsx` (nuevo)
- `frontend/src/app/admin/risk/page.tsx`
- `frontend/src/app/admin/payments/page.tsx`
- `frontend/src/app/admin/ia-costs/page.tsx`

---

## [2026-04-06] - Visión con OpenRouter para análisis de imágenes

### Nueva funcionalidad

- Sammy ahora puede ver y analizar imágenes usando OpenRouter Vision
- Modelo: `google/gemini-2.5-flash-image-preview` (costo mínimo ~$0.00000013/1K tokens)
- Flujo: imagen → Gemini Vision (análisis) → OpenCode (corrección)
- Prompt especializado en debugging para análisis de código/errores
- Archivos: `sammy/src/audio/groq.ts` (nueva función `analyzeImageWithOpenRouter`), `sammy/src/index.ts`

---

## [2026-04-06] - Fix soporte imágenes en Sammy

### Bug fix

- TypeScript error `file_mime_type` no existía en tipo `Audio`
- Solucionado con type assertion `(ctx.message.audio as any).file_mime_type`
- Build ahora compila correctamente

---

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
