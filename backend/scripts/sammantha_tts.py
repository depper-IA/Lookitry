#!/usr/bin/env python3
"""
Sammantha Voice - Latin American Spanish TTS
Uses gTTS (free, unlimited Google TTS)
"""
import sys
import os
import re
import argparse
from gtts import gTTS

VENV_PYTHON = "/tmp/gtts-env/bin/python3"

def clean_text(text):
    """Clean markdown and emoji for better speech synthesis"""
    cleaned = text
    cleaned = re.sub(r'\*\*(.*?)\*\*', r'\1', cleaned)  # Bold
    cleaned = re.sub(r'\*(.*?)\*', r'\1', cleaned)       # Italic
    cleaned = re.sub(r'#{1,6}\s', '', cleaned)           # Headers
    cleaned = re.sub(r'`{1,3}(.*?)`{1,3}', r'\1', cleaned, flags=re.DOTALL)  # Code
    cleaned = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', cleaned)  # Links
    cleaned = re.sub(r'[📝🤣😂😄😁😊🥰😍🤔😎🤷‍♀️🙋‍♀️🦋✨💚🎉👍👎]', '', cleaned)  # Emoji
    cleaned = re.sub(r'\n{3,}', '\n\n', cleaned)        # Multiple newlines
    return cleaned.strip()

def text_to_speech(text, output_path, lang='es-us'):
    """Convert text to speech and save as MP3"""
    cleaned = clean_text(text)
    if not cleaned:
        raise ValueError("No text to speak after cleaning")
    
    # tld='us' for clearer Latin American accent
    tts = gTTS(text=cleaned, lang=lang, tld='com.mx')
    tts.save(output_path)
    return output_path

def main():
    parser = argparse.ArgumentParser(description='Sammantha Voice - Latin American TTS')
    parser.add_argument('text', help='Text to convert to speech', nargs='?', default=None)
    parser.add_argument('-o', '--output', help='Output file path', default=None)
    parser.add_argument('-l', '--lang', help='Language code (default: es-us)', default='es-us')
    parser.add_argument('--stdin', action='store_true', help='Read from stdin')
    
    args = parser.parse_args()
    
    # Get text to convert
    if args.stdin or args.text is None:
        text = sys.stdin.read()
    else:
        text = args.text
    
    if not text.strip():
        print("Error: No text provided", file=sys.stderr)
        sys.exit(1)
    
    # Generate output path
    if args.output:
        output_path = args.output
    else:
        audio_dir = '/tmp/sammantha-voice'
        os.makedirs(audio_dir, exist_ok=True)
        output_path = os.path.join(audio_dir, f'sammantha_{int(__import__("time").time())}.mp3')
    
    # Generate speech
    try:
        result = text_to_speech(text, output_path, args.lang)
        print(result)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
