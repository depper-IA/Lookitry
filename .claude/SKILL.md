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
├── skills/                       # Skills (legacy - migrando a .agents/skills/)
├── WORKFLOW.md                   # Guía de workflows
├── bundles.md                    # Documentación de bundles
└── SKILL.md                      # Este archivo
```

## Skills Disponibles

**Ubicación estándar:** `.agents/skills/` (universal para todos los agentes)

| Skill | Ubicación | Fuente | Estado |
|-------|-----------|--------|--------|
| `@token-efficiency` | `.agents/skills/token-efficiency/` | Lookitry (opcional) | ✅ |
| `@sequential-thinking` | `.agents/skills/sequential-thinking/` | MCP Server | ✅ |
| `@brainstorming` | `.agents/skills/brainstorming/` | obra/superpowers | ✅ |
| `@verification-before-completion` | `.agents/skills/verification-before-completion/` | obra/superpowers | ✅ |
| `@subagent-driven-development` | `.agents/skills/subagent-driven-development/` | obra/superpowers | ✅ |
| `@test-driven-development` | `.agents/skills/test-driven-development/` | obra/superpowers | ✅ |
| `@using-git-worktrees` | `.agents/skills/using-git-worktrees/` | obra/superpowers | ✅ |
| `@excalidraw-diagram` | `.agents/skills/excalidraw-diagram/` | coleam00 | ✅ |
| `@find-skills` | `.agents/skills/find-skills/` | vercel-labs | ✅ |
| `@frontend-design` | `.agents/skills/frontend-design/` | anthropics | ✅ |
| `@web-design-guidelines` | `.agents/skills/web-design-guidelines/` | vercel-labs | ✅ |
| `@ui-ux-pro-max` | `.agents/skills/ui-ux-pro-max/` | nextlevelbuilder | ⚠️ High Risk |
| `@security-auditor` | `.opencode/agents/security-auditor.md` | claude-code-templates | ✅ |
| `@playwright` | npm package (global) | microsoft | ✅ |
| `@seo-audit` | `.agents/skills/seo-audit/` | coreyhaines31 | ✅ |
| `@mcp-builder` | `.agents/skills/mcp-builder/` | anthropics | ✅ |
| `@code-reviewer` | `.agents/skills/code-reviewer/` | claude-code-templates | ✅ |
| `@claude-code-expert` | `.agents/skills/claude-code-expert/` | sickn33/antigravity-awesome-skills | ⚠️ High Risk |
| `@context-optimizer` | `skills/context-optimizer/` | Adaptado (LobeHub) | ✅ |
| `@design-engineering` | `skills/design-engineering/` | Adaptado (emil-design-eng) | ✅ |

**No disponibles (repo inaccesible):**
| Skill | Fuente | Estado |
|-------|--------|--------|
| `@supabase-postgres-best-practices` | Supabase | ⚠️ Repo no accesible |

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
