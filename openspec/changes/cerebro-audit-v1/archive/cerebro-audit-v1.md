# SDD: Auditoría Integral del Cerebro — LOOKITRY

**Change:** cerebro-audit-v1
**Status:** ✅ ARCHIVED
**Completed:** 2026-05-23
**Archived:** 2026-05-23  

---

## 1. Contexto y Problema

El Cerebro (`Lookitry_Brain_Vault/Cerebro/`) es la fuente de verdad del proyecto.  
Con el tiempo, varios documentos quedaron desactualizados:
- Rutas de scripts migradas a `scripts/tools/` (ya corregido)
- Nombres de agentes (Sammantha/Pixel/Kira = sammy/webwizard/devguardian)
- Groq aún en config pero dice "eliminado"
- sammantha_voice en docs pero no se usa
- VPS IP expuesta públicamente
- Auto-push peligroso (no enforced pero documentado)

**Regla**: Solo verificar contra código real. No asumir que specs/docs están actualizados.

---

## 2. Scope de la Auditoría

### Archivos a auditar (divididos en 3 workers)

**Worker A — REGLAS_IMPORTANTES.md** (689 líneas)
- Auto-commit/auto-push → ¿peligroso o implementado?
- sammantha_voice → ¿legacy o usado?
- Telegram → ¿deshabilitado en código también?
- Groq → ¿eliminado o sigue en opencode.json?
- VPS credentials → ¿IP expuesta?
- Nombres de agentes → ¿consistencia?

**Worker B — TECH_STACK.md** (493 líneas)
- Versiones de librerías → verificar vs package.json
- URLs de producción → verificar vs docker-compose y next.config.js
- Contenedores Docker → verificar vs docker-compose*.yml
- Workflow IDs de n8n → verificar que coincidan con el código
- Estructura del proyecto → verificar carpetas reales

**Worker C — AGENTS_CONFIG_MASTER.md + docs de Agentes**
- Verificar que la tabla de delegación sea correcta
- Verificar que cada agente tenga su nombre técnico y humano
- Verificar Mission Control (¿eliminado?)
- Verificar que no haya docs huérfanas o duplicadas

---

## 3. Instrucciones para Sub-agents

### Para cada claim en el documento:
1. Buscar en código fuente la evidencia
2. Comparar claim vs realidad
3. Clasificar: ✅ VERIFICADO / ⚠️ DISCREPANCIA / 🔴 CRÍTICO / 🔵 INFO

### Archivos de referencia (verificar contra estos):
```
frontend/package.json          → versiones FE
backend/package.json           → versiones BE
backend/src/config/plans.ts    → planes BE
frontend/src/lib/pricing.ts    → planes FE (pricing dinámico)
opencode.json                  → configs de agentes
docker-compose.backend.yml     → contenedores backend
docker-compose.frontend.yml    → contenedores frontend
frontend/next.config.js        → remote patterns, URLs
frontend/src/app/globals.css    → colores
backend/src/routes/            → lista de rutas
```

### Output por cada archivo auditado:
```
## <nombre_archivo>

### ✅ VERIFICADO
- claim: evidencia en código

### ⚠️ DISCREPANCIA  
- claim: código dice X, doc dice Y → decisión: ¿actualizar doc o código?

### 🔴 CRÍTICO
- claim: contradice código / expone credenciales → acción requerida

### 🔵 INFO
- contexto adicional útil
```

---

## 4. Acciones de Corrección Pendientes (pre-aprobadas por Travis)

Si el sub-agent encuentra algo que ya sabemos que está mal (verificado arriba):
- Remover sección sammantha_voice de REGLAS_IMPORTANTES.md
- Actualizar regla de Groq para aclarar estado real (eliminado de uso directo, aún en config como fallback)
- Sanitizar VPS credentials (la IP ya es pública de todos modos, pero password no debe estar)

---

## 5. artifact_keys
- `sdd/cerebro-audit-v1/spec` — este spec
- `sdd/cerebro-audit-v1/worker-a-results` — REGLAS_IMPORTANTES.md audit
- `sdd/cerebro-audit-v1/worker-b-results` — TECH_STACK.md audit
- `sdd/cerebro-audit-v1/worker-c-results` — AGENTS audit
- `sdd/cerebro-audit-v1/apply` — correcciones aplicadas