#!/bin/bash
# MiniMax TTS - Text to Speech
# Modelo: speech-2.8-turbo (gratis hasta cierto límite)
# Voces con emociones: happy, sad, angry, fearful, disgust, surprise, neutral

API_KEY="${MINIMAX_API_KEY:-}"
LOG_DIR="/home/travis/Lookitry/Lookitry/backend/logs"

if [ -z "$API_KEY" ]; then
    # Intentar desde .env
    if [ -f "/home/travis/Lookitry/Lookitry/backend/.env" ]; then
        API_KEY=$(grep MINIMAX_API_KEY /home/travis/Lookitry/Lookitry/backend/.env | cut -d= -f2 | tr -d ' ')
    fi
fi

if [ -z "$API_KEY" ]; then
    echo "❌ Error: MINIMAX_API_KEY no encontrada"
    echo "   Configura tu API key en .env: MINIMAX_API_KEY=tu_key"
    exit 1
fi

TEXT="$1"
OUTPUT="${2:-/tmp/minimax_tts.mp3}"
VOICE="${3:-female-tianmei}"  # Voz femenina en español
SPEED="${4:-1.0}"
EMOTION="${5:-happy}"

if [ -z "$TEXT" ]; then
    echo "🎙️ MiniMax TTS"
    echo ""
    echo "Uso: $0 \"texto\" [output.mp3] [voice_id] [speed] [emotion]"
    echo ""
    echo "Voces disponibles (español/latino):"
    echo "  - female-tianmei (recomendada para chica joven)"
    echo "  - male-tianmei"
    echo "  - female-yunyang"
    echo "  - male-qiuyue"
    echo ""
    echo "Emociones: happy, sad, angry, fearful, disgust, surprise, neutral"
    echo ""
    echo "Modelos:"
    echo "  - speech-2.8-hd (máxima calidad)"
    echo "  - speech-2.8-turbo (más rápido)"
    exit 1
fi

MODEL="speech-2.8-turbo"

echo "🎙️ Generando audio con MiniMax..."
echo "   Texto: $TEXT"
echo "   Voz: $VOICE"
echo "   Emoción: $EMOTION"

# Hacer request a MiniMax
response=$(curl -s "https://api.minimax.io/v1/t2a_v2" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"$MODEL\",
    \"text\": \"$TEXT\",
    \"stream\": false,
    \"voice_setting\": {
      \"voice_id\": \"$VOICE\",
      \"speed\": $SPEED,
      \"vol\": 1,
      \"pitch\": 0
    },
    \"audio_setting\": {
      \"sample_rate\": 32000,
      \"bitrate\": 128000,
      \"format\": \"mp3\",
      \"channel\": 1
    }
  }" 2>&1)

# Verificar respuesta
status=$(echo "$response" | python3 -c "
import sys, json
d = json.load(sys.stdin)
base_resp = d.get('base_resp', {})
status_code = base_resp.get('status_code', -1)
print(status_code)
if status_code == 0:
    audio_hex = d.get('data', {}).get('audio', '')
    extra = d.get('extra_info', {})
    print('OK')
    print(f'Audio size: {extra.get(\"audio_size\", 0)} bytes')
    print(f'Duration: {extra.get(\"audio_length\", 0)} ms')
    print(f'Characters used: {extra.get(\"usage_characters\", 0)}')
    
    # Guardar audio
    if audio_hex:
        audio_bytes = bytes.fromhex(audio_hex)
        with open('$OUTPUT', 'wb') as f:
            f.write(audio_bytes)
        print('SAVED')
else:
    print('Error:', base_resp.get('status_msg', 'unknown'))
" 2>&1)

if echo "$status" | grep -q "OK"; then
    echo "✅ Audio guardado: $OUTPUT"
    ls -lh "$OUTPUT"
else
    echo "❌ Error: $status"
fi