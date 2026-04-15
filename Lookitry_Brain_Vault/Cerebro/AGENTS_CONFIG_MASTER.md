# 📋 AGENTS_CONFIG_MASTER.md
**Última actualización**: 2026-04-14
**Versión**: 2.0

---

## RESUMEN DE CAMBIOS v2.0

### Modelo Default: MiniMax-M2.7
- **CAMBIADO**: Groq y DeepSeek ya NO están en systemPromptOverride de ningún agente
- Todos los agentes usan ahora el default `minimax/MiniMax-M2.7`
- Excepción: Groq solo si el modelo lo requiere explícitamente en AGENTS.md del Cerebro

### Estructura de Archivos por Agente
- **CAMBIO**: Cada agente tiene ahora 6+ archivos de configuración:
  - `SOUL.md` — Personalidad y comportamiento
  - `IDENTITY.md` — Identidad básica
  - `USER.md` — Usuarios y contexto ✅ COMPLETO
  - `HEARTBEAT.md` — Protocolo de vida ✅ COMPLETO
  - `TOOLS.md` — Herramientas ✅ COMPLETO
  - `MEMORY.md` — Tareas y memoria ✅ COMPLETO
  - `AGENTS.md` — Definición del agente ✅ COMPLETO
  - `AGENTS_SOUL.md` — Personalidad extendida

---

## EQUIPO COMPLETO DE AGENTES

| Nombre | Workspace | Rol | Modelo Default |
|--------|-----------|-----|----------------|
| **Sammantha** | sammy | Orquestadora Maestra | MiniMax-M2.7 |
| **Pixel** | webwizard | Frontend Magician | MiniMax-M2.7 |
| **Kira** | devguardian | Guardiana de Calidad | MiniMax-M2.7 |
| **Nadia** | dataalchemist | Alquimista de Datos | MiniMax-M2.7 |
| **Marlo** | growthpilot | Piloto de Crecimiento | MiniMax-M2.7 |
| **Zephyr** | architectai | Arquitecto de Infra | MiniMax-M2.7 |
| **Lina** | docs-writer | Documentadora | MiniMax-M2.7 |
| **Cipher** | security-auditor | Hacker Ético | MiniMax-M2.7 |
| **Rebecca** | rebecca | UGC Creator + Embajadora | MiniMax-M2.7 |
| **Leo** | leo | Agente de Trading | MiniMax-M2.7 |

---

## AGENTES CONFIGURADOS EN SESIÓN ACTUAL

### ✅ Rebecca v3.0 (UGC Creator)
**Workspace**: `rebecca/`
**Configuración completa**: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md

**Nuevas capacidades**:
- Automejora continua (tendencias, A/B testing)
- Herramientas gratuitas para contenido (CapCut, DaVinci, Canva, Pexels)
- Conseguir clientes para Fiverr y Lookitry
- Buscar patrocinio (SOLO grants, NO equity)
- **PROHIBIDO**: ceder % de sociedad, compartir propiedad, vender partes

**Foco**: MONEY - Generar ingresos para Lookitry

### ✅ Cipher (SecurityAuditor)
**Workspace**: `security-auditor/`
**Configuración completa**: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md

**Stack real documentado**:
- Auditor services: auditor.security.ts, auditor.payments.ts, auditor.subscriptions.ts
- audit.service.ts para logging centralizado
- Tablas: admin_audit_log, admin_notifications, trial_registrations
- Helmet y CORS config

### ✅ Pixel (WebWizard)
**Workspace**: `webwizard/`
**Configuración completa**: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md

**Stack real documentado**:
- Next.js 14, React 18.2.0, TypeScript 5.3.3
- Framer Motion 12.38.0, GSAP 3.14.2
- Tailwind CSS, Zustand
- 16 servicios, 12 carpetas de componentes

### ✅ Marlo (GrowthPilot)
**Workspace**: `growthpilot/`
**Configuración completa**: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md

**Stack real documentado**:
- CRM Lead Filter System
- APIs: analytics, email-campaigns (Brevo), trial-campaigns
- SMTP configuration
- n8n workflows

### ✅ Kira (DevGuardian)
**Workspace**: `devguardian/`
**Configuración completa**: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md

**Stack real documentado**:
- Vitest 4.1.0 (frontend), Jest 30.3.0 (backend)
- Helmet 8.1.0, express-rate-limit 8.3.1
- Security rules de REGLAS_IMPORTANTES.md

### ✅ Nadia (DataAlchemist)
**Workspace**: `dataalchemist/`
**Configuración completa**: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, TOOLS.md, MEMORY.md

**Stack real documentado**:
- APIs: GROQ (chat), OpenRouter (Try-On images), Gemini (embeddings)
- Supabase con pgvector
- Webhooks: tryon, descriptor, enterprise-sync

---

## REGLAS DE CONFIGURACIÓN DE AGENTES

### ✅ Cumplidas
1. Cada agente tiene workspace completo con 6+ archivos
2. TOOLS.md contiene información real del Cerebro (no genérica)
3. USER.md tiene contexto de personas reales y agentes
4. HEARTBEAT.md tiene tareas específicas y thresholds
5. SOUL.md tiene personalidad y reglas
6. MEMORY.md tiene tareas y stack tecnológico real

### ❌ Evitar
- No usar "TU_NOMBRE", "TU_EMAIL", "placeholder"
- No inventar información no verificable
- No copiar templates genéricos sin personalizar

---

## PERSONAS REALES (No Agentes)

| Nombre | Rol | ID Telegram |
|--------|-----|------------|
| **Sam Wilkie** | Founder / Owner | 1049458877 |
| **Melissa Urbano** | Junior Front-End Developer | 942528796 |

**Nota**: Melissa es COLABORADORA de Pixel, NO subordinada a agentes

---

## NOTAS IMPORTANTES

### Leo
- Es un AGENTE de trading, NO una persona real
- Trabaja en conjunto con Rebecca para generar ingresos

### Melissa
- Es una PERSONA REAL (Junior Front-End Developer)
- Trabaja JUNTO CON Pixel en frontend
- Listed in USER.md como "PERSONA REAL"

### Groq/DeepSeek
- **REMOVIDOS** de todos los systemPromptOverride
- Solo usar si AGENTS.md del Cerebro lo especifica explícitamente

---

## TAREAS PENDIENTES DE DOCUMENTACIÓN

- [ ] Zephyr (ArchitectAI) - Completar archivos faltantes
- [ ] Leo - Revisar configuración
- [ ] CHANGELOG.md - Registrar cambios de hoy

---

_Last updated: 2026-04-14 15:04 UTC-5_