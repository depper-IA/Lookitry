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
1. **Usar el agente docs-writter** para documentar los cambios y mantener actualizados los archivos: [[PRD]], [[DESIGN]], [[TECH_STACK]] y [[REGLAS_IMPORTANTES]]
2. Estos documentos deben reflejar inmediatamente la realidad del sistema. Los documentos nunca deben quedar obsoletos.

**REGLA DE ORO: NO ELIMINAR informacion tecnica que siga siendo valida o funcional (versiones de librerias, estructuras de carpetas, reglas previas). Solo se debe incluir la informacion que falta o se actualiza, manteniendo el historial y contexto previo.**

---

## 1. Reglas de Git

- **NO hacer commits ni push** sin que el usuario lo pida explicitamente
- **NO hacer deploy** sin autorizacion explicita del usuario

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

## 10. Sistema de Agentes IA

| Agente | Archivo | Responsabilidad |
|--------|---------|----------------|
| Sammy | [[sammy]] | Orquestador |
| WebWizard | [[webwizard]] | Frontend y UX |
| DevGuardian | [[devguardian]] | Calidad y Seguridad |
| DataAlchemist | [[dataalchemist]] | DB y n8n |
| GrowthPilot | [[growthpilot]] | CRM y Marketing |
| ArchitectAI | [[architectai]] | Infra y Deploy |

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
**Ultima actualizacion:** Abril 2026 - Sistema de Skills formalizado.
