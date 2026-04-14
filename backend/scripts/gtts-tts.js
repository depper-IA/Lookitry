#!/usr/bin/env node
/**
 * Sammantha Voice - Google TTS (gTTS) Integration
 * Generates audio using gTTS with Latin American Spanish voice
 * Free and unlimited!
 */

const gtts = require('gtts');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const OUTPUT_DIR = '/tmp/sammantha-voice';
const DEFAULT_LANG = 'es-us'; // Latin American Spanish

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Convert text to speech and save as MP3
 * @param {string} text - Text to convert
 * @param {string} filename - Output filename (without extension)
 * @param {string} lang - Language code (default: es-us for Latin American)
 * @returns {string} Path to the generated audio file
 */
function textToSpeech(text, filename, lang = DEFAULT_LANG) {
  const outputPath = path.join(OUTPUT_DIR, `${filename}.mp3`);
  
  // Clean text - remove markdown formatting for cleaner speech
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1') // Italic
    .replace(/#{1,6}\s/g, '') // Headers
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1') // Code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/📝/g, '') // Emoji
    .replace(/[🤣😂😄😁😊🥰😍🤔😎🤷‍♀️🙋‍♀️]/g, '') // Remove emoji
    .replace(/\n{3,}/g, '\n\n') // Multiple newlines
    .trim();
  
  return new Promise((resolve, reject) => {
    try {
      const speech = new gtts(cleanText, lang);
      speech.save(outputPath, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(outputPath);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Quick sync version for shell scripts
 */
function textToSpeechSync(text, filename, lang = DEFAULT_LANG) {
  const outputPath = path.join(OUTPUT_DIR, `${filename}.mp3`);
  
  // Clean text
  const cleanText = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .replace(/`{1,3}(.*?)`{1,3}/gs, '$1')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/📝/g, '')
    .replace(/[🤣😂😄😁😊🥰😍🤔😎🤷‍♀️🙋‍♀️]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  // Generate filename based on hash
  const tempInput = path.join(OUTPUT_DIR, `temp_${Date.now()}.txt`);
  const tempOutput = path.join(OUTPUT_DIR, `temp_${Date.now()}.mp3`);
  
  fs.writeFileSync(tempInput, cleanText, 'utf8');
  
  try {
    execSync(`python3 -c "
from gtts import gTTS
import sys
with open('${tempInput}', 'r') as f:
    text = f.read()
tts = gTTS(text=text, lang='${lang}')
tts.save('${tempOutput}')
"`, { stdio: 'pipe' });
    
    fs.renameSync(tempOutput, outputPath);
    fs.unlinkSync(tempInput);
    
    return outputPath;
  } catch (error) {
    // Fallback to node gtts
    const speech = new gtts(cleanText, lang);
    speech.save(outputPath);
    return outputPath;
  }
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🎙️ Sammantha Voice - gTTS TTS Generator

Usage:
  node gtts-tts.js "Hello world" [filename] [lang]
  echo "Hello world" | node gtts-tts.js stdin [filename] [lang]

Examples:
  node gtts-tts.js "Hola, soy Sammantha" hola es-us
  node gtts-tts.js "Buenos días" saludo es-419
  
Languages:
  es-us  - US Spanish (Latin American)
  es-es  - Spanish (Spain)
  es-419 - Latin American Spanish
    `);
    process.exit(0);
  }
  
  if (args[0] === 'stdin') {
    // Read from stdin
    let text = '';
    process.stdin.on('data', chunk => text += chunk);
    process.stdin.on('end', async () => {
      const filename = args[1] || `voice_${Date.now()}`;
      const lang = args[2] || DEFAULT_LANG;
      try {
        const path = await textToSpeech(text, filename, lang);
        console.log(path);
      } catch (err) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
  } else {
    const text = args[0];
    const filename = args[1] || `voice_${Date.now()}`;
    const lang = args[2] || DEFAULT_LANG;
    
    try {
      const path = textToSpeechSync(text, filename, lang);
      console.log(path);
    } catch (err) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  }
}

module.exports = { textToSpeech, textToSpeechSync, DEFAULT_LANG };
