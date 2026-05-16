# PRD - Career Agent (Sammy v2)

## 1. Resumen Ejecutivo

Sistema de búsqueda y postulación automática de empleo para Samuel Wilkie. Sammy busca ofertas en portales globales (LinkedIn, Indeed, etc.), las analiza con Vertex AI (Gemini), adapta CVs con MiniMax, guarda todo en Obsidian y reporta por Telegram para aprobación humana antes de aplicar.

**Stack técnico:** OpenClaw + Playwright + Vertex AI (Gemini) + MiniMax + Obsidian CLI  
**Canal de comunicación:** Telegram (Wilkie Devs)  
**Vault:** `Lookitry_Brain_Vault` → `/home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault`

---

## 2. Objetivos del Sistema

### 2.1 Objetivo Principal
Automatizar la búsqueda de empleo Senior Developer / AI Engineer remote en Europa y USA, con análisis inteligente y postulación responsable (sin aplicar sin aprobación si match < 90%).

### 2.2 Objetivos Secundarios
- Mantener un tracking organizado de todas las ofertas en Obsidian
- Reducir tiempo spent en aplicación manual
- Identificar las mejores oportunidades basándose en match de skills
- Generar propuesta personalizada para cada aplicación

---

## 3. Configuración del Sistema

### 3.1 Rutas y Archivos
```
Vault Obsidian:     /home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault
Carpeta Empleos:     /home/travis/Lookitry/Lookitry/Lookitry_Brain_Vault/Empleos
Notas de ofertas:    {vault}/Empleos/YYYY-MM-DD-{Empresa}-{Puesto}.md
Tracking:           {vault}/Empleos/APPLICATION_TRACKER.md
```

### 3.2 Modelos AI
| Propósito | Modelo | Provider |
|-----------|--------|-----------|
| Análisis técnico de JDs | gemini-2.0-flash | Vertex AI (Google Cloud) |
| Redacción de CVs, msgs LinkedIn, emails | MiniMax-M2.7 | MiniMax (OpenClaw default) |
| Fallback generación | minimax/MiniMax-M2.7 | OpenClaw |

### 3.3 Variables de Entorno Requeridas
```
# GCP (Vertex AI)
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
GCP_PROJECT=tu-project-id
GCP_LOCATION=us-central1

# MiniMax (ya configurado en OpenClaw)
MINIMAX_API_KEY=xxx (ya existe)
```

---

## 4. Arquitectura de Componentes

### 4.1 Job Search Engine (Playwright)
- **Capacidad:** Navegar y scrapear portales de empleo (LinkedIn, Indeed, Glassdoor, etc.)
- **Filtros por defecto:**
  - Keywords: "Senior Developer", "AI Engineer", "Full Stack Engineer", "Backend Developer"
  - Ubicación: Remote (USA, Europa)
  - Fecha: Últimas 24h o 7 días (configurable)
  - Stack: Node.js, Python, JavaScript, TypeScript, AI, Machine Learning
- **Output:** Lista de URLs de ofertas con metadata básica

### 4.2 AI Orchestrator (Vertex AI + MiniMax)
- **Selector automático:**
  - Análisis de JD (technical skills, requirements, company culture) → Vertex AI (Gemini)
  - Redacción de CV adaptado, mensajes LinkedIn, emails de postulación → MiniMax
- **Match Score Algorithm:**
  - Comparar skills del perfil Wilkie vs requirements de la JD
  - Scoring: 0-100%
  - Umbral: ≥90% = auto-apply, <90% = requiere aprobación

### 4.3 Obsidian Writer
- **Función:** Crear archivos .md en el vault con formato YAML frontmatter
- **Formato de nota:**
```markdown
---
title: "{Empresa} - {Puesto}"
date: {YYYY-MM-DD}
status: {FOUND|APPLIED|INTERVIEW|OFFER|REJECTED}
match_score: {0-100}
company: "{Empresa}"
location: "{Ubicación}"
salary: "{Salario o N/A}"
application_url: "{URL}"
stack: [{tech1}, {tech2}]
recruiter_name: "{Nombre o N/A}"
recruiter_email: "{Email o N/A}"
notes: "{Notas adicionales}"
---

# {Empresa} - {Puesto}

## Descripción del Puesto
{Descripción extraída de la JD}

## Requisitos Técnicos
- {req1}
- {req2}

## Por Qué Es Una Buena Match
{Análisis de por qué Wilkie califica}

## CV Adaptado (draft)
{Draft del CV adaptado generado por MiniMax}

## Mensaje de LinkedIn (draft)
{Draft del mensaje personalizado}

## Timeline
- {fecha}: Oferta encontrada
- {fecha}: CV enviado
- {fecha}: Entrevista programada
```

### 4.4 Telegram Notifier
- **Capacidad:** Enviar mensajes interactivos con botones
- **Estructura de reporte:**
```
📥 Nueva Propuesta Encontrada
Empresa: {Empresa}
Puesto: {Puesto}
Ubicación: {Remote/ciudad}
Match Score: {XX}% (Vertex AI)
Salario: {$$$ o N/A}

📋 Resumen del Análisis:
{Resumen de 3-5 líneas de por qué califica}

📄 Archivos generados:
- Nota Obsidian: ✅ Creada
- CV adaptado: ✅ Listo
- Mensaje LinkedIn: ✅ Listo

¿Deseas que aplique ahora?
[ ✅ APLICAR ] [ 📝 EDITAR CV ] [ ❌ DESCARTAR ]
```

---

## 5. Workflow Principal

### 5.1 Comando de Ejecución
```
"Busca ofertas de Senior Developer remotas en Europa y USA 
publicadas hoy. Filtra por stack Node.js y AI. 
Para las 3 mejores, crea la nota en Obsidian, prepara el CV 
adaptado y envíame el resumen por aquí para darte el OK."
```

### 5.2 Flujo de Ejecución (Paso a Paso)
1. **Búsqueda (Playwright):** Navega portales con filtros configurados
2. **Extracción:** Genera lista de ofertas con metadata (empresa, puesto, URL, fecha, salario si está disponible)
3. **Análisis (Vertex AI):** Para cada oferta relevante:
   - Descarga y parsea la JD
   - Compara con perfil de Wilkie (skills, experiencia, ubicación)
   - Calcula match score (0-100%)
   - Genera resumen ejecutivo
4. **Selección:** Filtra las top 3 (por match score) para reportar
5. **Drafting (MiniMax):** Para cada top 3:
   - Genera CV adaptado
   - Genera mensaje de LinkedIn personalizado
6. **Obsidian Write:** Crea nota para cada oferta analizada
7. **Telegram Notify:** Envía resumen con botones interactivos
8. **Espera aprobación:** Si match < 90%, espera respuesta antes de aplicar
9. **Aplicación (Playwright):** Si approved, navegar a la oferta y aplicar

### 5.3 Flujo de Aprobación
```
Oferta encontrada → Análisis (≥90%?)
├── SÍ → Aplicar automáticamente → Notificar por Telegram (resultado)
└── NO → Reportar por Telegram con botones
    ├── ✅ APLICAR → Aplicar manualmente/automatizado
    ├── 📝 EDITAR CV → Regenerar CV con correcciones
    └── ❌ DESCARTAR → Marcar como rechazada en Obsidian
```

---

## 6. Perfil de Wilkie (Para Match Scoring)

```yaml
nombre: Samuel Wilkie
titulo: Senior Developer / AI Solutions Engineer
ubicacion: Cali, Colombia (GMT-5)
disponibilidad: Remote (Europa/USA timezone overlap OK)

skills_principales:
  - Node.js / TypeScript
  - Python
  - AI / Machine Learning (LLMs, Generative AI)
  - Full Stack Development
  - API Design
  - GCP / Google Cloud Platform
  - Supabase / PostgreSQL
  - Playwright / Testing

experiencia_relevante:
  - Lookitry: SaaS B2B, AI-powered virtual fitting room
  - OpenClaw: AI agent framework
  - n8n automation
  - Integraciones API (WooCommerce, webhooks)

idiomas:
  - Español: Nativo
  - English: B2 (lectura/escritura fluida, conversación técnica)

salario_esperado:
  - USD: $80,000 - $150,000/year
  - Considera remote con ventajas fiscais en Colombia

tipo_trabajo:
  - Full-time remote
  - Contrato directo o freelance
  -.timezone:兼容美洲时区
```

---

## 7. Formato de Application Tracker

Archivo: `Empleos/APPLICATION_TRACKER.md`

```markdown
# Application Tracker

## Estadísticas
- Total ofertas analizadas: {n}
- Aplicadas: {n}
- Entrevistas: {n}
- Ofertas recibidas: {n}
- Tasa de conversión: {X%}

## Ofertas Activas
| Fecha | Empresa | Puesto | Match | Status | Notas |
|-------|---------|--------|-------|--------|-------|
| YYYY-MM-DD | ... | ... | 94% | INTERVIEW | ... |

## Ofertas Cerradas
| Fecha | Empresa | Puesto | Match | Resultado | Lecciones |
|-------|---------|--------|-------|-----------|-----------|
```

---

## 8. Reglas de Operación

### 8.1 Reglas Hard
1. **Nunca aplicar sin confirmación** si match score < 90%
2. **Nunca compartir datos personales** sin validación manual
3. **Todas las aplicaciones se documentan** en Obsidian antes de ejecutar
4. **El canal de comunicación es Telegram** exclusivamente para Wilkie

### 8.2 Reglas Soft
1. Priorizar ofertas published en últimas 24-48h
2. Filtrar por remote only (no híbrido si no es necesario)
3. Ignorar ofertas de agencias de reclutamiento con middlemen (aplicar directo siempre que sea posible)
4. Documentar cada paso en el tracker

### 8.3 Rate Limits y Budget
- Vertex AI: Usar Gemini 2.0 Flash (más barato que Pro)
- MiniMax: Usar MiniMax-M2.7 para todo lo posible
- Limitar búsqueda a 50 ofertas/sesión para evitar detección
- No hacer más de 10 aplicaciones/semana sin feedback

---

## 9. APIs y Herramientas Externas

### 9.1 Portales de Búsqueda
- LinkedIn Jobs (scraping con Playwright)
- Indeed (scraping con Playwright)
- Glassdoor (alternativa)
- No requiere API key (usa Playwright para scraping ético)

### 9.2 Google Cloud (Vertex AI)
- Proyecto: `GCP_PROJECT` env var
- Region: `us-central1` default
- Modelo: `gemini-2.0-flash` para análisis rápido
- Credenciales: `GOOGLE_APPLICATION_CREDENTIALS` (service account JSON)

### 9.3 MiniMax (OpenClaw)
- Integrado por defecto en OpenClaw
- Usar para: CV adaptation, LinkedIn messages, email drafting

### 9.4 Obsidian
- CLI: `notesmd-cli` (ya instalado)
- Vault: `Lookitry_Brain_Vault`
- Carpeta target: `Empleos/`

---

## 10. Roadmap de Implementación

### Fase 1: Configuración Base (Hoy)
- [x] Obsidian CLI instalado y configurado ✅
- [x] Vertex AI SDK instalado ✅
- [ ] Verificar GCP credentials
- [ ] Configurar Vault path en Sammy
- [ ] Actualizar SOUL.md con nueva capacidad

### Fase 2: Búsqueda y Análisis (Esta semana)
- [ ] Implementar Playwright scraper para LinkedIn
- [ ] Implementar Vertex AI analyzer (match scoring)
- [ ] Probar flujo completo con 5 ofertas de test

### Fase 3: Drafting y Obsidian (Esta semana)
- [ ] Implementar MiniMax CV generator
- [ ] Implementar note writer en vault
- [ ] Crear APPLICATION_TRACKER.md

### Fase 4: Telegram Integration (Próxima semana)
- [ ] Implementar notifier con botones inline
- [ ] Implementar flow de aprobación
- [ ] Probar con postulación real

### Fase 5: Automatización Completa (Mes)
- [ ] Cron job para búsqueda diaria
- [ ] Auto-apply para ofertas ≥90% match
- [ ] Dashboard de métricas en Obsidian

---

## 11. Known Issues y Notas

- **GCP Credentials:** Se necesita service account JSON para Vertex AI. Wilkie debe crear o proporcionar uno.
- **Scraping Ethics:** LinkedIn tiene anti-scraping measures. Usar rate limiting suave.
- **Timezone:** Wilkie está en GMT-5 (Colombia). Aplicar en horarios laboral USA/Europa.
- **Language Detection:** Si JD está en español, responder en español. Si está en inglés, responder en inglés.

---

**Autor:** Sammy (Autonomous Career Agent)  
**Creado:** Mayo 2026  
**Última actualización:** Mayo 2026  
**Versión:** 1.0