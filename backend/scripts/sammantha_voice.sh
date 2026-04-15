#!/bin/bash
# Gemini TTS Pro - Voz energica y juvenil
# Modelo: gemini-2.5-flash-preview-tts (gratis hasta 1M chars/mes)

API_KEY="${GEMINI_API_KEY:-AIzaSyC0VSpvwBFT9l57e9lpYA4MCGd3I_BebvE}"
LOG_DIR="/home/travis/Lookitry/Lookitry/backend/logs"
STATE_FILE="/home/travis/Lookitry/Lookitry/backend/.tts_state"

# Límite mensual: 1M caracteres (tier gratuito)
LIMIT_MONTHLY=1000000

mkdir -p "$LOG_DIR"

load_state() {
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE"
    else
        MONTHLY_CHARS=0
        RESET_MONTH=$(date +%Y-%m)
    fi
    MONTHLY_CHARS=${MONTHLY_CHARS:-0}
    RESET_MONTH=${RESET_MONTH:-$(date +%Y-%m)}
}

save_state() {
    echo "MONTHLY_CHARS=$MONTHLY_CHARS" > "$STATE_FILE"
    echo "RESET_MONTH=$RESET_MONTH" >> "$STATE_FILE"
}

reset_if_needed() {
    current_month=$(date +%Y-%m)
    if [ "$current_month" != "$RESET_MONTH" ]; then
        MONTHLY_CHARS=0
        RESET_MONTH=$current_month
        save_state
    fi
}

generate() {
    local text="$1"
    local output="${2:-/tmp/sammantha_voice.wav}"
    
    load_state
    reset_if_needed
    
    # Verificar límite
    if [ $MONTHLY_CHARS -ge $LIMIT_MONTHLY ]; then
        echo "LIMIT_REACHED"
        return 1
    fi
    
    # Calcular espacio disponible
    available=$((LIMIT_MONTHLY - MONTHLY_CHARS))
    
    # Truncar si es necesario
    if [ ${#text} -gt $available ]; then
        text="${text:0:$available}"
    fi
    
    # Agregar prompt para voz energica/juvenil
    local full_text="Say in enthusiastic, energetic Spanish with youthful tone like a 24 year old girl: $text"
    
    # Generar audio
    response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=$API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"contents\": [{\"parts\":[{\"text\": \"$full_text\"}]}],
        \"generationConfig\": {
          \"responseModalities\": [\"AUDIO\"],
          \"speechConfig\": {
            \"voiceConfig\": {
              \"prebuiltVoiceConfig\": {
                \"voiceName\": \"Kore\"
              }
            }
          }
        }
      }" 2>&1)
    
    # Extraer audio
    success=$(echo "$response" | python3 -c "
import sys, json, base64, wave

d = json.load(sys.stdin)
candidates = d.get('candidates', [])

if candidates and candidates[0].get('finishReason') == 'STOP':
    parts = candidates[0].get('content', {}).get('parts', [])
    for p in parts:
        if 'inlineData' in p:
            data = p['inlineData']['data']
            audio_bytes = base64.b64decode(data)
            output = '$output'
            with wave.open(output, 'wb') as wf:
                wf.setnchannels(1)
                wf.setsampwidth(2)
                wf.setframerate(24000)
                wf.writeframes(audio_bytes)
            print('OK:' + str(len(audio_bytes)))
        else:
            print('NO_AUDIO')
else:
    reason = candidates[0].get('finishReason','UNKNOWN') if candidates else 'NO_CANDIDATES'
    print('ERROR:' + reason)
" 2>&1)
    
    if [[ "$success" == OK:* ]]; then
        size=${success#OK:}
        
        # Actualizar contador
        load_state
        MONTHLY_CHARS=$((MONTHLY_CHARS + ${#text}))
        save_state
        
        # Log
        echo "[$(date '+%Y-%m-%d %H:%M')] Generated: ${#text} chars, total: $MONTHLY_CHARS/$LIMIT_MONTHLY" >> "$LOG_DIR/tts_usage.log"
        
        echo "SUCCESS:$output:$size"
        return 0
    else
        echo "FAILED:$success"
        return 1
    fi
}

# CLI
case "$1" in
    "generate"|"gen")
        shift
        generate "$@"
        ;;
    "status")
        load_state
        reset_if_needed
        echo "{\"used\": $MONTHLY_CHARS, \"limit\": $LIMIT_MONTHLY, \"remaining\": $((LIMIT_MONTHLY - MONTHLY_CHARS))}"
        ;;
    "reset")
        MONTHLY_CHARS=0
        RESET_MONTH=$(date +%Y-%m)
        save_state
        echo "✅ Reset completo"
        ;;
    *)
        echo "Usage: sammantha_voice.sh generate \"texto\" [output.wav]"
        ;;
esac