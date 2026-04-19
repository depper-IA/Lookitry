# Lookitry — Agentes y Skills Workflow

Sistema unificado de agentes y skills para mantener el código limpio y actualizado.

---

## Indice de Skills Disponibles

| Skill | Descripcion | Cuando Usar |
|-------|-------------|-------------|
| `@brainstorming` | Planificación estructurada antes de codear | Siempre antes de implementar |
| `@verification-before-completion` | Verificación con evidencia fresca | Antes de claim completion |
| `@subagent-driven-development` | Ejecución multi-agente con revisión de spec + calidad | Planes de implementación |
| `@test-driven-development` | Workflow TDD red-green-refactor | Features con tests |
| `@playwright` | End-to-end testing y browser automation | Testing UI |
| `@git-workflows` | Worktrees y branches | Gestión de git |
| `@excalidraw-diagram` | Diagramas de arquitectura | Visualización de sistemas |
| `@security-auditor` | Auditoría de seguridad completa | Tasks de seguridad |
| `@supabase-postgres-best-practices` | Postgres/Supabase optimization | Queries y schema |

---

## Indice de Bundles (Agentes Compuestos)

| Bundle | Proposito | Skills que Agrupa |
|--------|-----------|-------------------|
| `@essentials` | **Default** — desarrollo general | brainstorming + verification + subagent + TDD + git |
| `@web-wizard` | Frontend y UI | brainstorming + excalidraw + verification |
| `@security-engineer` | Seguridad | security-auditor + verification + subagent |

---

## Flujo de Trabajo Recomendado

### Flujo Simple (1 task)

```
@brainstorming
    ↓
Explorar diseño y obtener aprobación
    ↓
Codear
    ↓
@verification-before-completion
    ↓
Listo
```

### Flujo Multi-Task (plan de implementación)

```
@brainstorming
    ↓
Crear plan de implementación
    ↓
@subagent-driven-development
    ↓
Para cada task:
  ├── Implementer ejecuta
  ├── Spec compliance review
  ├── Code quality review
  └── Loop si hay issues
    ↓
@verification-before-completion
    ↓
@security-auditor (si es sensible)
    ↓
@create-pr / Crear PR
```

---

## Invocación de Skills

### En Claude Code / OpenCode

```
@brainstorming
@verification-before-completion
@subagent-driven-development
@excalidraw-diagram
```

### En Antigravity / Otros

Los skills están en `.opencode/skills/` (estándar OpenCode).

---

## Verificación Obligatoria

Antes de claim **cualquier** completion:

| Claim | Requiere | Insuficiente |
|-------|----------|-------------|
| Tests pass | `npm run test` — 0 failures | Tests previos |
| Linter clean | `npm run lint` — 0 errors | Pasó antes |
| Build succeeds | `npm run build` — exit 0 | Linter pasa |
| Bug fixed | Test del síntoma original pasa | Código cambió |
| PR ready | Build + tests passing | "Se ve bien" |

**Iron Law:** Sin evidencia fresca, no hay claims de success.

---

## Red Flags (STOP)

- "Debería funcionar ahora"
- "Me confianza"
- "Es solo esta vez"
- "El linter pasó"
- "El agente dijo success"
- "Estoy cansado"

---

## Bundles — Detalle

### @essentials (Default)

Uso: **cualquier tarea de desarrollo**

```bash
# Invocar essentials bundle
@essentials
```

Skills: brainstorming, verification-before-completion, subagent-driven-development, test-driven-development, git-workflows, excalidraw-diagram

### @web-wizard

Uso: **UI, componentes, frontend**

```bash
@web-wizard
```

Skills: brainstorming, verification-before-completion, excalidraw-diagram

### @security-engineer

Uso: **auth, payments, datos sensibles**

```bash
@security-engineer
```

Skills: security-auditor, verification-before-completion, subagent-driven-development

---

## Reglas del Proyecto (recordatorio)

- **Backend** usa `supabaseAdmin` — bypass RLS
- **Frontend** usa `supabase` anon — RLS bloquea todo
- **Auth:** JWT en cookies HTTP-only (no Supabase Auth)
- **IA:** n8n + OpenRouter via webhooks
- **Storage:** MinIO (S3-compatible)
- **n8n:** Solo workflows con etiqueta `SaaS`
- **NO commit/push/deploy** sin autorización del usuario
- **Documentar** en CHANGELOG_GEMINI.md después de cada cambio

---

## Seguridad y Verificación

Antes de cualquier PR o merge:

- [ ] `npm run lint` pasa en frontend y backend
- [ ] `npm run build` pasa en frontend
- [ ] `npm run test` pasa en backend (si aplica)
- [ ] No hardcoded secrets o API keys
- [ ] RLS policies verificadas
- [ ] CHANGELOG_GEMINI.md actualizado
- [ ] Docs actualizadas si corresponde