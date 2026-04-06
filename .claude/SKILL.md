---
name: lookitry-claude-ecosystem
description: Master index of the Lookitry AI agent skills and bundles ecosystem
---

# Lookitry — Sistema de Agentes y Skills

## Estructura

```
.claude/                          # Centro unificado
├── agents/                       # Bundles (agentes compuestos)
│   ├── web-wizard.md             # Frontend bundle
│   ├── security-engineer.md      # Security bundle
│   └── essentials.md             # Default bundle
├── skills/                       # Skills (directorio unificado)
├── WORKFLOW.md                   # Guía de workflows
├── bundles.md                    # Documentación de bundles
└── SKILL.md                      # Este archivo
```

## Skills Disponibles

| Skill | Ubicación | Fuente |
|-------|-----------|--------|
| `@brainstorming` | `.agents/skills/brainstorming/` | obra/superpowers |
| `@verification-before-completion` | `.agents/skills/verification-before-completion/` | obra/superpowers |
| `@subagent-driven-development` | `.agents/skills/subagent-driven-development/` | obra/superpowers |
| `@test-driven-development` | `.agents/skills/test-driven-development/` | obra/superpowers |
| `@git-workflows` | `.agents/skills/git-workflows/` | obra/superpowers |
| `@excalidraw-diagram` | `.agents/skills/excalidraw-diagram/` | coleam00 |
| `@security-auditor` | `.opencode/agents/security-auditor.md` | claude-code-templates |
| `@supabase-postgres-best-practices` | `.agents/skills/supabase-postgres-best-practices/` | Supabase |

## Agentes Especializados (OpenCode)

| Agente | Archivo | Responsabilidad |
|--------|---------|----------------|
| `@Sammy` | `.opencode/agents/sammy.md` | Orquestador (Telegram) |
| `@WebWizard` | `.opencode/agents/webwizard.md` | Frontend + UX |
| `@DevGuardian` | `.opencode/agents/devguardian.md` | Calidad + Seguridad |
| `@DataAlchemist` | `.opencode/agents/dataalchemist.md` | DB + IA + n8n |
| `@GrowthPilot` | `.opencode/agents/growthpilot.md` | CRM + Marketing |
| `@ArchitectAI` | `.opencode/agents/architectai.md` | Infra + DevOps |

## Bundles Disponibles

| Bundle | Propsito | Archivo |
|--------|---------|---------|
| `@essentials` | Default — cualquier desarrollo | `.claude/agents/essentials.md` |
| `@web-wizard` | Frontend y UI | `.claude/agents/web-wizard.md` |
| `@security-engineer` | Seguridad | `.claude/agents/security-engineer.md` |

## Ver Tambien

- [WORKFLOW.md](.claude/WORKFLOW.md) — Guía de invocación y flujos
- [bundles.md](.claude/bundles.md) — Detalle de bundles
- [AGENTS.md](../AGENTS.md) — Reglas generales de agentes