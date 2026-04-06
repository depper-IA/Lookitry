# Lookitry — Bundles

Agentes compuestos que agrupan múltiples skills para flujos de trabajo específicos.

---

## Qué son los Bundles?

Los bundles son **agentes pre-configurados** que combinan múltiples skills bajo un contexto unificado. En lugar de invocar skills individually, puedes invocar un bundle completo que tiene:
- Descripción clara del propósito
- Contexto del proyecto
- Workflows pre-configurados
- Verificación integrada

---

## @essentials — Default Development Bundle

**Para:** Cualquier tarea de desarrollo (default)

**Skills:**
- `@brainstorming` — planificación estructurada
- `@verification-before-completion` — evidencia antes de claims
- `@subagent-driven-development` — multi-agente con review
- `@test-driven-development` — TDD workflow
- `@git-workflows` — gestión de branches
- `@excalidraw-diagram` — diagramas de arquitectura

**Archivo:** `.claude/agents/essentials.md`

**Cuándo usar:**
- Nuevas features
- Bug fixes
- Refactoring
- Backend API development
- Database schema changes
- Cualquier tarea sin un bundle específico

---

## @web-wizard — Frontend Bundle

**Para:** UI, componentes, desarrollo frontend

**Skills:**
- `@brainstorming` — exploración de diseño
- `@verification-before-completion` — verificación obligatoria
- `@excalidraw-diagram` — diagramas de componentes/arquitectura

**Archivo:** `.claude/agents/web-wizard.md`

**Cuándo usar:**
- Nuevos componentes o páginas
- Features de UI
- Animaciones o interactividad
- Integraciones API desde frontend
- Visualización de arquitectura de componentes

**Focus areas:**
- Adherencia al design system (#FF5C3A, #0a0a0a, #141414)
- Accesibilidad (aria-labels, focusable elements)
- Performance (transforms, will-change)
- Responsive design
- TypeScript strict mode

---

## @security-engineer — Security Bundle

**Para:** Tasks de seguridad, auth, datos sensibles

**Skills:**
- `@security-auditor` — auditoría completa
- `@verification-before-completion` — evidencia antes de claims
- `@subagent-driven-development` — ejecución multi-task

**Archivo:** `.claude/agents/security-engineer.md`

**Cuándo usar:**
- Authentication o authorization
- Manejo de datos de usuario
- Payment information
- JWT, sessions, credentials
- Database access patterns
- Antes de deploy a producción

**Auditoría incluye:**
- SOC 2 Type II
- ISO 27001/27002
- HIPAA requirements
- PCI DSS standards
- GDPR compliance
- NIST frameworks
- CIS benchmarks

---

## Verificación de Bundles

### @essentials checklist

- [ ] @brainstorming completó (diseño aprobado)
- [ ] @verification-before-completion: tests passing
- [ ] @verification-before-completion: lint passing
- [ ] @verification-before-completion: build passing
- [ ] CHANGELOG_GEMINI.md actualizado
- [ ] PR creado con descripción clara

### @web-wizard checklist

- [ ] @brainstorming completó (diseño de UI aprobado)
- [ ] @verification-before-completion: frontend build passing
- [ ] @verification-before-completion: lint passing
- [ ] Accesibilidad verificada
- [ ] Design system adhered
- [ ] Screenshots o recordings si hay cambios visuales
- [ ] PR con component/files changed

### @security-engineer checklist

- [ ] @security-auditor: audit completado
- [ ] @verification-before-completion: no hardcoded secrets
- [ ] @verification-before-completion: RLS policies verified
- [ ] @verification-before-completion: input validation present
- [ ] Auth no tiene bypasses
- [ ] Error messages no exponen info sensible
- [ ] PR con security findings documentados

---

## Cómo Invocar los Bundles

### En CLI (Claude Code / OpenCode)

```
@essentials
@web-wizard
@security-engineer
```

### Como Agentes en Tasks

Puedes invocar estos bundles como agentes completos:

```
Task: Implementar login feature
Agent: essentials
```

---

## Crear Nuevos Bundles

Para crear un nuevo bundle:

1. Crear archivo en `.claude/agents/[nombre].md`
2. Incluir frontmatter con `description` y `mode: subagent`
3. Documentar skills que agrupa
4. Definir workflow específico
5. Agregar verificación checklist
6. Documentar en `bundles.md`

### Template

```markdown
---
description: [descripción del bundle]
mode: subagent
tools:
  write: true/false
  edit: true/false
  read: true
  grep: true
  glob: true
---

# [Nombre] Agent

[Descripción de propósito y expertise]

## Your Skill Stack

- **@skill-name** — [qué hace]

## When to Invoke

[cuándo usar este bundle]

## Workflow

[pasos específicos]

## Focus Areas

[áreas de enfoque]

## Verification Checklist

- [ ] ...
```