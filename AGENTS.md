# AGENTS.md — Lookitry

**Lee siempre primero:** `REGLAS_IMPORTANTES.md`, `TECH_STACK.md`, `PRD.md`, `DESIGN.md` y usa el agente `docs-writter.md` para documentar cualquier cambio importante que se realice y siempre mantener estos tres ultimos documentos siempre al dia.

---

## Sistema de Agentes y Skills

Ver `.claude/SKILL.md` para el índice completo del ecosistema de agentes y skills.

### Equipo de Agentes Lookitry

El equipo de agentes opera bajo el orchestration de **Sammy** (via Telegram/OpenCode). Cada agente especializado tiene responsabilidades definidas:

| Agente | Archivo | Responsabilidad | Modelo Principal | Fallback | Subagentes |
|--------|---------|-----------------|------------------|---------|------------|
| **Sammy** | `.opencode/agents/sammy.md` | Orquestador - recibe tareas y delega | MiniMax | DeepSeek Coder | GROQ |
| **WebWizard** | `.opencode/agents/webwizard.md` | Frontend + UX, widget, landing | MiniMax | DeepSeek Coder | GROQ |
| **DevGuardian** | `.opencode/agents/devguardian.md` | Calidad + Seguridad | MiniMax | DeepSeek Coder | GROQ |
| **DataAlchemist** | `.opencode/agents/dataalchemist.md` | DB + IA + n8n | MiniMax | DeepSeek Coder | GROQ |
| **GrowthPilot** | `.opencode/agents/growthpilot.md` | CRM + Marketing + Leads | MiniMax | DeepSeek Coder | GROQ |
| **ArchitectAI** | `.opencode/agents/architectai.md` | Infra + DevOps | MiniMax | DeepSeek Coder | GROQ |

**Modelos gratuitos:**
- `minimax-coding-plan/MiniMax-M2.7` — Principal
- `deepseek/deepseek-coder-33b-instruct` — Fallback (DeepSeek Coder)
- `groq/llama-3.3-70b-instruct` — Subagentes (tareas simples, rápido)

### Cómo Invocar Agentes

```
@Sammy [tarea] — Procesar tarea y delegar al agente correcto
@WebWizard [tarea] — Frontend directo
@DevGuardian [tarea] — Seguridad directo
@DataAlchemist [tarea] — Datos/IA directo
@GrowthPilot [tarea] — Marketing directo
@ArchitectAI [tarea] — Infraestructura directo
```

### Protocolo de Comunicación

Cuando un agente necesita que otro haga algo:

```
DELEGAR → [NombreAgente]
TAREA: descripción clara de lo que se necesita
CONTEXTO: datos relevantes (brandId, plan, ambiente, etc.)
URGENCIA: crítico | normal | mejora futura
DEPENDENCIA: si este agente debe esperar el resultado
```

### Bundles (Agentes Compuestos)

| Bundle | Propsito | Archivo |
|--------|---------|---------|
| `@essentials` | **Default** — cualquier desarrollo | `.claude/agents/essentials.md` |
| `@web-wizard` | Frontend y UI | `.claude/agents/web-wizard.md` |
| `@security-engineer` | Seguridad | `.claude/agents/security-engineer.md` |

### Skills Clave

| Skill | Cuando Usar |
|-------|-------------|
| `@brainstorming` | Siempre antes de implementar |
| `@verification-before-completion` | Antes de claim completion |
| `@security-auditor` | Tasks de seguridad/auth |

### Workflows

- **Simple:** `@brainstorming` → codear → `@verification-before-completion`
- **Multi-task:** `@brainstorming` → plan → `@subagent-driven-development`
- **Seguridad:** `@security-engineer` bundle o invocar `@security-auditor` directamente

### Documentación

- [`.claude/WORKFLOW.md`](.claude/WORKFLOW.md) — Guía de flujos y verificación
- [`.claude/bundles.md`](.claude/bundles.md) — Detalle de bundles

---

## Reglas de Git y Deploy

- **NO hacer commits, push ni deploy** sin autorización explícita del usuario
- **Deploy:** Usar `python scripts/_deploy_now.py` en el caso que Github Action no este disponible desde la carpeta `scripts/`
  - `--force`: rebuild aunque no haya cambios en origin/main
  - `--no-cache`: rebuild completo (~5min)
  - `--backend` / `--frontend`: deploy parcial
- **Deploy:** Usar el método más rápido/eficiente según el caso (`python scripts/_deploy_now.py` para VPS, GitHub Actions para CI)

---

## Documentación Obligatoria

- Tras cualquier cambio de código, documentar en `CHANGELOG.md` (fecha, descripción, archivos, motivo)
- Al iniciar tarea, leer `pendientes_por_hacer.md` si existe
- Si se deja deuda técnica, registrarla en `pendientes_por_hacer.md`
- Archivar CHANGELOG.md cuando supere 500 líneas o 30 días → `CHANGELOG_ARCHIVE_YYYY_MM.md`

---

## Comandos de Desarrollo

### Frontend (`frontend/`)
```bash
npm run dev      # desarrollo local (http://localhost:3000)
npm run build    # build de producción
npm run lint     # linting
npm run format   # formateo prettier
```

### Backend (`backend/`)
```bash
npm run dev              # hot-reload (http://localhost:3001)
npm run build            # compilación TypeScript
npm run lint             # linting
npm run test             # tests (Jest, --runInBand)
npm run test:smoke       # solo tests de smoke
```

---

## Arquitectura Clave

- **Backend usa `supabaseAdmin`** (service role key) — bypass completo de RLS
- **Frontend usa cliente `supabase` anon** — RLS bloquea TODO
- **Autenticación:** JWT propio en cookies HTTP-only, NO Supabase Auth
- **IA:** n8n Orchestrates OpenRouter; backend dispara webhooks `/webhook/tryon`, `/webhook/descriptor`
- **Storage:** MinIO (S3-compatible) para todas las imágenes (selfies, productos, resultados)
- **n8n:** Solo usar workflows existentes con etiqueta `SaaS`; PROHIBIDO crear nuevos sin aprobación

---

## Webhooks n8n Activos

| Función | Variable entorno | Path |
|---------|-----------------|------|
| Try-On principal | `N8N_WEBHOOK_URL` | `/webhook/tryon` |
| Descriptor IA | `N8N_DESCRIPTOR_URL` | `/webhook/descriptor` |
| Enterprise Sync | `N8N_ENTERPRISE_SYNC_WEBHOOK_URL` | `/webhook/enterprise-sync` |

---

## Diseño — Reglas Obligatorias

- **Colores:** `#FF5C3A` (acento/CTAs), `#0a0a0a` (fondo base), `#141414` (cards)
- **Tipografía:** Plus Jakarta Sans (títulos), DM Sans (cuerpo)
- **Texto mínimo:** `#999` (secundario), `#bbb` (features) — PROHIBIDO `#333`–`#555`
- **Iconos:** Solo `lucide-react`, SIN emojis en UI
- **Logo:** SVG + `Look<span className="text-[#FF5C3A]">itry</span>`
- **Toggle activo:** `#FF5C3A` (nunca `bg-blue-600`)
- **Accesibilidad:** Botones mostrar/ocultar contraseña: focusables + `aria-label`

---

## Programación Defensiva

### Frontend
- **Optional chaining (`?.`) obligatorio** en TODOS los accesos a datos de API o Supabase
- Prohibido renderizar `undefined` o `null` en propiedades de componentes de terceros

### Backend
- Usar `maybeSingle()` o validaciones manuales en lugar de `.single()` cuando el dato pueda no existir
- Bloques `try-catch` granulares — errores en datos periféricos NO deben tumbar toda la respuesta
- **Prohibido require/import dinámico:** todas las librerías externas en nivel superior
- **Prohibidas dependencias circulares:** si una dependencia es necesaria, instanciar localmente dentro del método

### Seguridad
- **Zero API Key Exposure:** NUNCA inyectar API keys estáticas en frontend o widgets públicos
- JWT con expiración de 1 hora, solicitado desde backend vía `/session-token`

---

## Base de Datos

- Backend SIEMPRE usa `supabaseAdmin` (service role)
- Cliente `supabase` anon NUNCA tiene sesión activa — RLS bloquea todo
- Usar `maybeSingle()` en consultas que puedan no retornar datos

---

## Infraestructura

- **VPS:** `31.220.18.39` (root)
- **Contenedores Docker:** `lookitry-frontend`, `lookitry-backend`, `root-n8n-1`, `minio`
- **Reverse proxy:** Traefik (api.lookitry.com, lookitry.com)
- **MinIO Panel:** `https://minio.wilkiedevs.com`
- **n8n Panel:** `https://n8n.wilkiedevs.com`

---

## Codificación UTF-8 (Windows)

Antes de cualquier operación de terminal:
```powershell
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
```

---

## Changelog

Después de cada cambio, registrar en `CHANGELOG.md`:
- Fecha
- Descripción del cambio
- Archivos modificados
- Motivo o contexto

**Regla de archivo:** Si CHANGELOG.md supera 500 líneas o 30 días, renombrar a `CHANGELOG_ARCHIVE_YYYY_MM.md` y crear uno nuevo vacío.
