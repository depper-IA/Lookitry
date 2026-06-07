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

**AL INICIAR CADA CONVERSACIÓN:**
1. Leer SIEMPRE `Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md` (este archivo)
2. Leer `memory/YYYY-MM-DD.md` (hoy y ayer) para contexto reciente
3. Si es sesión principal, leer `MEMORY.md` para memoria de largo plazo
4. Solo después proceder con la conversación

**RAZÓN**: Evitar perder tiempo preguntando cosas que ya están documentadas

---

## 0. Documentacion Viva (Regla de Sincronicidad)

**TODA VEZ que se realicen cambios estructurales en la arquitectura, componentes base, o diseño, es OBLIGATORIO:**
1. **Usar el agente docs-writter (Lina)** para documentar los cambios y mantener actualizados los archivos: [[REGLAS_IMPORTANTES]] y [[ARCHITECTURE_OVERVIEW]]
2. Estos documentos deben reflejar inmediatamente la realidad del sistema. Los documentos nunca deben quedar obsoletos.

**REGLA DE ORO: NO ELIMINAR informacion tecnica que siga siendo valida o funcional (versiones de librerias, estructuras de carpetas, reglas previas). Solo se debe incluir la informacion que falta o se actualiza, manteniendo el historial y contexto previo.**

## 1. Reglas de Git

- **Auto-commit**: DESPUÉS de cada tarea significativa, hacer commit automáticamente con mensaje descriptivo (conventional commits: `feat:`, `fix:`, `docs:`, etc.)
- **Auto-push**: NO hacer push automático. Hacer push solo cuando el código compila y tests pasan, o por autorización del usuario.
- **NO hacer deploy** sin autorizacion explícita del usuario

### 1.1 Deploy

- **SIEMPRE usar el script _deploy_now.py** Located in `scripts/tools/_deploy_now.py` (raíz del proyecto: `/home/travis/Lookitry/Lookitry/scripts/tools/_deploy_now.py`)
- **NUNCA usar GitHub Actions CI/CD** para deploys
- Para ejecutar: `python3 scripts/tools/_deploy_now.py` desde la raíz del proyecto

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
4. **Ejecutar deploy** con `python scripts/tools/_deploy_now.py --force`
5. **Verificar** que el health check devuelve 200 y los endpoints funcionan
6. **Si hay errores**, diagnosticar y arreglar antes de reportar exito

### 1.2b Deploys Rápidos y Quirúrgicos (Sin timeouts en VPS de recursos limitados)

**PROBLEMA:** Las compilaciones de Next.js (frontend) o pnpm install completas son muy pesadas y pueden provocar que el script de deploy `_deploy_now.py` alcance el timeout o sature la CPU/RAM del VPS, dejando la página de mantenimiento activa por error.

**SOLUCIÓN / PROTOCOLO MANDATORIO PARA DEPLOYS SIMPLES:**

1. **Sincronización por Git:**
   - Realizar `git push` desde el entorno local.
   - En el VPS, entrar a `/root/virtual-tryon` y correr `git pull` para actualizar el código sin compilar.

2. **Reconstrucción quirúrgica:**
   - **Solo Backend (cambios en Express/API):**
     ```bash
     # En el VPS (/root/virtual-tryon)
     docker compose -f docker-compose.backend.yml build
     docker compose -f docker-compose.backend.yml up -d
     ```
   - **Solo Frontend (cambios menores en React/Next.js):**
     ```bash
     # En el VPS (/root/virtual-tryon)
     docker compose -f docker-compose.frontend.yml build
     docker compose -f docker-compose.frontend.yml up -d
     ```
   - **Solo SAM (cambios de endpoints en Python):**
     ```bash
     # En el VPS (/root/virtual-tryon)
     docker build -t virtual-tryon-sam-local sam-service/
     docker stop lookitry-sam-local && docker rm lookitry-sam-local
     docker run -d --name lookitry-sam-local --network proxy --restart unless-stopped virtual-tryon-sam-local
     ```

3. **Verificación post-deploy:**
   - Correr `docker ps` para confirmar que los contenedores estén `healthy`.
   - Si la página de mantenimiento quedó arriba por error, bajarla con:
     ```bash
     docker compose -f docker-compose.errors.yml down
     ```

---

## 1.3 Generación de Imágenes con Vertex AI

**Script:** `scripts/tools/generate_image.py`
**Modelo:** Vertex AI Imagen 3 (`imagen-3.0-generate-002`)
**Key:** `backend/secrets/vertex-key.json` (service account, NO commitear)

### Uso básico

```bash
python3 scripts/tools/generate_image.py "descripción de la imagen" \
  --out frontend/public/carpeta/nombre.webp \
  --aspect 4:3
```

- La ruta `--out` puede ser relativa al proyecto o absoluta. Se crea el directorio automáticamente.
- Funciona desde cualquier directorio.

### Relación de aspecto → tamaño generado

| Flag `--aspect` | Resolución | Cuándo usarlo |
|-----------------|-----------|----------------|
| `1:1`  | 1024×1024 | Avatar, card cuadrada |
| `16:9` | 1408×768  | Hero banner, video thumbnail |
| `9:16` | 768×1408  | Mobile, story, vertical card |
| `4:3`  | 1280×960  | Megamenu card, blog cover |
| `3:4`  | 960×1280  | Product card, póster |

**Elegir el aspecto según el contenedor donde va la imagen**, no al revés.

### Flags disponibles

| Flag | Default | Descripción |
|------|---------|-------------|
| `--aspect` | `1:1` | Relación de aspecto (ver tabla arriba) |
| `--count` | `1` | Variantes a generar (1–4). Sufijo `_0`, `_1`... |
| `--quality` | `90` | Calidad de compresión WebP/JPEG (1–100) |
| `--no-brand` | — | Omite el sufijo de estilo de marca del prompt |

### Ejemplos por caso de uso

```bash
# Megamenu card (4:3, 1280×960)
python3 scripts/tools/generate_image.py \
  "Latin American woman trying on clothes virtually using AI" \
  --out frontend/public/megamenu/demo.webp --aspect 4:3

# Hero banner (16:9, 1408×768)
python3 scripts/tools/generate_image.py \
  "Fashion e-commerce hero, warm orange tones, Colombian brand" \
  --out frontend/public/hero/nueva-imagen.webp --aspect 16:9

# Product card (3:4, 960×1280) — 4 variantes
python3 scripts/tools/generate_image.py \
  "White sneaker on clean background, product photography" \
  --out frontend/public/products/sneaker.webp --aspect 3:4 --count 4

# Sin sufijo de marca (fotografía técnica, UI, etc.)
python3 scripts/tools/generate_image.py \
  "Abstract dark tech background, orange glow" \
  --out frontend/public/bg/tech.webp --aspect 16:9 --no-brand
```

### Regla de uso

- **Siempre especificar `--aspect` según el contenedor** donde va la imagen.
- Imágenes generadas van en `frontend/public/` bajo una carpeta temática (`megamenu/`, `hero/`, `products/`, etc.).
- Revisar visualmente el resultado antes de usarlo en producción.

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
- **Vertex AI (GCP)**: Pipeline PRIMARIO de Try-On. Usa Gemini 2.5 Flash Image (Nano Banana, `gemini-2.5-flash-image`) vía Vertex AI. TODA generación de Try-On pasa por aquí.
- **MobileSAM (Python/FastAPI)**: Servicio LOCAL para generación de máscaras antes del pipeline Try-On. Corre en Docker. PROHIBIDO reemplazar por llamada externa sin autorización explícita.
- **n8n (fallback)**: pipeline de respaldo cuando Vertex AI falla o está deshabilitado (`VERTEX_AI_ENABLED=false`). PROHIBIDO reintroducir OpenRouter en el backend — la integración directa fue eliminada (ver commits `2bb94eb6`, `e281c8a8`).
- **GROQ**: Solo como `small_model` fallback de emergencia. No usar para requests normales.

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
- Regla 5.4: Vertex AI primario, OpenRouter solo vía n8n fallback, GROQ fallback, MobileSAM local documentado

---

## 🔧 VPS PRODUCCIÓN - INFO IMPORTANTE

### Credenciales VPS
Las credenciales del VPS (IP, SSH, contraseña) están en `backend/.env` (que está en .gitignore y NO se commitea). Consultar con Sam Wilkie para acceso.

> ⚠️ **NOTA**: No documentar credenciales reales en ningún archivo del repositorio público.

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

---

## 16. Supabase API — Acceso y Reglas (CRÍTICO)

### 16.1 Credenciales Disponibles

| Variable | Valor |
|----------|-------|
| `SUPABASE_URL` | `https://vkdooutklowctuudjnkl.supabase.co` |
| `SUPABASE_ANON_KEY` | Disponible en `.env` del backend |
| `SUPABASE_SERVICE_KEY` | Disponible en `.env` del backend (service role) |

### 16.2 Acceso Programático

```typescript
import { createClient } from '@supabase/supabase-js';

// Cliente público (solo lectura en tablas públicas)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Cliente admin (service role — acceso total)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
```

### 16.3 Reglas de Uso

| Operación | Cliente | Requiere autorización? |
|-----------|---------|------------------------|
| SELECT en tablas públicas | `supabase` | No |
| SELECT en tablas privadas | `supabase` | JWT |
| INSERT/UPDATE/DELETE | `supabaseAdmin` | Service key |
| queries de analytics/admin | `supabaseAdmin` | Service key |

### 16.4 Tablas Principales de Lookitry

```
brands                    — marcas registradas
lookitry_knowledge        — base de conocimiento de Rebecca
rebecca_message_ratings    — ratings de feedback de Rebecca
sales_patterns            — patrones de conversación
pricing_config            — configuración de precios
subscriptions             — suscripciones de marcas
generations              — generaciones de Try-On
```

### 16.5 Queries Comunes

```typescript
// Obtener configuración de precios
const { data } = await supabaseAdmin
  .from('pricing_config')
  .select('*')
  .eq('is_active', true)
  .order('monthly_price_cop', { ascending: true });

// Obtener ratings sin revisar
const { data } = await supabaseAdmin
  .from('rebecca_message_ratings')
  .select('*')
  .eq('admin_reviewed', false)
  .order('created_at', { ascending: false })
  .limit(50);

// Actualizar rating como revisado
await supabaseAdmin
  .from('rebecca_message_ratings')
  .update({ admin_reviewed: true, admin_notes: '...' })
  .eq('id', ratingId);
```

### 16.6 Regla de Oro

**PROHIBIDO ejecutar operaciones destructivas (DELETE, DROP, TRUNCATE) en producción sin autorización explícita de Travis.**

---
