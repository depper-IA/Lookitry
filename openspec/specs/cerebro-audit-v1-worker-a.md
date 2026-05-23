# Worker A: REGLAS_IMPORTANTES.md Audit Results

**Archivo auditado:** `C:/Users/Matt/Lookitry/Lookitry_Brain_Vault/Cerebro/REGLAS_IMPORTANTES.md`
**Fecha:** 2026-05-23
**Ejecutado por:** Main thread (bash commands directamente)

---

## ✅ VERIFICADO

### 1. Scripts paths (líneas 65-66)
- **Claim:** `_deploy_now.py` está en `scripts/tools/_deploy_now.py`
- **Evidencia:** `ls scripts/tools/_deploy_now.py` → EXISTE ✅

### 2. sammantha_voice.sh existe
- **Claim:** El archivo `sammantha_voice.sh` existe en `backend/scripts/`
- **Evidencia:** `ls backend/scripts/sammantha_voice.sh` → EXISTE ✅

### 3. Modelo default MiniMax-M2.7
- **Claim:** Todos los agentes usan `minimax/MiniMax-M2.7`
- **Evidencia en opencode.json:**
  ```
  "model": "minimax/MiniMax-M2.7" para sammy, webwizard, devguardian, dataalchemist, growthpilot, architectai, docs-writter
  ```
- **Small model:** `"small_model": "groq/llama-3.3-70b-versatile"` (groq aún existe como fallback)

### 4. Agentes con nombres humanos y técnicos
- **Claim:** Los docs usan nombres humanos (Sammantha, Pixel, etc.) que coexisten con nombres técnicos (sammy, webwizard)
- **Evidencia:** Ambos sistemas coexisten correctamente. Los nombres técnicos son para invocación, los humanos para documentación.

---

## ⚠️ DISCREPANCIA

### 5. Auto-commit/Auto-push
- **Claim doc:** "Auto-commit: DESPUÉS de cada tarea significativa, hacer commit automáticamente... Auto-push: Hacer push después de cada commit exitoso"
- **Evidencia en opencode.json:** NO EXISTE implementación de auto-commit/auto-push
- **Veredicto:** La regla existe en docs pero NO está implementada en el código. Es solo una guía de estilo, no una configuración activa.
- **Decisión:** Mantener la regla en docs pero aclarar que es "guideline" y no una configuración enforceada. El auto-push especialmente es peligroso.

### 6. Groq — ELIMINADO según docs, PERO aún en config
- **Claim doc (línea 354):** "**GROQ**: ~~API directa~~ → **ELIMINADO del proyecto**. No referenciar ni reinstalar."
- **Evidencia en opencode.json:**
  ```json
  "groq": {
    "options": {
      "apiKey": "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"
    }
  }
  ```
  Y `"small_model": "groq/llama-3.3-70b-versatile"`
- **Veredicto:** GROQ sigue en opencode.json como provider de fallback. La docs-writter dijo "eliminado" pero el código lo contradice.
- **Decisión:** Actualizar el doc para decir "GROQ solo como fallback de emergencia, no para uso regular".

### 7. sammantha_voice — NO USADO en frontend
- **Claim doc (líneas 307-311):** sammantha_voice está configurado y tiene reglas de uso
- **Evidencia en código:** `grep -rn "sammantha_voice" frontend/src/` → NO ENCONTRADO
- **Veredicto:** El archivo existe en backend pero el frontend NO lo usa. Rebecca usa MiniMax TTS, no sammantha_voice.
- **Decisión:** La sección sammantha_voice es legacy/muerto. Debe removerse de REGLAS_IMPORTANTES.md.

---

## 🔴 CRÍTICO

### 8. VPS IP expuesta públicamente
- **Claim doc (líneas 490-499):**
  ```
  ## 🔧 VPS PRODUCCIÓN - INFO IMPORTANTE
  - **VPS IP**: 31.220.18.39
  - **SSH**: root@31.220.18.39:22
  ```
- **Veredicto:** La IP pública del servidor productivo está en un repo público. La contraseña se indica que está en backend/.env (que está en .gitignore) — esto está bien.
- **Riesgo:** Exposición de infraestructura en docs públicos.
- **Decisión:** Mover la sección VPS a un archivo privado (como `docs/architecture/VPS_INFO.md` que está en .gitignore) o remover completamente. La IP ya es pública de todos modos (es un VPS accesible desde internet).

---

## 🔵 INFO

### 9. Telegram notifications disabled
- **Claim doc (línea 474-476):** Notificaciones Telegram deshabilitadas por Sam
- **Evidencia en opencode.json:**
  ```json
  "telegram": {
    ...
    "enabled": false,
    ...
  }
  ```
- **Veredicto:** ✅ CONSISTENTE — El MCP de Telegram está deshabilitado en código y documentado como tal.

---

## Resumen

| Claim | Status | Acción |
|-------|--------|--------|
| Scripts paths (scripts/tools/) | ✅ VERIFICADO | Ninguna |
| sammantha_voice.sh existe | ✅ VERIFICADO | Ninguna |
| Modelo MiniMax-M2.7 | ✅ VERIFICADO | Ninguna |
| Agent names (humano + técnico) | ✅ VERIFICADO | Ninguna |
| Auto-commit/auto-push | ⚠️ DISCREPANCIA | Actualizar doc para decir "guideline" |
| Groq ELIMINADO vs existe | ⚠️ DISCREPANCIA | Actualizar doc para decir "fallback only" |
| sammantha_voice legacy | ⚠️ DISCREPANCIA | Remover sección de doc |
| VPS IP expuesta | 🔴 CRÍTICO | Mover a archivo privado |
| Telegram disabled | ✅ VERIFICADO | Ninguna |

**Total claims verificados:** 9
- ✅ Verificados: 5
- ⚠️ Discrepancias: 3
- 🔴 Críticos: 1