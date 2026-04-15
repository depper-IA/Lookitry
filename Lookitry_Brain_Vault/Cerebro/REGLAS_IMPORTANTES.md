---
inclusion: always
---

# Reglas de Implementacion - Lookitry
**RESPONDE SIEMPRE EN ESPANOL**

> ### Navegacion del Cerebro
> - Volver al [[MAPA_MAESTRO|Mapa Maestro de Conocimiento]]
> - Consultar Roles de [[AGENTS|Agentes del Equipo]]
> - Ver Estado de Producto en [[PRD]]

---

## 0. Documentacion Viva (Regla de Sincronicidad)

**TODA VEZ que se realicen cambios estructurales en la arquitectura, componentes base, o diseño, es OBLIGATORIO:**
1. **Usar el agente docs-writter (Lina)** para documentar los cambios y mantener actualizados los archivos: [[PRD]], [[DESIGN]], [[TECH_STACK]] y [[REGLAS_IMPORTANTES]]
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

- **SIEMPRE usar el script _deploy_now.py** Located in `C:\Users\Matt\Lookitry\scripts\_deploy_now.py`
- **NUNCA usar GitHub Actions CI/CD** para deploys
- Para ejecutar: `python _deploy_now.py` desde la carpeta `scripts/` o usar `--force` para forzar rebuild

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

## 3. Sistema de Agentes IA (Actualizado 2026-04-14)

### 3.1 Modelo Default

```yaml
modelo_default: "minimax/MiniMax-M2.7"

regla: "Todos los agentes usan este modelo por defecto"
excepcion: "Solo usar otro modelo si AGENTS.md lo especifica explícitamente"
```

**AVISO**: Groq y DeepSeek han sido **REMOVIDOS** de todos los systemPromptOverride. Ya no deben aparecer en ningún prompt de agente.

### 3.2 Equipo Completo de Agentes

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
| **Rebecca** | rebecca | UGC Creator + Embajadora | MiniMax-M2.7 |
| **Leo** | leo | Agente de Trading | MiniMax-M2.7 |

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
@Rebecca [tarea] — UGC / contenido
@Becca [tarea] — Alias para Rebecca
@Leo [tarea] — Trading
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
rebecca + leo:
  - "Generar ingresos para Lookitry"
  - "Rebecca: leads, clientes, contenido UGC"
  - "Leo: trading automatizado"
  
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
- Sin emojis en UI - solo SVG / lucide-react
- Toggle activo: `#FF5C3A` (nunca `bg-blue-600`)
- Logo: siempre SVG + texto `Look<span className="text-[#FF5C3A]">itry</span>`
- Accesibilidad: botones de mostrar/ocultar contrasena deben ser focusables y llevar `aria-label`

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

### 5.3 Robustez de Backend
- Usar bloques try-catch granulares
- Usar maybeSingle() o validaciones manuales en lugar de .single()

### 5.4 Gestion de APIs de IA
- **GROQ**: API oficial directa, NO via OpenRouter
- **OpenRouter**: Exclusivo para GENERACION DE IMAGENES del WIDGET (Try-On). PROHIBIDO usar sus creditos para otras tareas.

---

## 10. Gestion de Habilidades (Skills)

Para asegurar que los agentes no solo lean guias sino que ejecuten tareas con maestria tecnica:

### 10.1 Instalacion de Skills
- **Ubicacion Obligatoria**: Toda nueva Skill debe crearse como un archivo `.md` en `Lookitry_Brain_Vault/Cerebro/Skills/`.
- **Registro Central**: Tras crear el archivo, se DEBE indexar en [[Skills|Lookitry_Brain_Vault/Cerebro/Agentes/Skills.md]].
- **Naming**: Usar `kebab-case` (ej: `marketing-automation.md`). PROHIBIDO emojis en nombres de archivos o dentro de los corchetes de enlaces internos.

### 10.2 Estructura de una Skill
Cada archivo de Skill debe contener:
1. **Identidad**: Que problema resuelve.
2. **Protocolo de Ejecucion**: Pasos exactos que el agente debe seguir.
3. **Indicadores de Exito**: Como saber que la tarea se hizo correctamente.

---

## 11. Reglas Específicas de Rebecca (UGC Creator)

### 11.1 Objetivo: MONEY
Rebecca y Leo son el **motor de ingresos** de Lookitry:
- Rebecca genera leads y clientes (Fiverr + Lookitry)
- Leo hace trading
- JUNTOS hacen dinero para el proyecto

### 11.2 Herramientas Gratuitas para Contenido
- Video: CapCut, DaVinci Resolve (gratis)
- Audio: Audacity, Freesound.org (gratis)
- Imagen: Canva, Pexels, Pixabay (gratis)
- AI: ChatGPT/Gemini (gratuitos)

### 11.3 Patrocinio (SOLO Grants)
**PERMITE**:
- Angel investors (dinero, NO equity)
- Grants: Google for Startups, AWS Activate
- Incubadoras sin equity
- Awards y competitions

**PROHÍBE (absoluto)**:
- ❌ CEDER % DE SOCIEDAD
- ❌ COMPARTIR PROPIEDAD INTELECTUAL
- ❌ VENDER PARTES DE LOOKITRY
- ❌ ACUERDOS CON CONTROL COMPARTIDO
- ❌ INVERSORES CON PODER DE VETO

---

**Ultima actualizacion:** Abril 2026 - Sistema de Agentes v2.0
**Cambios principales:**
- 10 agentes con nombres nuevos
- Modelo default: MiniMax-M2.7 (Groq/DeepSeek removidos)
- Rebecca v3.0 con foco en MONEY
- Melissa como colaboradora de Pixel
- Leo como agente de trading