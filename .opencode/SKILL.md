---
name: lookitry-claude-ecosystem
description: Master index of the Lookitry AI agent skills and bundles ecosystem
---

# Lookitry — Sistema de Agentes y Skills

## Estructura

```
.opencode/                         # Directorio principal (OpenCode estándar)
├── skills/                        # Skills disponibles
│   ├── brainstorming/
│   ├── ui-ux-pro-max/
│   ├── seo-audit/
│   ├── subagent-driven-development/
│   ├── test-driven-development/
│   ├── verification-before-completion/
│   ├── excalidraw-diagram/
│   ├── sequential-thinking/
│   ├── token-efficiency/
│   ├── code-reviewer/
│   ├── frontend-design/
│   ├── web-design-guidelines/
│   ├── mcp-builder/
│   ├── find-skills/
│   ├── claude-code-expert/
│   ├── using-git-worktrees/
│   ├── playwright/
│   ├── notebooklm/
│   └── skill-creator/
├── agents/                        # Agentes especializados
│   ├── sammy.md                  # Orquestador
│   ├── webwizard.md              # Frontend + UX
│   ├── devguardian.md            # Calidad + Seguridad
│   ├── dataalchemist.md          # DB + IA + n8n
│   ├── growthpilot.md            # CRM + Marketing
│   ├── architectai.md            # Infra + DevOps
│   └── docs-writter.md           # Documentación
├── WORKFLOW.md                   # Guía de workflows
├── SKILL.md                      # Este archivo
└── opencode.json                # Configuración OpenCode
```

## Skills Disponibles

Todos los skills están en `.opencode/skills/`:

| Skill | Descripción | Uso |
|-------|-------------|-----|
| `@brainstorming` | Lluvia de ideas estructurada | Antes de implementar |
| `@ui-ux-pro-max` | UI/UX avanzado con datos | Diseño de interfaces |
| `@seo-audit` | Auditoría SEO completa | Optimización web |
| `@subagent-driven-development` | Desarrollo con subagentes | Tareas complejas |
| `@test-driven-development` | Testing proactivo | Calidad de código |
| `@verification-before-completion` | Verificación pre-entrega | Antes de finalizar |
| `@excalidraw-diagram` | Diagramas visuales | Documentación |
| `@sequential-thinking` | Razonamiento sistemático | Problemas complejos |
| `@token-efficiency` | Optimización de contexto | Conversaciones largas |
| `@code-reviewer` | Code review automático | Quality assurance |
| `@frontend-design` | Diseño frontend Lookitry | UI/UX web |
| `@web-design-guidelines` | Guidelines de diseño | Estándares web |
| `@mcp-builder` | Construir MCP servers | Extensiones |
| `@find-skills` | Buscar skills disponibles | Descubrimiento |
| `@claude-code-expert` | Expertos en Claude Code | Referencia |
| `@using-git-worktrees` | Git worktrees | Flujos git |
| `@playwright` | End-to-end testing y browser automation | Testing UI |
| `@notebooklm` | Query NotebookLM para respuestas source-grounded | Research asistitido |
| `@skill-creator` | Crear y mejorar skills | Desarrollo de skills |

## Agentes Especializados

| Agente | Archivo | Responsabilidad |
|--------|---------|----------------|
| `@Sammy` | `.opencode/agents/sammy.md` | Orquestador (Telegram) |
| `@WebWizard` | `.opencode/agents/webwizard.md` | Frontend + UX |
| `@DevGuardian` | `.opencode/agents/devguardian.md` | Calidad + Seguridad |
| `@DataAlchemist` | `.opencode/agents/dataalchemist.md` | DB + IA + n8n |
| `@GrowthPilot` | `.opencode/agents/growthpilot.md` | CRM + Marketing |
| `@ArchitectAI` | `.opencode/agents/architectai.md` | Infra + DevOps |
| `@DocsWriter` | `.opencode/agents/docs-writter.md` | Documentación |

## Ver También

- [WORKFLOW.md](WORKFLOW.md) — Guía de invocación y flujos
- [AGENTS.md](../AGENTS.md) — Reglas generales de agentes