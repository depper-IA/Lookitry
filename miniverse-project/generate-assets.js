import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');

function createPropImage(width, height, color, label) {
  const canvas = createCanvas(width * 32, height * 32);
  const ctx = canvas.getContext('2d');
  
  // Main body
  ctx.fillStyle = color;
  ctx.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
  
  // Border
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
  
  // Label
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, canvas.width / 2, canvas.height / 2);
  
  return canvas;
}

// Create props
const propsDir = join(PUBLIC_DIR, 'worlds', 'cozy-startup', 'world_assets', 'props');

const propConfigs = [
  { w: 2, h: 2, color: '#8B6914', label: 'DESK' },
  { w: 2, h: 2, color: '#8B6914', label: 'DESK' },
  { w: 1, h: 1, color: '#4A4A4A', label: '☕' },
  { w: 3, h: 1, color: '#6B4226', label: 'COUCH' },
  { w: 2, h: 2, color: '#A0522D', label: 'TABLE' },
];

propConfigs.forEach((config, i) => {
  const canvas = createPropImage(config.w, config.h, config.color, config.label);
  const path = join(propsDir, `prop_${i}_${config.label.toLowerCase()}.png`);
  writeFileSync(path, canvas.toBuffer('image/png'));
  console.log(`Created prop_${i}_${config.label.toLowerCase()}.png`);
});

// Create citizen sprite (256x256, 4x4 grid of 64x64 frames)
function createCitizenSprite(name, bodyColor) {
  const size = 256;
  const frameSize = 64;
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  // Walk frames (4 directions × 4 frames)
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = col * frameSize;
      const y = row * frameSize;
      
      // Body
      ctx.fillStyle = bodyColor;
      ctx.fillRect(x + 20, y + 16, 24, 32);
      
      // Head
      ctx.fillStyle = '#FFD4A5';
      ctx.fillRect(x + 22, y + 8, 20, 16);
      
      // Eyes
      ctx.fillStyle = '#000';
      ctx.fillRect(x + 26, y + 14, 3, 3);
      ctx.fillRect(x + 35, y + 14, 3, 3);
      
      // Legs (animate based on frame)
      const legOffset = (col % 2 === 0) ? 0 : 4;
      ctx.fillStyle = '#333';
      ctx.fillRect(x + 24, y + 48, 6, 12 + legOffset);
      ctx.fillRect(x + 34, y + 48, 6, 12 - legOffset);
    }
  }
  
  const path = join(PUBLIC_DIR, 'universal_assets', 'citizens', `${name}_walk.png`);
  writeFileSync(path, canvas.toBuffer('image/png'));
  console.log(`Created ${name}_walk.png`);
  
  // Action sheet
  const actionCanvas = createCanvas(size, size);
  const actx = actionCanvas.getContext('2d');
  
  // Row 0: Sitting at desk
  for (let col = 0; col < 4; col++) {
    actx.fillStyle = bodyColor;
    actx.fillRect(col * 64 + 16, 20, 32, 24);
    actx.fillStyle = '#FFD4A5';
    actx.fillRect(col * 64 + 20, 8, 24, 16);
    actx.fillStyle = '#000';
    actx.fillRect(col * 64 + 26, 14, 3, 3);
    actx.fillRect(col * 64 + 35, 14, 3, 3);
  }
  
  // Row 1: Sleeping
  for (let col = 0; col < 4; col++) {
    actx.fillStyle = bodyColor;
    actx.fillRect(col * 64 + 12, 80, 40, 16);
    actx.fillStyle = '#FFD4A5';
    actx.fillRect(col * 64 + 40, 76, 16, 16);
    // Zzz
    actx.fillStyle = '#818cf8';
    actx.font = '10px monospace';
    actx.fillText('Z', col * 64 + 50, 72);
  }
  
  // Row 2: Talking
  for (let col = 0; col < 4; col++) {
    actx.fillStyle = bodyColor;
    actx.fillRect(col * 64 + 20, 144, 24, 32);
    actx.fillStyle = '#FFD4A5';
    actx.fillRect(col * 64 + 22, 136, 20, 16);
    actx.fillStyle = '#000';
    actx.fillRect(col * 64 + 26, 142, 3, 3);
    actx.fillRect(col * 64 + 35, 142, 3, 3);
    // Mouth
    actx.fillRect(col * 64 + 28, 148, 8, 2);
    // Hand gesture
    const handY = (col % 2 === 0) ? 156 : 152;
    actx.fillStyle = '#FFD4A5';
    actx.fillRect(col * 64 + 44, handY, 8, 8);
  }
  
  // Row 3: Standing idle
  for (let col = 0; col < 4; col++) {
    actx.fillStyle = bodyColor;
    actx.fillRect(col * 64 + 20, 208, 24, 32);
    actx.fillStyle = '#FFD4A5';
    actx.fillRect(col * 64 + 22, 200, 20, 16);
    actx.fillStyle = '#000';
    actx.fillRect(col * 64 + 26, 206, 3, 3);
    actx.fillRect(col * 64 + 35, 206, 3, 3);
    actx.fillStyle = '#333';
    actx.fillRect(col * 64 + 24, 240, 6, 12);
    actx.fillRect(col * 64 + 34, 240, 6, 12);
  }
  
  const actionPath = join(PUBLIC_DIR, 'universal_assets', 'citizens', `${name}_actions.png`);
  writeFileSync(actionPath, actionCanvas.toBuffer('image/png'));
  console.log(`Created ${name}_actions.png`);
}

createCitizenSprite('morty', '#4A90D9');
createCitizenSprite('dexter', '#D94A4A');
createCitizenSprite('nova', '#D9A84A');
createCitizenSprite('rio', '#4AD9A8');

console.log('All assets generated!');
