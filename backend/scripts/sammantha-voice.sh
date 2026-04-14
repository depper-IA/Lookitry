#!/bin/bash
# Sammantha Voice - Latin American Spanish TTS
# Uses gTTS (free, unlimited Google TTS)
# Usage: sammantha-voice.sh "text to speak" [output_file]

set -e

VENV="/tmp/gtts-env"
AUDIO_DIR="/tmp/sammantha-voice"
TEXT="$1"
OUTPUT_FILE="${2:-sammantha_$(date +%s).mp3}"

# Create audio directory
mkdir -p "$AUDIO_DIR"

# Full path for output
OUTPUT_PATH="$AUDIO_DIR/$OUTPUT_FILE"

# Activate venv and generate speech
source "$VENV/bin/activate" 2>/dev/null || true

python3 << 'PYTHON_SCRIPT'
import sys
import os
import re
from gtts import gTTS

# Read text from stdin or arguments
if len(sys.argv) > 1:
    text = sys.argv[1]
else:
    text = sys.stdin.read()

# Clean text for better speech
cleaned = text
cleaned = re.sub(r'\*\*(.*?)\*\*', r'\1', cleaned)  # Bold
cleaned = re.sub(r'\*(.*?)\*', r'\1', cleaned)     # Italic
cleaned = re.sub(r'#{1,6}\s', '', cleaned)         # Headers
cleaned = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', cleaned, flags=re.DOTALL)  # Code
cleaned = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', cleaned)  # Links
cleaned = re.sub(r'[📝🤣😂😄😁😊🥰😍🤔😎🤷‍♀️🙋‍♀️🦋✨💚]', '', cleaned)  # Emoji
cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)  # Multiple newlines
cleaned = cleaned.strip()

# Generate audio
tts = gTTS(text=cleaned, lang='es-us', tld='us')  # tld='us' for US/English-accented Spanish
output_path = sys.argv[2] if len(sys.argv) > 2 else f'/tmp/sammantha-voice/sammantha_{int(__import__("time").time())}.mp3'
tts.save(output_path)

print(output_path)
PYTHON_SCRIPT

echo "$OUTPUT_PATH"
