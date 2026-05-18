---
inclusion: always
---

# Reglas de Implementacion - Lookitry
**RESPONDE SIEMPRE EN ESPANOL**

> ### Navegacion del Cerebro
> - Volver al [[MAPA_MAESTRO|Mapa Maestro de Conocimiento]]
> - Ver Estado de Producto en [[PRD]]

---

## 0. PROTOCOLO DE ARRANQUE (CRÍTICO)

**AL INICIAR CADA CONVERSACIÓN CON SAM:**
1. Leer CHANGELOG.md completo
2. Verificar estado de deploys/tareas pendientes
3. Solo después proceder con la conversación

**RAZÓN**: Evitar perder tiempo preguntando cosas que ya están documentadas

---

## 0. Documentacion Viva (Regla de Sincronicidad)

**TODA VEZ que se realicen cambios estructurales en la arquitectura, componentes base, o diseño, es OBLIGATORIO:**
1. **Usar el agente docs-writter (Lina)** para documentar los cambios y mantener actualizados los archivos: [[REGLAS_IMPORTANTES]] y [[ARCHITECTURE_OVERVIEW]]
2. Estos documentos deben reflejar inmediatamente la realidad del sistema. Los documentos nunca deben quedar obsoletos.

**REGLA DE ORO: NO ELIMINAR informacion tecnica que siga siendo valida o funcional (versiones de librerias, estructuras de carpetas, reglas previas). Solo se debe incluir la informacion que falta o se actualiza, manteniendo el historial y contexto previo.**

### 0.1 Sync de Agentes (OBLIGATORIO)

**CADA VEZ que se modifique AGENTS.md o la configuracion de agentes en openclaw.json:**
1. **Sincronizar TODOS los archivos en `Lookitry_Brain_Vault/Cerebro/Agentes/`**
2. Crear archivos faltantes (ej: `rebecca.md`, `leo.md`)
3. Actualizar archivos existentes con nueva informacion
4. Incluir: identidad, modelo, herramientas, MCPs, responsabilidades, colaboraciones
5. **NUNCA dejar archivos de agentes desactualizados**

**Responsable**: Lina (docs-writer)
**Trigger**: Cualquier cambio en AGENTS.md, REGLAS_IMPORTANTES.md, o configuracion de agentes

---

## 1. Reglas de Git

- **Auto-commit**: DESPUÉS de cada tarea significativa, hacer commit automáticamente con mensaje descriptivo (conventional commits: `feat:`, `fix:`, `docs:`, etc.)
- **Auto-push**: Hacer push después de cada commit exitoso
- **NO hacer deploy** sin autorizacion explícita del usuario

### 1.1 Deploy

- **SIEMPRE usar el script _deploy_now.py** Located in `scripts/_deploy_now.py` (raíz del proyecto: `/home/travis/Lookitry/Lookitry/scripts/_deploy_now.py`)
- **NUNCA usar GitHub Actions CI/CD** para deploys
- Para ejecutar: `python3 scripts/_deploy_now.py` desde la raíz del proyecto

**Flags disponibles:**
| Flag | Efecto |
|------|--------|
| (sin flags) | Deploy inteligente: detecta qué cambió (frontend/backend) |
| `--force` | Fuerza rebuild aunque no haya cambios detectados |
| `--frontend` | Solo rebuild y deploy del frontend |
| `--backend` | Solo rebuild y deploy del backend |
| `--no-cache` | Build Docker sin cache (útil cuando cambia package.json) |

**REGLA:** Usar flags específicos (`--frontend` o `--backend`) cuando el cambio es solo en un servicio. No lanzar un deploy completo por un cambio en un solo Dockerfile.

### 1.2 Pasos para Deploy (Commit -> Push -> Verificar -> Deploy)

Cuando el usuario autorice el deploy, seguir estos pasos:

1. **Verificar cambios locales** con `git status` y `git diff`
2. **Hacer commit** con mensaje descriptivo (usar conventional commits: `fix:`, `feat:`, etc.)
3. **Hacer push** a origin main
4. **Ejecutar deploy** con `python scripts/_deploy_now.py --force`
5. **Verificar** que el health check devuelve 200 y los endpoints funcionan
6. **Si hay errores**, diagnosticar y arreglar antes de reportar exito

---

## 2. Registro de Cambios (Changelog)

Cada vez que se realice cualquier cambio en el codigo, la IA DEBE documentarlo en [[CHANGELOG]] antes de terminar la tarea. Cada entrada debe incluir:
- Fecha
- Descripcion del cambio
- Archivos modificados
- Motivo o contexto del cambio

**Sin actualizar el changelog, la tarea no esta completa.**

---

## 3. Sistema de Agentes IA (Actualizado 2026-04-19) — v3.0

### 3.1 Modelo Default

```yaml
modelo_default: "minimax/MiniMax-M2.7"

regla: "Todos los agentes usan este modelo por defecto"
excepcion: "Solo usar otro modelo si AGENTS.md lo especifica explícitamente"
```

### 3.2 REGLA DE ORO — Sammantha NUNCA hace trabajo de otro agente

```
❌ SAMMANTHA: "Voy a revisar el código del frontend..."
✅ SAMMANTHA: "Spawneo a Pixel para que revise el frontend"
```


**Sammantha es orquestadora INTELIGENTE:**
- Recibe problemas de Sam
- Identifica el tipo de problema
- Delega al agente especializado
- Supervisa y notifica resultados

**Sammantha NUNCA:**
- Código frontend (eso es de Pixel)
- Queries de DB (eso es de Nadia)
- Deploys directos (eso es de Zephyr)
- Code review (eso es de Kira)


### 3.3 Tabla de Delegación por Problema

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
| "El CHANGELOG está desactualizado" | Documentación | Lina |
| "Necesito documentar X" | Documentación | Lina |

### 3.4 Tracking Automático de Agentes (CRÍTICO)

**ARCHIVO DE ESTADO:** `Cerebro/Estado/active_agents.json`

**CADA VEZ que Sammantha delega una tarea:**
1. Actualizar JSON con agente como `busy`
2. Incluir `sessionKey` del subagent spawneado

**CADA VEZ que llega notificación de tarea completada:**
1. Marcar al agente como `offline` inmediatamente

**Sammantha SIEMPRE debe:**
- Mostrarse como `busy` cuando habla con Sam
- Mostrar agentes delegados como `busy`

**REGLA:** Sin tracking automático, el Mission Control muestra datos incorrectos.

**Script de actualización:** `Cerebro/Scripts/update_agent_status.sh`

**Flujo de tracking:**
```
Sammantha recibe tarea → Marca agente como busy → Spawnea agente
→ Agente completa → Marca agente como offline → Sammantha notifica a Sam
```


### 3.4 Flujo de Trabajo

```
Sam describe problema → Sammantha identifica tipo → Sammantha delega → Agente reporta → Sammantha notifica
```


### 3.5 Equipo Completo de Agentes

| Nombre | Workspace | Rol | Modelo |
|--------|-----------|-----|--------|
| **Sammantha** | sammy | Orquestadora Maestra | MiniMax-M2.7 |
| **Pixel** | webwizard | Frontend Magician | MiniMax-M2.7 |
| **Kira** | devguardian | Guardiana de Calidad | MiniMax-M2.7 |
| **Nadia** | dataalchemist | Alquimista de Datos | MiniMax-M2.7 |
| **Marlo** | growthpilot | Piloto de Crecimiento | MiniMax-M2.7 |
| **Zephyr** | architectai | Arquitecto de Infraestructura | MiniMax-M2.7 |
| **Lina** | docs-writer | Documentadora | MiniMax-M2.7 |
| **Cipher** | security-auditor | Hacker Ético | MiniMax-M2.7 |

### 3.3 Invocación

```
@Sammantha [tarea] — Procesar y delegar
@Pixel [tarea] — Frontend directo
@Kira [tarea] — Code review / debug
@Nadia [tarea] — Datos / IA
@Marlo [tarea] — Marketing / CRM
@Zephyr [tarea] — Infraestructura
@Lina [tarea] — Documentación
@Cipher [tarea] — Seguridad
```

### 3.4 Personas Reales (NO Agentes)

| Nombre | Rol | ID Telegram |
|--------|-----|------------|
| **Sam Wilkie** | Founder / Owner | 1049458877 |
| **Melissa Urbano** | Junior Front-End Developer | 942528796 |

**NOTA**: Melissa es **COLABORADORA** de Pixel, NO subordinada a agentes. Trabaja JUNTO CON Pixel en frontend.

### 3.5 Estructura de Archivos por Agente

Cada agente tiene ahora 6+ archivos de configuración:
- `SOUL.md` — Personalidad y comportamiento
- `IDENTITY.md` — Identidad básica
- `USER.md` — Usuarios y contexto
- `HEARTBEAT.md` — Protocolo de vida
- `TOOLS.md` — Herramientas disponibles
- `MEMORY.md` — Tareas y memoria
- `AGENTS.md` — Definición del agente
- `AGENTS_SOUL.md` — Personalidad extendida

### 3.6 Colaboración Entre Agentes

```yaml
pixel + melissa:
  - "Frontend development"
  - "Melissa es COlaboradora, no subordinada"
  - "Code review mutuo"
  
kira + cipher:
  - "Seguridad completa"
  - "Kira: code review"
  - "Cipher: pentesting"
  
nadia + marlo:
  - "Datos para analytics"
  - "Nadia: queries y datos"
  - "Marlo: métricas y campaigns"
```

### 3.7 TTS / Voz de Sammantha

```yaml
sammantha_voice:
  motor: "Gemini 2.5 Flash TTS"
  ubicacion: "/home/travis/Lookitry/Lookitry/backend/scripts/sammantha_voice.sh"
  
  regla: "Solo generar audio cuando Sam ENVÍA audio primero O lo pide explícitamente"
  
  estado: "/home/travis/Lookitry/Lookitry/backend/.tts_state"
```

---

## 4. Reglas de Diseño

- Colores: `#FF5C3A` naranja, `#0a0a0a` negro base, `#141414` cards
- Tipografia: Plus Jakarta Sans (titulos), DM Sans (cuerpo)
- Texto minimo: `#999` secundario, `#bbb` features - PROHIBIDO `#333`–`#555`
- **PROHIBIDO usar emojis** en cualquier interfaz, documento, README o comunicación del proyecto — usar SIEMPRE iconos SVG / lucide-react
- **PROHIBIDO emojis en READMEs de GitHub** (showcases, perfil, repos públicos) — usar badges de shields.io con `logo=` para iconos
- Toggle activo: `#FF5C3A` (nunca `bg-blue-600`)
- Logo: siempre SVG + texto `Look<span className="text-[#FF5C3A]">itry</span>`
- Accesibilidad: botones de mostrar/ocultar contrasena deben ser focusables y llevar `aria-label`
- **PROHIBIDO lineas separadoras entre secciones**: NO usar `border-t border-[#eeebe7]` o `bg-gradient-to-r from-transparent via-black/10` en los `<section>` del landing page (PremiumLanding). Las secciones se separan por espaciado y contraste de color, no por lineas horizontales. Ver archivo `REGLAS_IMPORTANTES.md` para excepciones internas de componentes.

---

## 5. Blindaje de Ingenieria

Para evitar corrupciones de codigo y caidas del sistema:

### 5.1 Codificacion UTF-8
- Antes de cualquier operacion de terminal setar codificacion a UTF8
- Verificar la integridad del archivo tras cada escritura masiva

### 5.2 Programacion Defensiva (Frontend)
- **Optional Chaining (?.)**: Obligatorio en TODOS los accesos a datos de API o Supabase
- **Fallbacks de Renderizado**: Siempre proveer valores por defecto en componentes de UI.
- **Precios dinámicos obligatorios**: Los precios de planes NUNCA deben estar hardcodeados en componentes de UI. Usar siempre `getPricingConfig()` de `@/lib/pricing` que lee de Supabase `pricing_config`.
- **Conversión COP → USD (OBLIGATORIO)**: Ver [[CURRENCY_CONVERSION_RULE|Método único aprobado]] en `Lookitry_Brain_Vault/Cerebro/Rules/CURRENCY_CONVERSION_RULE.md`. Fórmula: `Math.ceil((precioCOP + 10000) / trm)`. PROHIBIDO usar `precioCOP / trm` sin margen.

### 5.3 Robustez de Backend
- Usar bloques try-catch granulares
- Usar maybeSingle() o validaciones manuales en lugar de .single()

### 5.4 Gestion de APIs de IA
- **Vertex AI (GCP)**: Pipeline PRIMARIO de Try-On e imágenes. Usa Gemini 2.5 Flash + Imagen 3 vía `@google-cloud/vertexai`. TODA generación de imágenes pasa por aquí.
- **MobileSAM (Python/FastAPI)**: Servicio LOCAL para generación de máscaras antes del pipeline Try-On. Corre en Docker. PROHIBIDO reemplazar por llamada externa sin autorización explícita.
- **OpenRouter**: SOLO accesible vía n8n como FALLBACK cuando Vertex AI falla. PROHIBIDO llamar directamente desde el backend — la integración directa fue eliminada (ver commits `2bb94eb6`, `e281c8a8`).
- **GROQ**: ~~API directa~~ → **ELIMINADO del proyecto**. No referenciar ni reinstalar.

### 5.5 Blindaje contra Overload de MiniMax (CRÍTICO)

**PROBLEMA**: Error 529 `overload` cuando MiniMax recibe demasiadas requests simultáneas de múltiples agentes.

**PROTOCOLO DE RETRY (Obligatorio para TODOS los agentes):**
```
1. Si recibes error 529 overload de MiniMax:
   - ESPERAR 5 segundos
   - REINTENTAR request original
   - Si falla de nuevo:
     - ESPERAR 15 segundos
     - REINTENTAR
     - Si falla de nuevo:
       - ESPERAR 30 segundos
       - ÚLTIMO intento
       - Si falla, REPORTAR a Sammantha inmediatamente

2. NO abandonar la sesión por overload
3. Si la sesión se cierra por overload, Sammantha la reiniciará
```

**MÉTRICAS A MONITOREAR:**
- Frecuencia de errores 529
- Tiempo de recuperación
- Agentes afectados

---

## 10. Regla de Refactorizacion por Tamanio de Archivo (CRITICO)

### 10.1 Umbral de 600 Lineas

**REGLA OBLIGATORIA para TODOS los agentes:**
- Cuando un archivo de codigo (`.ts`, `.tsx`, `.js`, `.jsx`) supere las **600 lineas**, DEBE comenzar a refactorizarse en componentes o funciones mas pequenas.
- El objetivo es mantener archivos **maximo de 600 lineas** para facilitar:
  - Lectura y comprension rapida
  - Mantenimiento mas sencillo
  - Reduccion de conflictos en git
  - Mejor testabilidad

### 10.2 Protocolo de Refactorizacion

Cuando un archivo supere las 600 lineas:

1. **Identificar componentes o funciones extractables:**
   - Componentes UI separados (modals, cards, widgets)
   - Funciones de utilidad (helpers, formatters, validators)
   - Constantes o configuraciones estaticas
   - Tipos o interfaces separadas

2. **Crear archivos separados:**
   - `components/` para componentes React
   - `utils/` o `helpers/` para funciones de utilidad
   - `types/` para tipos TypeScript
   - `constants/` para constantes

3. **Mantener el contexto:**
   - NO dividir codigo logicamente relacionado
   - Extraer solo cuando tenga sentido semantico
   - Mantener imports/exportaciones claros

### 10.3 Deteccion de Codigo Muerto

**Al trabajar en cualquier archivo, el agente DEBE:**

1. **Verificar codigo muerto:**
   - Funciones nunca llamadas
   - Variables nunca utilizadas
   - Imports nunca usados
   - Props nunca consumidas
   - Rutas/casos en switch nunca ejecutados

2. **Notificar al usuario:**
   - SIEMPRE informar si encuentra codigo muerto
   - Preguntar antes de eliminar
   - Proporcionar contexto de por que es codigo muerto

3. **Formato de notificacion:**
   ```
   [CODIGO MUERTO DETECTADO]
   Archivo: X
   Lineas: Y-Z
   Tipo: [funcion/variable/import/prop]
   Razon: [por que es codigo muerto]
   Recommendation: [borrar/archivar]
   ```

### 10.4 Excepciones

Archivos que PUEDEN superar las 600 lineas SI tienen alta cohesion logica:
- **Rutas de API** con muchos endpoints relacionados
- **Servicios** con metodos estrechamente relacionados
- **Componentes de paginas** donde dividirlo afectaria la legibilidad
- **Schemas de base de datos**

En estos casos, documentar por que es aceptable exceder el umbral.

---

## 11. Gestion de Habilidades (Skills)

Para asegurar que los agentes no solo lean guias sino que ejecuten tareas con maestria tecnica:

### 11.1 Instalacion de Skills
- **Ubicacion Obligatoria**: Toda nueva Skill debe crearse como un archivo `.md` en `Lookitry_Brain_Vault/Cerebro/Skills/`.
- **Registro Central**: Tras crear el archivo, se DEBE indexar en [[Skills|Lookitry_Brain_Vault/Cerebro/Agentes/Skills.md]].
- **Naming**: Usar `kebab-case` (ej: `marketing-automation.md`). PROHIBIDO emojis en nombres de archivos o dentro de los corchetes de enlaces internos.

### 11.2 Estructura de una Skill
Cada archivo de Skill debe contener:
1. **Identidad**: Que problema resuelve.
2. **Protocolo de Ejecucion**: Pasos exactos que el agente debe seguir.
3. **Indicadores de Exito**: Como saber que la tarea se hizo correctamente.

---

## 12. Notificación de Tareas Completadas

**NOTA: La notificación por Telegram a Sam ha sido deshabilitada por solicitud expresa de Sam.**

Los agentes ya NO necesitan notificar por Telegram cuando completan tareas. Esta regla está obsoleta.

---

**Ultima actualizacion:** 2026-05-17 - Sistema de Agentes v3.1 / pnpm@9.15.9 / Node 22 backend
**Cambios principales:**
- Regla 15.2: Versión pnpm@9.15.9 especificada, compatibilidad Node documentada, configuración shamefully-hoist y workspace
- Regla 1.1: Deploy flags documentados (`--frontend`, `--backend`, `--force`, `--no-cache`)
- Regla 10: Refactorización obligatoria por tamaño de archivo (600 líneas)
- Regla 10.3: Detección y reporte de código muerto obligatorio
- Regla 5.4: Vertex AI primario, OpenRouter solo vía n8n fallback, GROQ eliminado, MobileSAM local documentado

---

## 🔧 VPS PRODUCCIÓN - INFO IMPORTANTE

### Credenciales VPS (Guardadas en backend/.env)
- **VPS IP**: 31.220.18.39
- **SSH**: root@31.220.18.39:22
- **Contraseña**: Travis18456916#

### MCPs Configurados
- **n8n**: https://n8n.wilkiedevs.com (API key en config)
- **VPS SSH**: Usar sshpass para automatización

---

## 13. Regla Anti-Duplicación de Código (OBLIGATORIO)

### 13.1 Verificación Obligatoria ANTES de Crear

**REGLA CRÍTICA para TODOS los agentes:**

ANTES de crear cualquier función, componente, endpoint, hook, servicio o utilidad, el agente DEBE:

1. **Buscar si ya existe:**
   - Buscar por nombre del componente/función
   - Buscar por funcionalidad similar
   - Buscar por endpoint/ruta similar

2. **Si encuentra código existente:**
   ```
   ¿Es IDÉNTICO? → USAR existente, no crear nuevo
   ¿Es SIMILAR? → Comparar, quedarse con la MEJOR implementación
   ¿Es RELATED pero diferente? → Considerar extraer lógica compartida
   ```

3. **Si la nueva implementación es MEJOR:**
   - Borrar código antiguo COMPLETAMENTE
   - Implementar nuevo
   - Verificar todos los imports/calls usen el nuevo
   - Commit: "refactor: replace [old] with improved [new]"

### 13.2 Criterios para "Mejor Implementación"

✅ **MEJOR si:**
- Más eficiente (menos queries, mejor caching)
- Más segura (mejor validación, sanitización)
- Más mantenible (mejor typed, documentado)
- Consistente con el estilo del proyecto

❌ **NO es mejor solo porque:**
- Es más nuevo
- Usa una librería "mejor según internet"
- Es más corto (puede ser menos legible)

### 13.3 Protocolo de Búsqueda

```bash
# Componentes/UI
grep -r "ComponentName" --include="*.tsx"

# Endpoints/API
grep -r "/api/leads" --include="*.ts"

# Servicios/Hooks
grep -r "useWhatsApp\|fetchPublicPaymentSettings" --include="*.ts" --include="*.tsx"
```

### 13.4 Skill Asociada

Ver: `Cerebro/Skills/code-sync-checker.md`

---

## 14. Seguridad Reforzada (Implementada Abril 2026)

### Account Lockout
- **Regla**: 5 intentos fallidos de login = 15 min de bloqueo
- **Campos en brands**: `failed_login_attempts` (contador) y `locked_until` (timestamp)
- **Verificación en login**: Se verifica `locked_until` antes de procesar contraseña

### Login Audit
- **Logging**: Todos los intentos de login (successful/failed) se loguean
- **Admin visible**: Tabla de auditoría en `/admin/login-audit`

### Session Security
- **TTL**: Sesiones reducidas a 7 días
- **Admin Rate Limit**: Rate limit más estricto para endpoints admin
- **Dual JWT**: Soporte de rotación segura con `JWT_SECRET_PREVIOUS` para tokens de acceso y refresh (Arquitectura Dual JWT).

### Cookie Security
- **COOKIE_DOMAIN**: Configurado en producción para cookies HTTP-only
- **Flag**: `COOKIE_DOMAIN` en `.env` del backend

---

## 15. Gestión Segura de Dependencias (MANDATORIO)

**ALERTA DE SEGURIDAD (Mayo 2026):** Se han detectado múltiples ataques de cadena de suministro (Supply Chain Attacks) masivos en el registro oficial de NPM (ataques como *Mini Shai-Hulud* y *PromptMink*). Estos ataques inyectan malware en paquetes populares para robar credenciales, secretos de entorno (.env) y llaves SSH.

### 15.1 Prohibición de NPM Install
- **REGLA DE ORO**: Está **ESTRICTAMENTE PROHIBIDO** ejecutar `npm install` o `npm update` en cualquier parte del proyecto (local, VPS o agentes).
- **Razón**: El cliente oficial de NPM es actualmente vulnerable a la ejecución de scripts maliciosos en la fase de pre-instalación que han comprometido a más de 25,000 repositorios.

### 15.2 Uso Obligatorio de PNPM

- Para toda gestión de paquetes, se debe usar **`pnpm`**.
- **Versión obligatoria**: `pnpm@9.15.9`
  - **Razón**: pnpm@11 requiere Node ≥22.13. El backend Docker usa Node 22 pero pnpm@9.15.9 es más estable y compatible con ambos Node 20 (frontend) y Node 22 (backend).
  - **Instalación en Docker**: `corepack enable && corepack prepare pnpm@9.15.9 --activate` (NO usar `npm install -g pnpm`)
- **Comandos permitidos**:
  - `pnpm install`
  - `pnpm add [package]`
  - `pnpm dev`
- **Bloqueo**: Si un agente intenta usar `npm install`, Sammantha o el Orquestador deben detener la operación inmediatamente.

**Configuración pnpm en el proyecto:**
- `shamefully-hoist=true` en `frontend/.npmrc` y `backend/.npmrc` — aplana node_modules para TypeScript
- `pnpm-workspace.yaml` en ambos proyectos DEBE incluir `packages: ['.']`
- Lockfiles (`pnpm-lock.yaml`) deben estar trackeados en git en ambos proyectos

**Compatibilidad Node / Docker:**
- **Frontend Docker**: `node:20-alpine` — pnpm@9.15.9 ✓
- **Backend Docker**: `node:22-alpine` — requerido por `@supabase/realtime-js@2.105.4` (necesita `globalThis.WebSocket` nativo)

### 15.3 Auditoría de Seguridad
- Antes de agregar cualquier librería nueva, se debe verificar en [Socket.dev](https://socket.dev) o herramientas similares para asegurar que no tenga comportamientos sospechosos (telemetría oculta, acceso a red no declarado).
