---
inclusion: always
---

# Reglas de Implementación — Lookitry
**RESPONDE SIEMPRE EN ESPAÑOL**

> Este archivo contiene las reglas operativas que la IA debe seguir al trabajar en el proyecto.
> Para contexto del proyecto, ver: `docs/PRD.md`, `docs/DESIGN.md`, `docs/TECH_STACK.md`.

---

## 1. Reglas de Git

- **NO hacer commits ni push** sin que el usuario lo pida explícitamente
- **NO hacer deploy** sin autorización explícita del usuario

### 1.1 Deploy

- **SIEMPRE usar el script `_deploy_now.py`**Located in `C:\Users\Matt\Lookitry\scripts\_deploy_now.py`
- **NUNCA usar GitHub Actions CI/CD** para deploys
- Para ejecutar: `python _deploy_now.py` desde la carpeta `scripts/` o usar `--force` para forzar rebuild

---

## 2. Registro de Cambios (Changelog)

Cada vez que se realice cualquier cambio en el código, la IA DEBE documentarlo en `CHANGELOG_GEMINI.md` antes de terminar la tarea. Cada entrada debe incluir:
- Fecha
- Descripción del cambio
- Archivos modificados
- Motivo o contexto del cambio

**Sin actualizar el changelog, la tarea no está completa.**

---

## 3. Pendientes

Al iniciar cada tarea, la IA debe leer `pendientes_por_hacer.md` si existe. Si durante una tarea se deja una deuda técnica, seguimiento o limpieza pendiente, debe registrarse ahí.

---

## 4. Reglas de Diseño

>参考: `docs/DESIGN.md`

- Colores: `#FF5C3A` naranja, `#0a0a0a` negro base, `#141414` cards
- Tipografía: Plus Jakarta Sans (títulos), DM Sans (cuerpo)
- Texto mínimo: `#999` secundario, `#bbb` features — PROHIBIDO `#333`–`#555`
- Sin emojis en UI — solo SVG / lucide-react
- Toggle activo: `#FF5C3A` (nunca `bg-blue-600`)
- Logo: siempre SVG + texto `Look<span className="text-[#FF5C3A]">itry</span>`
- Accesibilidad: botones de mostrar/ocultar contraseña deben ser focusables y llevar `aria-label`

---

## 5. 🛡️ Blindaje de Ingeniería

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

---

## 6. Reglas de Base de Datos

>参考: `docs/TECH_STACK.md`

- Backend SIEMPRE usa `supabaseAdmin` (service role) — bypasea RLS completamente
- El backend usa JWT propio, NO Supabase Auth
- El cliente `supabase` anon NUNCA tiene sesión activa — RLS bloquea todo

---

## 7. Reglas de n8n

- **PROHIBIDO crear nuevos workflows** en n8n a menos que el usuario lo apruebe explícitamente
- **SOLO usar workflows existentes** que contengan la etiqueta `SaaS`

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

##不走

**Última actualización:** Abril 2026