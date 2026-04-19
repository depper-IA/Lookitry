# Changelog - Lookitry

---

---

## 2026-04-19 (4:11 PM)


### Diagnóstico VPS — Steal Time 88.5%

**Problema:** n8n muy lento, Code nodes dando timeout (60s)

**Causa raíz:** Steal Time del hipervisor de Hostinger al 88.5% — el servidor físico está saturado con otras VMs ("noisy neighbor problem")

**Síntomas:**
- CPU disponible real: ~9.8%
- Steal: 88.5%
- n8n task runner timeout

**Solución pendiente:** Evaluar upgrade a KVM 4 (4 vCPUs) o migrar datacenter

**Comandos de diagnóstico ejecutados:**
```bash
# Ver CPU real (incluyendo steal)
top -c -b -n 1
# Ver steal time
grep cpu /proc/stat
# Docker stats
docker stats --no-stream
# Reiniciar n8n (no resuelve el steal)
docker restart root-n8n-1
```

---

## 2026-04-19 (12:45 PM)

### Sistema de Pool de Agentes con Dashboard — v3.0

**Descripción:**
Sammantha ahora spawnea agentes bajo demanda. Nunca hace trabajo de otros agentes. Siempre delega al especializado.

**Regla de Oro:**
```
❌ SAMMANTHA: "Voy a revisar el código del frontend..."
✅ SAMMANTHA: "Spawneo a Pixel para que revise el frontend"
```

**Archivos creados:**
- `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md` - Dashboard en tiempo real del estado de agentes
- `Cerebro/Protocolos/DELEGATION_PROTOCOL.md` - Protocolo completo de cómo delegar tareas

**Tabla de Delegación Completa:**
| Problema Descrito | Tipo | Agente |
|-------------------|------|--------|
| "El checkout falla en mobile" | Frontend/UI/Responsive | Pixel |
| "El widget de try-on no carga" | Frontend/Componente | Pixel |
| "Hay errores en el build" | Frontend/Debug | Pixel |
| "Los webhooks de Wompi no funcionan" | Pagos/Backend | Kira |
| "El login está fallando" | Auth/Seguridad | Kira |
| "Hay errores de TypeScript" | Code Review | Kira |
| "Las búsquedas están lentas" | DB/Queries | Nadia |
| "El RAG no responde bien" | IA/Embeddings | Nadia |
| "El workflow de n8n está caído" | Automatización/n8n | Nadia |
| "Quiero un reporte de leads" | Marketing/CRM | Marlo |
| "La campaña de email no envía" | Email/Marketing | Marlo |
| "El servidor está caído" | Infraestructura/VPS | Zephyr |
| "Necesito hacer deploy" | DevOps/Deploy | Zephyr |
| "Docker no arranca" | Docker/Infra | Zephyr |
| "Hay vulnerabilidades en el código" | Seguridad/Auditoría | Cipher |
| "Quiero hacer pentesting" | Seguridad | Cipher |
| "El trading automatizado falló" | Trading | Leo |
| "Crear posts para Instagram" | UGC/Contenido | Rebecca |
| "El CHANGELOG está desactualizado" | Documentación | Lina |
| "Necesito documentar X" | Documentación | Lina |

**Modelo:**
- Pool de agentes bajo control de Sammantha
- Spawneo bajo demanda cuando Sam lo pide o cuando hay tareas de su departamento
- Cada agente reporta a Sammantha, Sammantha reporta a Sam
- Dashboard actualizado después de cada spawn y completación

**Dashboard accesible en:**
- OpenClaw Control UI → Sessions (buscar labels `pixel:`, `kira:`, etc.)
- Preguntar a Sammantha: "Estado de los agentes"
- Archivo: `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md`

---

## 2026-04-19 (12:35 PM)

### Tracking de Agentes - Estado Automático

**Archivos creados:**
- `Cerebro/Estado/active_agents.json` - Estado en tiempo real de todos los agentes
- `Cerebro/Scripts/update_agent_status.sh` - Script para actualizar estado

**Funcionalidad:**
- API detecta agentes activos por labels de sesión (`pixel:`, `kira:`, etc.)
- Sammantha aparece como `busy` cuando trabaja con Sam
- Agentes delegados se marcan `busy` con `sessionKey`
- Se actualiza automáticamente al completar tareas

**Flujo:**
```
Sammantha recibe tarea → Marca agente como busy → Spawnea agente
→ Agente completa → Marca agente como offline → Sammantha notifica a Sam
```

---

## 2026-04-19 (12:30 PM)

### AgentDetailModal - Modal de Detalle de Agente

**Archivos creados:**
- `components/agents/AgentDetailModal.tsx` - Modal con información detallada del agente

**Funcionalidad:**
- Muestra estado, última actividad, herramientas disponibles
- Centrado correctamente en pantalla
- Datos reales de OpenClaw sessions

---

## 2026-04-19 (12:27 PM)

### Pixel Skills Actualizadas

**Archivo modificado:** `Cerebro/Agentes/webwizard.md`

**Skills añadidas:**
- brainstorming
- frontend-design
- ui-ux-pro-max
- verification-loop
- bug-hunter

**Stack técnico añadido:**
- Next.js 15 (App Router)
- TypeScript strict mode
- Tailwind CSS 4
- Framer Motion 12
- Lucide React
- shadcn/ui components
- Zustand (state management)
- React Query / SWR

**Equipo de colaboración:**
- Melissa Urbano (Junior Front-End Developer)

---

## 2026-04-19 (12:07 PM)

### Mission Control Agents - Datos Reales de OpenClaw

**Trabajo completado:**
- [x] API Route: `/api/agents/status` - Consulta sesiones reales de OpenClaw
- [x] OpenClaw Client: `/lib/openclaw/client.ts` - Cliente para Gateway API
- [x] OpenClaw Sessions wrapper: `/lib/openclaw/sessions.ts`
- [x] AgentsPage actualizado: `/app/mission-control/agents/page.tsx` con polling de 30s
- [x] Verificación con Pixel: Backend corriendo, API responde con 10 agentes

**Ruta:** `/mission-control/agents`
**Polling:** 30 segundos
**Endpoints:** `http://localhost:4002` con token `fca2235a378d3882993e733b5b15b729`

---

## 2026-04-19 (Mediodía)

### Sistema de Pool de Agentes con Dashboard

**Descripción:**
Sammantha ahora spawnea agentes bajo demanda. Nunca hace trabajo de otros agentes. Siempre delega al especializado.

**Archivos creados:**
- `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md` - Dashboard en tiempo real del estado de agentes
- `Cerebro/Protocolos/DELEGATION_PROTOCOL.md` - Protocolo completo de cómo delegar tareas

**Tabla de Delegación:**
| Tarea | Agente |
|-------|--------|
| UI / Frontend | Pixel |
| Code Review / Testing | Kira |
| DB / Queries / IA / n8n | Nadia |
| Marketing / CRM / Leads | Marlo |
| Infra / VPS / Docker | Zephyr |
| Documentación | Lina |
| Seguridad / Pentesting | Cipher |
| Trading | Leo |
| UGC / Contenido | Rebecca |
| Pagos / Auth / Webhooks | Kira |

**Modelo:**
- Pool de agentes bajo control de Sammantha
- Spawneo bajo demanda cuando Sam lo pide o cuando hay tareas de su departamento
- Cada agente reporta a Sammantha, Sammantha reporta a Sam
- Dashboard actualizado después de cada spawn y completación

**Dashboard accesible en:**
- OpenClaw Control UI → Sessions (buscar labels `pixel:`, `kira:`, etc.)
- Preguntar a Sammantha: "Estado de los agentes"
- Archivo: `Cerebro/Protocolos/AGENT_STATUS_DASHBOARD.md`

**Cron Jobs:**
- Pixel: cada 30 min (deshabilitado por ahora, requiere config OpenClaw)

---

## 2026-04-18 (Tarde)

### Lookitry Social OS - Sistema Completo de Automatización

**Descripción:**
Sistema completo para automatizar contenido de Instagram + TikTok con música AI.

**Stack tecnológico:**
| Servicio | Función | Costo |
|----------|---------|-------|
| GCP Vertex AI (imagen-3.0) | Generación imágenes | $5 credits |
| Pillow | Overlays, marca | $0 |
| Canva Pro | Fallback edición | $0 (cliente tiene) |
| SonAuto AI | Música TikTok | ~$0.02/canción |
| Buffer MCP | Scheduling | $0 |

**Archivos creados:**
- `social-os/README.md` - Documentación principal
- `social-os/DOCUMENTACION_COMPLETA.md` - Documentación técnica completa
- `social-os/create_tiktok_content.py` - Script TikTok completo (slides + música)
- `social-os/slideshows/generator.py` - Clase generadora de carousels
- `social-os/slideshows/create_brand_carousel.py` - Crear carousel con marca
- `social-os/slideshows/add_brand.py` - Añadir marca a imágenes
- `social-os/slideshows/rebecca_carousel.py` - Script simple para Rebecca
- `social-os/slideshows/templates_tiktok.json` - 5 templates TikTok
- `social-os/music/music_generator.py` - Generador SonAuto
- `social-os/music/output/test_song.ogg` - Canción de prueba (1.2MB)
- `social-os/canva/canva_enhancer.py` - Integración Canva (fallback)
- `social-os/canva/README.md` - Documentación Canva
- `social-os/calendar/scheduler.py` - Gestor calendario
- `social-os/calendar/content_calendar.json` - Posts planificados
- `social-os/analytics/tracker.py` - Log de posts
- `social-os/analytics/database.sql` - Schema Supabase
- `social-os/hooks/hook_library.json` - 8 viral hooks

**Modificaciones:**
- `backend/scripts/gcp_image_generator.py` - Actualizado para JWT auth
- `backend/.env` - Añadido SONAUTO_API_KEY
- `Cerebro/Agentes/rebecca.md` - Actualizada con nuevos workflows

**GCP Authentication:**
- Método: JWT + OAuth2 token exchange
- Service Account: `lookitry-67844@appspot.gserviceaccount.com`
- Key file: `/home/travis/Lookitry/Lookitry/google/permiso-abril.json`
- Modelo: `imagen-3.0-generate-001`

**SonAuto Music:**
- API Key: `sksonauto_wrlgeFuh0RI9Ajb7I8yMfg132qj_PBIFJn55_hWP74IrnJid`
- Primera canción generada exitosamente
- Tags válidos: electronic, dance, ambient, chill, pop, 2020s, etc.
- ⚠️ Tags inválidos: upbeat, fashion, luxury, trending, viral

**Brand Elements:**
- Color primario: #FF5C3A (Naranja)
- Color secundario: #111111 (Negro)
- Logo: `/home/travis/Lookitry/Lookitry/Content/Graphics/lookitry_logo_real.png`

**Costo por post:** ~$0.20 (1 imagen GCP + 1 canción SonAuto)

---

## 2026-04-18 (Mañana)

### Nuevas Funcionalidades

#### Rebecca - Automatización de Redes Sociales con Buffer

**Archivos creados:**
- `Cerebro/Skills/social-automation-buffer.md` - Nueva skill para automatización

**Archivos modificados:**
- `Cerebro/Skills/Skills.md` - Indexada la nueva skill

**Descripción:**
- Rebecca ahora puede generar contenido para Twitter, Facebook, Instagram y LinkedIn
- Contenido se envía a Buffer API para programación automática
- Flujo: Sam solicita → Rebecca genera → Sam aprueba → Buffer programa

**Plataformas soportadas:**
- Twitter/X
- Facebook Pages
- Instagram (Business)
- LinkedIn Pages

**Tecnología:**
- Buffer API para programación
- MiniMax-M2.7 para generación de contenido
- Telegram como interfaz de aprobación

---

## 2026-04-14

### Sistema de Agentes v2.0

**Cambios principales:**
- 10 agentes con nombres nuevos
- Modelo default: MiniMax-M2.7 (Groq/DeepSeek removidos)
- Rebecca v3.0 con foco en MONEY
- Melissa como colaboradora de Pixel
- Leo como agente de trading
- Regla 6: Notificación obligatoria de tareas

**Archivos actualizados:**
- REGLAS_IMPORTANTES.md
- AGENTS.md

---

## 2026-04-12

### Fix CRÍTICO - Secretos en docker-compose

**Archivos modificados:**
- `docker-compose.yml` - Secretos removidos, ahora usa .env

---

## 2026-04-11

### Fix CRÍTICO - Precios Inconsistentes

**Problema:** Precios diferentes entre /terminos y /planes

**Solución:**
- Unificados precios en Supabase `pricing_config`
- Creada función `getPricingConfig()` en `@/lib/pricing`
- Removidos precios hardcodeados del frontend

---

## 2026-04-10

### Fix URLs 404 en Sitemap

**Problema:** Google indexando URLs obsoletas que causan 404

**Solución:**
- Implementadas redirecciones 301 en `next.config.js`
- Actualizado sitemap dinâmico

---

## 2026-04-09

### Fix Trial Confundidor

**Problema:** Usuarios confundían trial gratis vs trial de $20.000 COP

**Solución:**
- Clarificado messaging: "Trial de $20.000 COP" no "gratis"
- Actualizado copy en landing y checkout
- Agregado tooltip explicativo

---

_Last updated: 2026-04-19 12:45 UTC-5_