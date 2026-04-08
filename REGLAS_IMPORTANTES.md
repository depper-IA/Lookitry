---
inclusion: always
---

# Reglas de Implementación — Lookitry
**RESPONDE SIEMPRE EN ESPAÑOL**

> Este archivo contiene las reglas operativas que la IA debe seguir al trabajar en el proyecto.
> Para contexto del proyecto, ver: `PRD.md`, `DESIGN.md`, `TECH_STACK.md`.

---

## 0. Documentación Viva (Regla de Sincronicidad)
**TODA VEZ que se realicen cambios estructurales en la arquitectura, componentes base, o diseño, es OBLIGATORIO:**
1. **Usar el agente `docs-writter`** para documentar los cambios y mantener actualizados los archivos: `PRD.md`, `DESIGN.md`, `TECH_STACK.md` y `REGLAS_IMPORTANTES.md`
2. Estos documentos deben reflejar inmediatamente la realidad del sistema. Los documentos nunca deben quedar obsoletos.

**REGLA DE ORO: NO ELIMINAR información técnica que siga siendo válida o funcional (versiones de librerías, estructuras de carpetas, reglas previas). Solo se debe incluir la información que falta o se actualiza, manteniendo el historial y contexto previo.**

---

## 1. Reglas de Git

- **NO hacer commits ni push** sin que el usuario lo pida explícitamente
- **NO hacer deploy** sin autorización explícita del usuario

### 1.1 Deploy

- **SIEMPRE usar el script `_deploy_now.py`**Located in `C:\Users\Matt\Lookitry\scripts\_deploy_now.py`
- **NUNCA usar GitHub Actions CI/CD** para deploys
- Para ejecutar: `python _deploy_now.py` desde la carpeta `scripts/` o usar `--force` para forzar rebuild

### 1.2 Pasos para Deploy (Commit → Push → Verificar → Deploy)

Cuando el usuario autorice el deploy, seguir estos pasos:

1. **Verificar cambios locales** con `git status` y `git diff`
2. **Hacer commit** con mensaje descriptivo (usar conventional commits: `fix:`, `feat:`, etc.)
3. **Hacer push** a origin main
4. **Ejecutar deploy** con `python scripts/_deploy_now.py --force`
5. **Verificar** que el health check devuelve 200 y los endpoints funcionan
6. **Si hay errores**, diagnosticar y arreglar antes de reportar éxito

> **Nota:** El deploy incluye rebuild de backend y frontend. Verificar siempre que los endpoints críticos funcionen después del deploy.

### 1.3 Agregar Variables de Entorno en Producción

Para agregar variables de entorno en el servidor de producción:

**Opción 1: MCP de Hostinger (recomendado si está disponible)**
- El MCP tiene funciones VPS como `VPS_updateProjectV1` para actualizar variables de entorno
- Usar estas funciones para agregar/modificar variables y luego reiniciar el proyecto

**Opción 2: Acceso SSH manual**
Conectarse al VPS y editar el archivo `.env`:
```bash
ssh root@tu-servidor
echo "ENTERPRISE_SYNC_TOKEN=lookitry_enterprise_sync_2026_03_27_WilkieSecure" >> /root/virtual-tryon/backend/.env.production
docker restart lookitry-backend
```

**Opción 3: Panel de Hostinger**
- Ir a VPS → Gestionar → Variables de Entorno (si está disponible)
- O editar el archivo `.env.production` por sFTP

---

## 2. Registro de Cambios (Changelog)

Cada vez que se realice cualquier cambio en el código, la IA DEBE documentarlo en `CHANGELOG.md` antes de terminar la tarea. Cada entrada debe incluir:
- Fecha
- Descripción del cambio
- Archivos modificados
- Motivo o contexto del cambio

**Sin actualizar el changelog, la tarea no está completa.**

---

## 4. Reglas de Diseño

>参考: `DESIGN.md`

- Colores: `#FF5C3A` naranja, `#0a0a0a` negro base, `#141414` cards
- Tipografía: Plus Jakarta Sans (títulos), DM Sans (cuerpo)
- Texto mínimo: `#999` secundario, `#bbb` features — PROHIBIDO `#333`–`#555`
- Sin emojis en UI — solo SVG / lucide-react
- Toggle activo: `#FF5C3A` (nunca `bg-blue-600`)
- Logo: siempre SVG + texto `Look<span className="text-[#FF5C3A]">itry</span>`
- Accesibilidad: botones de mostrar/ocultar contraseña deben ser focusables y llevar `aria-label`

---

## 5. Blindaje de Ingeniería

Para evitar corrupciones de código ("mojibake") y caídas del sistema (Error 500):

### 5.1 Codificación UTF-8
- Antes de cualquier operación de terminal: `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8`
- Verificar la integridad del archivo tras cada escritura masiva

### 5.2 Programación Defensiva (Frontend)
- **Optional Chaining (`?.`)**: Obligatorio en TODOS los accesos a datos de API o Supabase
- **Fallbacks de Renderizado**: Siempre proveer valores por defecto en componentes de UI. Prohibido renderizar `undefined` o `null` en propiedades de componentes de terceros

### 5.3 Robustez de Backend
- Usar bloques `try-catch` granulares para que errores en datos periféricos no tumben toda la respuesta
- Usar `maybeSingle()` o validaciones manuales en lugar de `.single()` si existe posibilidad de que el dato no exista

### 5.4 Gestión de Dependencias (Backend)
- **Prohibido el require/import dinámico**: Todas las librerías externas deben importarse en nivel superior (`top-level`)
- **Prevención de Dependencias Circulares**: Prohibido instanciar servicios de forma cruzada. Si la dependencia es necesaria, instanciar el servicio localmente dentro del método que lo use

### 5.5 Seguridad de Integraciones
- **Zero API Key Exposure**: NUNCA inyectar API Keys estáticas en el frontend, plugins de WordPress o widgets públicos
- **Session Tokens Efímeros**: Usar JWT con expiración de 1 hora, solicitados desde el backend mediante `/session-token`
- **Frontend Admin Auth**: Usar SIEMPRE `adminApi.ts` para peticiones autenticadas. PROHIBIDO extraer `admin_token` de `localStorage` (está en cookies HTTP-Only). Las peticiones manuales con `fetch` deben incluir `credentials: 'include'`.

### 5.6 Reglas de APIs de IA

- **GROQ**: Se conecta por API oficial directa (`api.groq.com`), NO via OpenRouter
- **OpenRouter**: Exclusivo para GENERACIÓN DE IMÁGENES del WIDGET (Try-On). PROHIBIDO usar sus créditos para otras tareas sin consentimiento explícito del usuario
- Esta regla debe respetarse en todo momento: cualquier uso de OpenRouter debe ser únicamente para generación de imágenes del widget

---

## 6. Reglas de Base de Datos

>参考: `TECH_STACK.md`

- Backend SIEMPRE usa `supabaseAdmin` (service role) — bypasea RLS completamente
- El backend usa JWT propio, NO Supabase Auth
- El cliente `supabase` anon NUNCA tiene sesión activa — RLS bloquea todo

### 6.1 Blindaje contra Operaciones Destructivas de IA

**REGLA CRÍTICA:** Antes de ejecutar cualquier operación que modifique o elimine datos de la base de datos (DDL o DML destructivo), la IA DEBE:

1. **Describir** la operación completa que va a realizar
2. **Confirmar explícitamente** con el usuario antes de ejecutarla
3. **Esperar** la confirmación explícita ("sí", "confirmar", "ejecuta", etc.)

**Operaciones que requieren confirmación previa:**
- `DROP TABLE`, `DROP INDEX`, `DROP COLUMN`
- `DELETE` o `TRUNCATE` de cualquier tabla
- `ALTER TABLE ... DROP` columnas o restricciones
- `UPDATE` masivo (más de 10 registros)
- `INSERT` con datos sensibles o de producción
- Ejecución de migraciones de base de datos
- Cualquier operación via Supabase MCP (`supabase_execute_sql`, `supabase_apply_migration`)

**Operaciones NO destructivas que NO requieren confirmación:**
- `SELECT` para consulta o análisis
- `INSERT` de datos de prueba en entorno local
- `UPDATE` de registros individuales con fines de debug (con descripción previa)

**Excepciones:** Solo en emergencia justificada y con descripción del riesgo.

---

## 7. Reglas de n8n

- **PROHIBIDO crear nuevos workflows** en n8n a menos que el usuario lo apruebe explícitamente
- **SOLO usar workflows existentes** que contengan la etiqueta `SaaS`
- **Email marketing NO se maneja en n8n** — ver sección 8.4

### Webhooks activos utilizados por el backend:

| Función | Variable de entorno | Webhook URL |
|---------|---------------------|-------------|
| Try-On principal | `N8N_WEBHOOK_URL` | `/webhook/tryon` |
| Descriptor IA (productos) | `N8N_DESCRIPTOR_URL` | `/webhook/descriptor` |
| Feedback embedding | — | `/webhook/feedback-embedding` |
| Blog (artículos) | `N8N_BLOG_WEBHOOK_URL` | — |
| Enterprise Sync | `N8N_ENTERPRISE_SYNC_WEBHOOK_URL` | — |

> El Error Handler se ejecuta automáticamente como `errorWorkflow` del Try-On en n8n.

---

## 8. Resumen de Arquitectura y Flujos

Para detalles técnicos exhaustivos, referirse siempre a `TECH_STACK.md`.

### 8.1 Flujos de n8n (IA)
- **Try-On:** Backend dispara `/webhook/tryon`. n8n procesa con OpenRouter y actualiza Supabase.
- **Error Handling:** Cualquier fallo en n8n activa el flujo de error que notifica a los admins en el panel.

### 8.2 Flujos Críticos de Negocio
- **Registro:** Turnstile -> DB -> Email SMTP.
- **Pagos (Wompi y PayPal):** Ambos gateways funcionan correctamente. Webhooks validan firma e inician `renewSubscription`. **NO modificar esta lógica sin autorización explícita del usuario — riesgo alto de romper los pagos.**
- **Trial:** Flujo funciona parcialmente. Requiere revisión futura con cuidado de no afectar pagos.
- **Upgrade:** Se aplica crédito prorrateado del plan anterior. El nuevo plan inicia inmediatamente.
- **Referidos:** El reward vigente es `500` créditos para el referente y `100` créditos para el referido. Se acreditan automáticamente tras el primer pago mensual elegible del referido.

### 8.3 Infraestructura
- **Docker:** Frontend, Backend, n8n y MinIO corren en contenedores aislados en el VPS (`31.220.18.39`).
- **Almacenamiento:** Todas las imágenes (selfies, productos, resultados) residen en **MinIO**.

### 8.4 Sistema de Email Marketing (Brevo)
- **Proveedor:** Brevo SMTP (no nodemailer ni workflows de n8n)
- **Límite gratuito:** 300 emails/día (no superar)
- **Rate limiting:** 50 emails por batch con delay de 10 min entre batches
- **Tablas DB:** `email_campaigns`, `email_campaign_recipients`
- **Job:** `email-campaign.job.ts` procesa campaigns programadas cada 5 min
- **Flujo:**
  1. Admin crea campaña (nombre, asunto, template HTML con variables `{{firstName}}`, `{{brandName}}`)
  2. Admin previsualiza con 3 recipients de ejemplo
  3. Admin elige "Ejecutar ahora" o "Programar"
  4. Sistema procesa en batches respetando rate limit
- **Tracking:** Brevo API retorna opens/clicks → actualiza `email_campaign_recipients`

### 8.5 Sistema de Lead Generation & CRM
- **Fuente de leads:** Google Places API (tiendas de moda, accesorios, boutiques)
- **Scope geográfico:** Colombia (Cali, Medellín, Bogotá), USA (ciudades hispanas), España (Madrid, Barcelona)
- **Filtro:** Solo negocios con presencia online (website o redes sociales)
- **Rate limiting Google Places:** 500 requests/día, 28k/mes (free tier)
- **Tablas DB:** `leads`, `lead_searches`, `lead_outreach_log`, `social_api_configs`, `google_places_quota`
- **Servicios:**
  - `lead.service.ts`: CRUD leads, stats, outreach logging
  - `lead-search.service.ts`: Gestión búsquedas guardadas
  - `lead-generation.service.ts`: Google Places con rate limiting
  - `social-api-config.service.ts`: Gestión credenciales Meta/TikTok
- **Panel Admin:** `/admin/leads`, `/admin/lead-searches`, `/admin/social-api-config`
- **Integraciones futuras (pendiente usuario):**
  - Meta Business SDK (requiere aplicación a Meta Developers)
  - TikTok Marketing API (requiere aplicación a TikTok Developers)

---

## 9. Razonamiento Sistemático

Para problemas complejos, multi-etapa o con alcance inicialmente unclear, **cargar el skill `sequential-thinking`** para razonamiento paso a paso con capacidad de revisar y ajustar el enfoque.

### 9.1 Graph de Memoria (memory_*)

Al iniciar cada sesión:
1. Si el proyecto tiene contexto previo en memoria, **consultar con `memory_search_nodes`** usando el nombre del proyecto
2. Si hay decisiones de diseño, preferencias del usuario o contexto relevante, **recuperar con `memory_open_nodes`**

Durante la sesión, guardar en memoria:
- Decisiones arquitectónicas importantes
- Preferencias del usuario sobre el proyecto
- Contexto de deuda técnica o pendientes

Usar `memory_search_nodes` antes de asumir o preguntar algo que ya esté grabado.

### 9.2 Context7 (documentación de librerías)

**Antes de escribir o revisar código que use una librería/framework externo**, llamar a `context7_resolve-library-id` seguido de `context7_query-docs` para obtener documentación fresca y ejemplos de uso.

---

## 10. Sistema de Agentes IA

### 10.1 Equipo de Agentes

El orchestration corre via **Sammy** (Telegram + OpenCode). Los agentes especializados están en `.opencode/agents/`:

| Agente | Archivo | Responsabilidad | MCPs | Modelo |
|--------|---------|----------------|------|--------|
| Sammy | `sammy.md` | Orquestador | memory | MiniMax → DeepSeek |
| WebWizard | `webwizard.md` | Frontend, UI, widget | supabase, n8n | MiniMax → DeepSeek |
| DevGuardian | `devguardian.md` | Code review, seguridad | supabase, context7 | MiniMax → DeepSeek |
| DataAlchemist | `dataalchemist.md` | DB, n8n, RAG | supabase, n8n, context7 | MiniMax → DeepSeek |
| GrowthPilot | `growthpilot.md` | Leads, CRM, email | supabase, hostinger | MiniMax → DeepSeek |
| ArchitectAI | `architectai.md` | Docker, VPS, deploy | hostinger, supabase | MiniMax → DeepSeek |

**Modelos gratuitos:**
- `minimax-coding-plan/MiniMax-M2.7` — Principal
- `deepseek/deepseek-coder-33b-instruct` — Fallback (coding, gratuito)
- `groq/llama-3.3-70b-instruct` — Subagentes (tareas simples, gratuito)

**Subagentes GROQ:** Para tareas simples, los agentes usan GROQ (`groq/llama-3.3-70b-instruct`) en lugar del modelo principal para ahorrar tokens.

### 10.2 Criterios de Delegación

| Si la tarea menciona... | Delegar a |
|------------------------|-----------|
| UI, diseño, widget, landing, checkout | WebWizard |
| Bug, test, seguridad, PR, webhooks | DevGuardian |
| DB, n8n, IA, RAG, embeddings | DataAlchemist |
| Leads, CRM, email, marketing, referidos | GrowthPilot |
| Docker, VPS, deploy, arquitectura | ArchitectAI |

### 10.3 Skills Disponibles

Usar `@brainstorming` antes de cualquier implementación. Ver `.opencode/SKILL.md` para el índice completo.

### 10.4 Protección de Skills ⚠️

**CARPETA PROTEGIDA:** `.opencode/skills/`

Esta carpeta CONTIENE skills esenciales que NO DEBEN ser borrados bajo ninguna circunstancia:

| Skill | Descripción |
|-------|-------------|
| `brainstorming/` | Lluvia de ideas estructurada |
| `ui-ux-pro-max/` | UI/UX avanzado |
| `seo-audit/` | Auditoría SEO |
| `subagent-driven-development/` | Desarrollo multi-agente |
| `test-driven-development/` | Testing proactivo |
| `verification-before-completion/` | Verificación pre-entrega |
| `excalidraw-diagram/` | Diagramas visuales |
| `sequential-thinking/` | Razonamiento sistemático |
| `token-efficiency/` | Optimización de contexto |
| `code-reviewer/` | Code review automático |
| `frontend-design/` | Diseño frontend |
| `web-design-guidelines/` | Guidelines de diseño |
| `mcp-builder/` | Construir MCP servers |
| `find-skills/` | Buscar skills |
| `claude-code-expert/` | Expertos en Claude Code |
| `using-git-worktrees/` | Git worktrees |
| `playwright/` | End-to-end testing y browser automation |
| `skill-creator/` | Crear y mejorar skills |

**REGLA ABSOLUTA:**
- **PROHIBIDO eliminar, mover o modificar** cualquier archivo dentro de `.opencode/skills/`
- **PROHIBIDO ejecutar "cleanups"** o scripts que eliminen archivos "duplicados" o "temporales" sin antes verificar que NO afectan `.opencode/skills/`
- Si un agente o script intenta borrar esta carpeta, **DETENERSE inmediatamente** y consultar al usuario

**Si un commit anterior fue un "cleanup" que borró skills:**
1. Restaurar desde git: `git checkout <commit-anterior> -- .opencode/skills/`
2. Reportar el incidente al usuario
3. Actualizar SKILL.md si las rutas cambiaron

### 10.4 Reglas de Documentación

Tras cada tarea completada, SIEMPRE:
1. Actualizar `CHANGELOG.md` (fecha, descripción, archivos, motivo)
2. Si hay deuda técnica, registrarla en `pendientes.md`
3. Mantener `PRD.md`, `DESIGN.md`, `TECH_STACK.md` y `REGLAS_IMPORTANTES.md` actualizados

---

**Última actualización:** Abril 2026
