# Correcciones: REGLAS_IMPORTANTES.md

## Cambios a aplicar:

### 1. REMOVER sección sammantha_voice (líneas ~307-311)
La sección sammantha_voice es legacy, NO se usa en frontend. Rebecca usa MiniMax TTS.

```
sammantha_voice:
  motor: "Gemini 2.5 Flash TTS"
  ubicacion: "/home/travis/Lookitry/Lookitry/backend/scripts/sammantha_voice.sh"
  regla: "Solo generar audio cuando Sam ENVÍA audio primero O lo pide explícitamente"
  estado: "/home/travis/Lookitry/Lookitry/backend/.tts_state"
```

**ACCIÓN:** Eliminar esta sección completamente.

### 2. ACTUALIZAR Groq (línea ~354)
Dice "ELIMINADO" pero groq existe en opencode.json como fallback.

```
- **GROQ**: ~~API directa~~ → **ELIMINADO del proyecto**. No referenciar ni reinstalar.
```

**CAMBIAR A:**
```
- **GROQ**: Solo como fallback de emergencia (`small_model`). No usar para requests normales.
```

### 3. ACTUALIZAR Auto-push (líneas ~35-38)
Auto-push es peligroso y no está implementado en el código.

```
- **Auto-commit**: DESPUÉS de cada tarea significativa, hacer commit automáticamente con mensaje descriptivo (conventional commits: `feat:`, `fix:`, `docs:`, etc.)
- **Auto-push**: Hacer push después de cada commit exitoso
```

**CAMBIAR A:**
```
- **Auto-commit**: DESPUÉS de cada tarea significativa, hacer commit automáticamente con mensaje descriptivo (conventional commits: `feat:`, `fix:`, `docs:`, etc.)
- **Auto-push**: NO hacer push automático. Solo hacer push después de verify que el código compila y tests pasan, o por autorización del usuario.
```

### 4. MOVER VPS IP a sección privada
La IP pública del VPS no debería estar en docs públicos.

```
## 🔧 VPS PRODUCCIÓN - INFO IMPORTANTE
### Credenciales VPS (Guardadas en backend/.env)
- **VPS IP**: 31.220.18.39
- **SSH**: root@31.220.18.39:22
```

**ACCIÓN:** Reemplazar con:
```
## 🔧 VPS PRODUCCIÓN - INFO IMPORTANTE
### Credenciales VPS
Las credenciales del VPS están en `backend/.env` (NO en git). Consultar con Sam Wilkie para acceso.
```