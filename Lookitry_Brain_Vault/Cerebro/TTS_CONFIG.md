# 🎙️ TTS - Sistema de Text-to-Speech

## Configuración

```yaml
# Límites del tier gratuito
LIMITE_CARACTERES_MENSUAL: 1000000  # 1M caracteres
LIMITE_REQUESTS_MINUTO: 1500

# Modelos
MODELOS:
  - nombre: "gemini-2.5-flash-preview-tts"
    tipo: " estándar (gratis hasta límite)"
    
  - nombre: "gemini-2.5-pro-preview-tts"
    tipo: " alta calidad (fallback cuando límite alcanzado)"
```

## Reglas de uso

```
SI caracteres_usados < 1000000:
    → Usar gemini-2.5-flash-preview-tts (gratis)
    
SI caracteres_usados >= 1000000:
    → Responder en texto plano
    → Sugerir esperar al reset mensual
```

## Comandos

```bash
# Ver estado actual
./tts_manager.sh status

# Reset manual (si necesitas)
./tts_manager.sh reset

# Ver logs
cat logs/tts_usage.log
```

---

_Last updated: 2026-04-14_