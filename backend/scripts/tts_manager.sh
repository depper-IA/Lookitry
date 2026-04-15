#!/bin/bash
# TTS Manager v2 - Control de uso y límite mensual
# Solo usa Gemini 2.5 Flash TTS (gratis hasta 1M caracteres/mes)

API_KEY="${GEMINI_API_KEY:-***REMOVED-SECRET***}"
LOG_DIR="/home/travis/Lookitry/Lookitry/backend/logs"
STATE_FILE="/home/travis/Lookitry/Lookitry/backend/.tts_state"

# Límites del tier gratuito (actualizados 2026-04-14)
LIMIT_CHARS=1000000  # 1M caracteres/mes (gratis)
LIMIT_REQUESTS_RPM=15  # 15 requests/min (free tier)
WARN_THRESHOLD=900000  # Alertar cuando queden 100k

mkdir -p "$LOG_DIR"

load_state() {
    if [ -f "$STATE_FILE" ]; then
        source "$STATE_FILE"
    else
        CHAR_COUNT=0
        REQUEST_COUNT=0
        RESET_MONTH=$(date +%Y-%m)
        LAST_REQUEST_TIME=0
    fi
    
    # Inicializar variables si no existen
    CHAR_COUNT=${CHAR_COUNT:-0}
    REQUEST_COUNT=${REQUEST_COUNT:-0}
    RESET_MONTH=${RESET_MONTH:-$(date +%Y-%m)}
    LAST_REQUEST_TIME=${LAST_REQUEST_TIME:-0}
}

save_state() {
    echo "CHAR_COUNT=$CHAR_COUNT" > "$STATE_FILE"
    echo "REQUEST_COUNT=$REQUEST_COUNT" >> "$STATE_FILE"
    echo "RESET_MONTH=$RESET_MONTH" >> "$STATE_FILE"
    echo "LAST_REQUEST_TIME=$LAST_REQUEST_TIME" >> "$STATE_FILE"
}

reset_if_new_month() {
    current_month=$(date +%Y-%m)
    if [ "$current_month" != "$RESET_MONTH" ]; then
        CHAR_COUNT=0
        REQUEST_COUNT=0
        RESET_MONTH=$current_month
        save_state
        echo "[$(date '+%Y-%m-%d')]Nuevo mes - contador resetado" >> "$LOG_DIR/tts_usage.log"
    fi
}

check_rate_limit() {
    current_time=$(date +%s)
    time_diff=$((current_time - LAST_REQUEST_TIME))
    
    # Si pasó más de 1 minuto, resetear contador de rate
    if [ $time_diff -ge 60 ]; then
        REQUEST_COUNT=0
    fi
    
    if [ $REQUEST_COUNT -ge $LIMIT_REQUESTS_RPM ]; then
        return 1
    fi
    
    return 0
}

log_usage() {
    local text="$1"
    local chars=${#text}
    
    load_state
    reset_if_new_month
    
    CHAR_COUNT=$((CHAR_COUNT + chars))
    REQUEST_COUNT=$((REQUEST_COUNT + 1))
    LAST_REQUEST_TIME=$(date +%s)
    save_state
    
    echo "[$(date '+%Y-%m-%d %H:%M')] TTS: +$chars chars, total: $CHAR_COUNT/$LIMIT_CHARS" >> "$LOG_DIR/tts_usage.log"
}

get_status() {
    load_state
    reset_if_new_month
    
    local remaining=$((LIMIT_CHARS - CHAR_COUNT))
    local percent=$((100 * CHAR_COUNT / LIMIT_CHARS))
    
    echo "{\"used\": $CHAR_COUNT, \"limit\": $LIMIT_CHARS, \"remaining\": $remaining, \"percent\": $percent, \"requests_min\": $REQUEST_COUNT}"
}

generate_tts() {
    local text="$1"
    local output="${2:-/tmp/tts_output.wav}"
    local voice="${3:-Kore}"
    
    load_state
    reset_if_new_month
    
    # Verificar límites
    if [ $CHAR_COUNT -ge $LIMIT_CHARS ]; then
        echo "LIMIT_REACHED"
        echo "⚠️ Límite de TTS alcanzado ($CHAR_COUNT/$LIMIT_CHARS caracteres)"
        echo "   Espera al reset mensual o usa texto plano"
        return 1
    fi
    
    if ! check_rate_limit; then
        echo "RATE_LIMITED"
        echo "⚠️ Demasiadas requests por minuto. Espera un momento."
        return 1
    fi
    
    # Calcular máximo para esta request (dejar buffer)
    max_chars=$((LIMIT_CHARS - CHAR_COUNT - 1000))
    if [ $max_chars -lt 0 ]; then
        max_chars=0
    fi
    
    if [ ${#text} -gt $max_chars ] && [ $max_chars -gt 0 ]; then
        # Truncar texto si necesario
        text="${text:0:$max_chars}"
        echo "⚠️ Texto truncado a $max_chars caracteres"
    elif [ $max_chars -le 0 ]; then
        echo "LIMIT_REACHED"
        return 1
    fi
    
    # Escapar texto para JSON
    text_escaped=$(echo "$text" | sed 's/"/\\"/g' | tr '\n' ' ')
    
    # Generar audio con Gemini Flash TTS
    response=$(curl -s "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=$API_KEY" \
      -H "Content-Type: application/json" \
      -d "{
        \"contents\": [{\"parts\":[{\"text\": \"$text_escaped\"}]}],
        \"generationConfig\": {
          \"responseModalities\": [\"AUDIO\"],
          \"speechConfig\": {
            \"voiceConfig\": {
              \"prebuiltVoiceConfig\": {
                \"voiceName\": \"$voice\"
              }
            }
          }
        }
      }" 2>&1)
    
    # Extraer audio
    echo "$response" | python3 -c "
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
            if output.endswith('.wav'):
                with wave.open(output, 'wb') as wf:
                    wf.setnchannels(1)
                    wf.setsampwidth(2)
                    wf.setframerate(24000)
                    wf.writeframes(audio_bytes)
            else:
                with open(output.replace('.wav','.pcm'), 'wb') as f:
                    f.write(audio_bytes)
            print(f'SUCCESS:{len(audio_bytes)}')
        else:
            print('NO_AUDIO')
else:
    print('ERROR:' + str(candidates[0].get('finishReason','UNKNOWN') if candidates else 'NO_CANDIDATES'))
" 2>&1)
    
    result=$?
    
    if [ $result -eq 0 ]; then
        log_usage "$text"
        echo "✅ Audio guardado: $output"
    fi
    
    return $result
}

# CLI
case "$1" in
    "status")
        get_status
        ;;
    "generate")
        shift
        generate_tts "$@"
        ;;
    "reset")
        CHAR_COUNT=0
        REQUEST_COUNT=0
        RESET_MONTH=$(date +%Y-%m)
        save_state
        echo "✅ TTS counter reset"
        ;;
    "logs")
        tail -20 "$LOG_DIR/tts_usage.log" 2>/dev/null || echo "No hay logs aún"
        ;;
    *)
        echo "🎙️ TTS Manager v2"
        echo ""
        echo "Uso: tts_manager.sh [status|generate|reset|logs]"
        echo ""
        echo "Comandos:"
        echo "  status    - Ver uso actual"
        echo "  generate <texto> [output.wav] [voice] - Generar TTS"
        echo "  reset     - Resetear contador manualmente"
        echo "  logs      - Ver historial de uso"
        ;;
esac