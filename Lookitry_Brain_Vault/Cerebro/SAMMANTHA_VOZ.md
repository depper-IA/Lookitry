# 🎙️ VOZ / TTS - Sammantha

## Configuración actual

```yaml
modelo: "gemini-2.5-flash-preview-tts"
proveedor: "Google Gemini API"
costo: "GRATIS hasta 1M caracteres/mes"

voz:
  nombre: "Kore"
  estilo: "Energética y juvenil"
  personalidad: "Chica latina de 24 años, amigable, entusiasta"
  idioma: "Español (latino)"
  prompt: "Say in enthusiastic, energetic Spanish with youthful tone like a 24 year old girl"
```

## Límites de uso

```yaml
limite_mensual: 1000000  # 1M caracteres gratis
alerta: 900000  # Cuando queden 100k caracteres
reset: "Automático el día 1 de cada mes"

fallback:
  cuando: "Límite alcanzado"
  modo: "Responder en texto plano (no audio)"
```

## Reglas de uso

```
CUANDO GENERAR AUDIO:
- Solo cuando Sam me envía un audio primero
- Solo cuando Sam me pide audio explícitamente

CUANDO NO GENERAR AUDIO:
- En respuestas normales de texto
- Para saludos o mensajes cotidianos
- Sin petición expresa

SI caracteres_usados < 1000000:
    → Usar gemini-2.5-flash-preview-tts (gratis)
    
SI caracteres_usados >= 1000000:
    → Responder en texto plano
    → Sugerir esperar al reset mensual
```

## Scripts disponibles

```bash
# Generar audio (TTS)
./sammantha_voice.sh generate "Hola Sam!" [output.wav]

# Ver estado
./sammantha_voice.sh status

# Reset manual
./sammantha_voice.sh reset
```

## Proceso de voz

```
1. Recibir petición de audio (Sam envía audio o pide)
2. Verificar límite mensual (1M chars)
3. Si OK → Generar audio con Kore (voz juvenil/energética)
4. Enviar por Telegram como nota de voz
5. Registrar uso en logs/tts_usage.log

SI límite alcanzado:
   → Responder en texto plano
   → No generar audio hasta próximo mes
```

## Logs

- Ubicación: `/home/travis/Lookitry/Lookitry/backend/logs/tts_usage.log`
- Estado: `/home/travis/Lookitry/Lookitry/backend/.tts_state`

---

_Last updated: 2026-04-14_