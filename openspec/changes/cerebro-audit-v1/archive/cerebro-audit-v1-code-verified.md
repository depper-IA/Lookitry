# SDD: Auditoría Integral del Cerebro — RESULTADOS VERIFICADOS CONTRA CÓDIGO

**Change:** cerebro-audit-v1
**Status:** apply-pending
**Code-verified:** 2026-05-23

---

## Método

Para cada claim en los documentos del Cerebro, verificamos contra el código fuente real. No asumimos que los specs o docs están actualizados — verificamos directamente.

---

## 🔴 Hallazgos CRÍTICOS

### C1: sammantha_voice.sh — REFERENCIADO EN DOCS PERO NO USADO EN FRONTEND

**Doc (REGLAS_IMPORTANTES.md línea 307-311):**
```yaml
sammantha_voice:
  motor: "Gemini 2.5 Flash TTS"
  ubicacion: "/home/travis/Lookitry/Lookitry/backend/scripts/sammantha_voice.sh"
  regla: "Solo generar audio cuando Sam ENVÍA audio primero O lo pide explícitamente"
  estado: "/home/travis/Lookitry/Lookitry/backend/.tts_state"
```

**Verificación en código:**
```bash
grep -rn "sammantha_voice\|TTS.*voice\|voice.*TTS" frontend/src/ --include="*.tsx"
# NO HAY RESULTADOS — el frontend NO usa sammantha_voice
```

**Archivo existe:** `backend/scripts/sammantha_voice.sh` — existe, pero el frontend no lo llama.

**Veredicto:** La sección sammantha_voice en REGLAS_IMPORTANTES.md es código legacy/muerto. El widget de Rebecca usa su propio TTS (MiniMax). La documentación confunde/wrongly attribute.

**Acción:** Remover la sección sammantha_voice de REGLAS_IMPORTANTES.md o marcarla como "historico/no usado por frontend".

---

### C2: Auto-commit/Auto-push — PELIGROSO según código

**Doc (REGLAS_IMPORTANTES.md línea 36-37):**
```
- **Auto-commit**: DESPUÉS de cada tarea significativa, hacer commit automáticamente
- **Auto-push**: Hacer push después de cada commit exitoso
```

**Verificación en código (opencode.json):**
```bash
grep -n "autoCommit\|autoPush\|auto-commit\|auto-push" opencode.json
# NO HAY RESULTADOS — opencode.json NO implementa auto-commit/auto-push
```

**Veredicto:** La regla existe en docs pero NO está implementada en opencode.json. Es solo una guía de agentes (que pueden o no seguir). Sin embargo, sigue siendo peligrosa si alguien la implementa.

**Acción:** Mantener la regla de commit automático, pero:
1. El push debe requerir que lint/tests pasen
2. O marcar como "guideline, not enforced"

---

### C3: Groq — ELIMINADO del proyecto según docs, PERO opencode.json aún lo tiene

**Doc (REGLAS_IMPORTANTES.md línea 354):**
```
- **GROQ**: ~~API directa~~ → **ELIMINADO del proyecto**. No referenciar ni reinstalar.
```

**Verificación en código (opencode.json):**
```json
"groq": {
  "options": {
    "timeout": 120000,
    "apiKey": "***REMOVED-SECRET***"
  }
}
```

**Veredicto:** GROQ sigue en opencode.json como provider. La docs-writter dijo "eliminado" pero el código aún lo tiene. El small_model de fallback es `groq/llama-3.3-70b-versatile`.

**Acción:** Actualizar REGLAS_IMPORTANTES.md para decir "GROQ solo para fallback emergency, no para uso regular" O verificar con Travis si de verdad se eliminó.

---

## 🟡 Hallazgos ALTOS

### A1: Precios de planes — VERIFICADOS vs código

| Plan | Doc dice | Código dice | Status |
|------|----------|-------------|--------|
| TRIAL | $20.000 COP | `plans.ts: price: 20000` | ✅ CORRECTO |
| BASIC | $180.000 COP/mes | `frontend/src/lib/pricing.ts: precio_mensual_cop: 180000` | ✅ CORRECTO |
| PRO | $350.000 COP/mes | `frontend/src/lib/pricing.ts: precio_mensual_cop: 350000` | ✅ CORRECTO |
| ENTERPRISE | $800.000 COP/mes | `EnterpriseCalculator.tsx: const BASE_PRICE = 800000` | ✅ CORRECTO |
| Trial generaciones | 50 (PRD) vs 15 (plans.ts) | `plans.ts: maxGenerationsPerMonth: 15` | ⚠️ DISCREPANCIA |
| PRO generaciones | 1.000 (PRD) vs 1.200 (PRD note) | `frontend pricing.ts: generaciones_mensuales: 1000` | ⚠️ DISCREPANCIA INTERNA |

**Veredicto:** Los precios base son correctos. Las generaciones tienen discrepancia entre docs — el PRD mismo nota "valores de generaciones del plan PRO pueden variar entre pricing_config (1.200) y plans.ts (1.000). La fuente de verdad es pricing_config de Supabase."

---

### A2: Versiones de librerías — VERIFICADAS vs código

| Librería | Doc dice (TECH_STACK.md) | Código (package.json) | Status |
|----------|--------------------------|----------------------|--------|
| next | 14.2.35 | `"next": "^14.2.35"` | ✅ CORRECTO |
| react | 18.3.1 | `"react": "^18.3.1"` | ✅ CORRECTO |
| tailwindcss | 3.4.0 | `"tailwindcss": "^3.4.0"` | ✅ CORRECTO |
| typescript | 5.9.3 | `"typescript": "5.9.3"` | ✅ CORRECTO |
| express | 4.18.2 | `"express": "^4.18.2"` | ✅ CORRECTO |

**Veredicto:** Todas las versiones en TECH_STACK.md son correctas.

---

### A3: Mission Control — ELIMINADO según docs y código

**Doc (AGENTS_CONFIG_MASTER.md):**
```
### Sistema Mission Control ELIMINADO
- El dashboard Mission Control fue removido del código (commit 7ee0317)
```

**Verificación en código:**
```bash
find frontend/src -name "*mission-control*" -o -name "*mission_control*"
# NO HAY RESULTADOS — no existe
```

**Veredicto:** ✅ CORRECTO — Mission Control fue eliminado. La documentación está actualizada.

---

### A4: Agent names — CONSISTENCIA

**Doc (REGLAS_IMPORTANTES.md):** Usa nombres "humanos" (Sammantha, Pixel, Kira, etc.)
**opencode.json:** Usa nombres técnicos (sammy, webwizard, devguardian, etc.)

**Verificación en código:**
```bash
grep -rn "Sammantha\|Pixel\|Kira\|Nadia\|Marlo\|Zephyr\|Lina\|Cipher" frontend/src/ backend/src/
# Resultados solo en archivos de servicio/docs, NO en lógica de negocio
```

**Veredicto:** Los nombres "humanos" son aliases/documentación. Los nombres técnicos son los reales para invocación. ✅ CONSISTENTE.

---

### A5: Telegram — DESHABILITADO según docs, PERO el MCP sigue habilitado

**Doc (REGLAS_IMPORTANTES.md línea 474-476):**
```
**NOTA: La notificación por Telegram a Sam ha sido deshabilitada por solicitud expresa de Sam.**
Los agentes ya NO necesitan notificar por Telegram cuando completan tareas.
```

**Verificación en código (opencode.json):**
```json
"telegram": {
  "type": "local",
  "command": [...],
  "enabled": false,  // <-- DESHABILITADO
  "environment": {
    "TELEGRAM_BOT_TOKEN": "...",
    "TELEGRAM_CHAT_ID": "..."
  }
}
```

**Veredicto:** ✅ CORRECTO — Telegram MCP está deshabilitado en opencode.json. La documentación es consistente con el código.

---

### A6: Colores del diseño — VERIFICADOS vs código

**Doc (DESIGN.md y REGLAS_IMPORTANTES.md):**
```
--color-accent: #FF5C3A
--text-primary: #0a0a0a / #f5f2ee
--background: #141414
```

**Verificación en código (frontend/src/app/globals.css):**
```css
--color-accent: #FF5C3A;  ✅
--accent: var(--color-accent);
--text-primary: #0a0a0a; ✅
--text-primary: #f5f2ee;  ✅
```

**Veredicto:** ✅ CORRECTO

---

### A7: Rutas de scripts — VERIFICADAS

**Doc (REGLAS_IMPORTANTES.md línea 65-66):**
```
- **SIEMPRE usar el script _deploy_now.py** Located in `scripts/tools/_deploy_now.py`
- Para ejecutar: `python3 scripts/tools/_deploy_now.py` desde la raíz del proyecto
```

**Verificación:**
```bash
ls scripts/tools/_deploy_now.py  # ✅ EXISTE
grep -r "scripts/_deploy_now.py" Lookitry_Brain_Vault/ --include="*.md" | grep -v "scripts/tools"
# NO HAY resultados — todas las referencias ya apuntan a scripts/tools/
```

**Veredicto:** ✅ CORRECTO — Las rutas están actualizadas.

---

### A8: VPS credentials — PARCIALMENTE sanitizado

**Doc (REGLAS_IMPORTANTES.md línea 490-499):**
```
## 🔧 VPS PRODUCCIÓN - INFO IMPORTANTE
### Credenciales VPS (Guardadas en backend/.env)
- **VPS IP**: 31.220.18.39
- **SSH**: root@31.220.18.39:22
```

**Veredicto:** La IP del VPS está expuesta. La contraseña se indica que está en backend/.env (que está en .gitignore). ⚠️ La IP pública del servidor productivo no debería estar en un repo público.

**Acción:** Mover la sección VPS a un archivo privado o remover la IP.

---

### A9: Flujos IA (n8n webhooks IDs) — VERIFICAR vs código

**Doc (TECH_STACK.md):**
```
| Try-On | /webhook/tryon | wPLypk7KhBcFLicX |
| Descriptor | /webhook/descriptor | ZjVTV3QxoPEi60GX |
```

**Verificación en código:**
```bash
grep -r "wPLypk7KhBcFLicX\|ZjVTV3QxoPEi60GX" backend/src/ --include="*.ts"
# NO HAY RESULTADOS — no referenciado en código backend
```

**Veredicto:** Los webhook IDs de n8n no están hardcodeados en el backend. El backend usa variables de entorno (`N8N_WEBHOOK_URL`). La documentación de IDs de n8n es para referencia de n8n, no del backend.

---

### A10: Chat WhatsApp y Leads públicos — VERIFICADOS vs código

**Doc (PRD.md sección 3.11 y 3.14):**
- Chat WhatsApp con YCloud → existe
- Leads públicos → existe

**Verificación en código:**
```bash
ls backend/src/routes/chat.routes.ts        # ✅ EXISTE
ls backend/src/routes/leadsPublic.routes.ts # ✅ EXISTE
ls frontend/src/app/plugin-woocommerce/     # ✅ EXISTE
```

**Veredicto:** ✅ CORRECTO — todas las features documentadas existen en el código.

---

## 🟢 Hallazgos VERDE (Verificados correctos)

1. **Stack tecnológico** — ✅ Todas las versiones coinciden
2. **Urls de producción** — ✅ Verificadas contra docker-compose y next.config.js
3. **Contenedores Docker** — ✅ Verificados (lookitry-backend, lookitry-frontend)
4. **Modelo default de agentes** — ✅ MiniMax-M2.7 en todos lados
5. **GROQ eliminado (de uso directo)** — ⚠️ El provider sigue en config pero disabled como default
6. **Auto-commit/auto-push** — ⚠️ Doc dice que existe pero código no lo enforce
7. **sammantha_voice** — 🔴 legacy, no usado

---

## 📋 Acciones Requeridas

### Inmediatas (puedo hacer sin preguntar)

1. **Remover sección sammantha_voice de REGLAS_IMPORTANTES.md** — es legacy, no usado
2. **Actualizar regla de Groq** — dice "eliminado" pero el provider sigue en opencode.json. Aclarar el estado real.

### Requieren confirmación del usuario

1. **VPS IP** — ¿Está bien que esté en el repo público? ¿Mover a archivo privado?
2. **Auto-push** — ¿Mantener como está o改为 solo commit automático?
3. **GROQ** — ¿Realmente se eliminó o es solo para fallback?

---

## artifact_keys

- `sdd/cerebro-audit-v1/code-verification` — este documento
- `sdd/cerebro-audit-v1/apply-pending` — acciones pendientes