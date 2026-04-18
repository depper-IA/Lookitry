/* ═══════════════════════════════════════════════════════════════════════════════
   SAMMY GAME ENGINE — Canvas-based command center
   Inspired by Pixel Agents (github.com/pablodelucca/pixel-agents)
   State machine + canvas rendering + speech bubbles
══════════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useCallback, useState } from 'react';

/* ─── Types ─────────────────────────────────────────────────────────── */
export type SammyState =
  | 'idle' | 'walking' | 'typing' | 'reading'
  | 'waiting' | 'celebrating' | 'alert'
  | 'thinking' | 'sleeping';

export interface SpriteFrame {
  x: number; y: number; w: number; h: number;
}

export interface Character {
  id: string;
  name: string;
  x: number; y: number;           // grid position
  px: number; py: number;          // pixel position (interpolated)
  state: SammyState;
  prevState: SammyState;
  frame: number;
  frameTimer: number;
  targetX: number; targetY: number;
  speed: number;
  color: string;
  speechBubble: string | null;
  bubbleTimer: number;
  lastUpdate: number;
  _spriteImg?: HTMLImageElement;
}

/* ─── State → Animation config ────────────────────────────────────── */
const STATE_CONFIG: Record<SammyState, {
  color: string; speed: number;
  loopFrames: number; loopDuration: number;
  bounce: string; glowSpeed: string;
  floorEffect: string;
}> = {
  idle:       { color: '#FF5C3A', speed: 0,    loopFrames: 4, loopDuration: 600, bounce: 'bounce-idle',     glowSpeed: '2s',   floorEffect: 'ripple'       },
  walking:    { color: '#FF5C3A', speed: 2.5,  loopFrames: 6, loopDuration: 150, bounce: 'bounce-walk',    glowSpeed: '0.5s', floorEffect: 'glow-pulse'   },
  typing:     { color: '#00FF88', speed: 0,    loopFrames: 4, loopDuration: 120, bounce: 'bounce-working', glowSpeed: '0.25s', floorEffect: 'data-stream'  },
  reading:    { color: '#9B6CF9', speed: 0,    loopFrames: 3, loopDuration: 300, bounce: 'bounce-thinking',glowSpeed: '1.5s', floorEffect: 'glow-pulse'   },
  waiting:    { color: '#FFD23F', speed: 0,    loopFrames: 2, loopDuration: 800, bounce: 'bounce-idle',   glowSpeed: '1s',   floorEffect: 'ripple'       },
  celebrating:{ color: '#FFD23F', speed: 0,    loopFrames: 5, loopDuration: 200, bounce: 'bounce-excited', glowSpeed: '0.2s', floorEffect: 'data-stream'  },
  alert:     { color: '#FF3A5C', speed: 0,    loopFrames: 4, loopDuration: 100, bounce: 'bounce-alert',   glowSpeed: '0.1s', floorEffect: 'alarm'        },
  thinking:  { color: '#9B6CF9', speed: 0,    loopFrames: 4, loopDuration: 400, bounce: 'bounce-thinking',glowSpeed: '1s',   floorEffect: 'glow-pulse'   },
  sleeping:  { color: '#4FC3F7', speed: 0,    loopFrames: 2, loopDuration: 1000,bounce: 'bounce-tired',  glowSpeed: '4s',   floorEffect: 'none'         },
};

/* ─── Canvas tile map (32x18 tiles at 24px each) ───────────────────── */
export const MAP_W = 32;
export const MAP_H = 18;
export const TILE  = 24;

export type TileType = 0 | 1 | 2 | 3; // 0=floor, 1=desk, 2=wall, 3=platform

export const TILE_MAP: TileType[] = [
  /* Row 0 — ceiling */
  ...Array(32).fill(2),
  /* Row 1 */
  ...Array(32).fill(0),
  /* Row 2 — monitors top row */
  ...Array(32).fill(0),
  /* Row 3 — monitors */
  ...[...Array(4).fill(0), 1, 1, 1, ...Array(12).fill(0), 1, 1, 1, 1, ...Array(8).fill(0), 1, 1, 1, ...Array(3).fill(0)],
  /* Row 4 */
  ...Array(32).fill(0),
  /* Row 5 */
  ...Array(32).fill(0),
  /* Row 6 — main desk */
  ...[...Array(5).fill(0), 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ...Array(9).fill(0), 1, 1, 1, 1, 1, 1, 1, 1, 1, ...Array(3).fill(0)],
  /* Row 7 — desk surface */
  ...[...Array(5).fill(0), ...Array(10).fill(3), ...Array(9).fill(0), ...Array(10).fill(3), ...Array(3).fill(0)],
  /* Row 8 */
  ...Array(32).fill(0),
  /* Row 9 */
  ...Array(32).fill(0),
  /* Row 10 */
  ...Array(32).fill(0),
  /* Row 11 — bottom monitors */
  ...[...Array(6).fill(0), 1, 1, 1, 1, 1, ...Array(7).fill(0), 1, 1, 1, 1, ...Array(7).fill(0), 1, 1, 1, 1, 1, ...Array(4).fill(0)],
  /* Row 12 */
  ...Array(32).fill(0),
  /* Row 13 — Sammy platform */
  ...[...Array(12).fill(0), ...Array(8).fill(3), ...Array(12).fill(0)],
  /* Row 14 — floor */
  ...Array(32).fill(0),
  /* Row 15 */
  ...Array(32).fill(0),
  /* Row 16 */
  ...Array(32).fill(0),
  /* Row 17 — bottom */
  ...Array(32).fill(2),
];

/* ─── Sammy spawn position (center, on platform) ─────────────────────── */
const SAMMY_START_X = 16;
const SAMMY_START_Y = 13;

/* ─── Colors per tile type ──────────────────────────────────────────── */
const TILE_COLORS: Record<TileType, string | null> = {
  0: null,                           // floor — rendered separately
  1: '#0a1525',                      // desk
  2: '#050810',                      // wall
  3: '#FF5C3A',                      // platform / desk surface
};

/* ─── Draw floor grid ──────────────────────────────────────────────── */
function drawFloor(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  t: number
) {
  // Dark background
  ctx.fillStyle = '#030508';
  ctx.fillRect(0, 0, w, h);

  // Subtle grid
  ctx.strokeStyle = 'rgba(0,255,255,0.03)';
  ctx.lineWidth = 0.5;
  for (let x = 0; x <= MAP_W; x++) {
    ctx.beginPath();
    ctx.moveTo(x * TILE, 0);
    ctx.lineTo(x * TILE, h);
    ctx.stroke();
  }
  for (let y = 0; y <= MAP_H; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * TILE);
    ctx.lineTo(w, y * TILE);
    ctx.stroke();
  }

  // Perspective floor lines
  const floorY = 13 * TILE;
  ctx.strokeStyle = 'rgba(0,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const offset = ((t * 0.02 + i * 0.2) % 1);
    ctx.globalAlpha = 0.3 - offset * 0.3;
    ctx.beginPath();
    ctx.moveTo(0, floorY + offset * 4 * TILE);
    ctx.lineTo(w, floorY + offset * 4 * TILE);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/* ─── Draw tile map ─────────────────────────────────────────────────── */
function drawTileMap(ctx: CanvasRenderingContext2D) {
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const tile = TILE_MAP[y * MAP_W + x];
      if (tile === 0 || tile === 2) continue;
      const color = TILE_COLORS[tile];
      if (!color) continue;
      const px = x * TILE, py = y * TILE;
      ctx.fillStyle = color;
      ctx.fillRect(px, py, TILE, TILE);
      if (tile === 1) {
        ctx.strokeStyle = 'rgba(0,255,255,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        // Screen glow
        ctx.fillStyle = 'rgba(0,255,255,0.1)';
        ctx.fillRect(px + 3, py + 3, TILE - 6, TILE - 6);
      }
      if (tile === 3) {
        ctx.strokeStyle = 'rgba(0,255,255,0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = 'rgba(0,255,255,0.15)';
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      }
    }
  }
}

/* ─── Draw city silhouette ─────────────────────────────────────────── */
function drawCity(ctx: CanvasRenderingContext2D, w: number, t: number) {
  const buildings = [
    { x: 0,   bw: 40, bh: 50 }, { x: 40,  bw: 40, bh: 70 },
    { x: 80,  bw: 50, bh: 90 }, { x: 130, bw: 50, bh: 110 },
    { x: 180, bw: 60, bh: 140 },{ x: 240, bw: 50, bh: 100 },
    { x: 290, bw: 60, bh: 160 },{ x: 350, bw: 50, bh: 120 },
    { x: 400, bw: 60, bh: 150 },{ x: 460, bw: 50, bh: 110 },
    { x: 510, bw: 50, bh: 130 },{ x: 560, bw: 50, bh: 90 },
    { x: 610, bw: 50, bh: 70 }, { x: 660, bw: 40, bh: 50 },
  ];

  const baseY = 5 * TILE;

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, baseY);
  grad.addColorStop(0, '#010108');
  grad.addColorStop(1, '#030510');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, baseY);

  // Buildings
  ctx.fillStyle = '#0a0f18';
  for (const b of buildings) {
    ctx.fillRect(b.x, baseY - b.bh, b.bw, b.bh);
  }

  // Windows (blinking)
  ctx.fillStyle = '#FF5C3A';
  for (const b of buildings) {
    for (let wy = 0; wy < b.bh - 10; wy += 12) {
      for (let wx = 4; wx < b.bw - 4; wx += 10) {
        const blink = Math.sin((t * 0.001 + wx + wy) * 0.5) > 0.5;
        ctx.globalAlpha = blink ? 0.6 : 0.15;
        ctx.fillRect(b.x + wx, baseY - b.bh + 5 + wy, 4, 6);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Horizon line
  ctx.strokeStyle = 'rgba(0,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  ctx.lineTo(w, baseY);
  ctx.stroke();
}

/* ─── Draw character (sammy sprite) ─────────────────────────────────── */
function drawCharacter(
  ctx: CanvasRenderingContext2D,
  char: Character,
  t: number
) {
  const cfg = STATE_CONFIG[char.state];
  const ox = char.px * TILE + TILE / 2;
  const oy = char.py * TILE + TILE / 2;

  // Glow aura
  const glowAlpha = 0.3 + 0.2 * Math.sin(t * 0.003);
  const gradient = ctx.createRadialGradient(ox, oy - 8, 0, ox, oy - 8, 40);
  gradient.addColorStop(0, cfg.color + '66');
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.globalAlpha = glowAlpha;
  ctx.fillRect(ox - 40, oy - 48, 80, 80);
  ctx.globalAlpha = 1;

  // Bounce offset
  const bouncePhase = (t % cfg.loopDuration) / cfg.loopDuration;
  const bounceOffset = Math.sin(bouncePhase * Math.PI * 2) *
    (char.state === 'typing' ? 4 : char.state === 'celebrating' ? 6 : 2);

  // Activity rings
  if (char.state === 'typing' || char.state === 'walking') {
    const ringSpin = (t * 0.003) % (Math.PI * 2);
    ctx.strokeStyle = cfg.color + '44';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ox, oy - 5, 18, ringSpin, ringSpin + Math.PI * 1.5);
    ctx.stroke();
    ctx.strokeStyle = cfg.color + '22';
    ctx.beginPath();
    ctx.arc(ox, oy - 5, 12, -ringSpin, -ringSpin + Math.PI);
    ctx.stroke();
  }

  // Draw the sammy image (centered on character)
  const img = char._spriteImg;
  if (img && img.complete) {
    const scale = 1.2 + (char.state === 'celebrating' ? Math.sin(t * 0.01) * 0.1 : 0);
    const iw = Math.round(img.width * scale);
    const ih = Math.round(img.height * scale);
    ctx.drawImage(
      img,
      ox - iw / 2,
      oy - ih / 2 - 12 - bounceOffset,
      iw, ih
    );
  } else {
    // Fallback pixel avatar
    ctx.fillStyle = cfg.color;
    ctx.fillRect(ox - 6, oy - 18 - bounceOffset, 12, 18);
    ctx.fillRect(ox - 8, oy - 6 - bounceOffset, 16, 8);
    // Eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(ox - 4, oy - 14 - bounceOffset, 3, 3);
    ctx.fillRect(ox + 1, oy - 14 - bounceOffset, 3, 3);
  }

  // Shadow
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = cfg.color;
  ctx.beginPath();
  ctx.ellipse(ox, oy + 2, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Status indicator
  const dotPulse = char.state === 'typing' ? 0.2 : 1.5;
  const dotAlpha = 0.5 + 0.5 * Math.sin(t * 0.01 / dotPulse);
  ctx.globalAlpha = dotAlpha;
  ctx.fillStyle = cfg.color;
  ctx.beginPath();
  ctx.arc(ox + 10, oy - 24 - bounceOffset, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Z's for sleeping
  if (char.state === 'sleeping') {
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = cfg.color;
    for (let i = 0; i < 3; i++) {
      const zy = oy - 30 - bounceOffset - i * 12 - ((t * 0.02 + i) % 1) * 20;
      const za = 1 - ((t * 0.02 + i) % 1);
      ctx.globalAlpha = za;
      ctx.fillText('z', ox + 12 + i * 4, zy);
    }
    ctx.globalAlpha = 1;
  }

  // Alert symbol
  if (char.state === 'alert') {
    ctx.font = 'bold 14px sans-serif';
    ctx.fillStyle = cfg.color;
    ctx.fillText('⚠', ox - 7, oy - 30 - bounceOffset);
  }

  // Thinking bubbles
  if (char.state === 'thinking' || char.state === 'reading') {
    for (let i = 0; i < 3; i++) {
      const bSize = 5 - i;
      const bAlpha = 0.7 - i * 0.2;
      const bBounce = Math.sin(t * 0.003 + i * 0.5) * 2;
      ctx.globalAlpha = bAlpha;
      ctx.fillStyle = cfg.color;
      ctx.beginPath();
      ctx.arc(ox + 14, oy - 20 - bounceOffset - i * 8 + bBounce, bSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Waiting sparkle
  if (char.state === 'waiting') {
    for (let i = 0; i < 4; i++) {
      const angle = (t * 0.002 + i * Math.PI / 2);
      const dist = 20 + Math.sin(t * 0.005 + i) * 5;
      const sx = ox + Math.cos(angle) * dist;
      const sy = oy - 10 + Math.sin(angle) * dist * 0.5;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.01 + i);
      ctx.fillStyle = cfg.color;
      ctx.fillRect(sx - 1, sy - 1, 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  // Speech bubble
  if (char.speechBubble) {
    drawSpeechBubble(ctx, ox, oy - 50 - bounceOffset, char.speechBubble, cfg.color, t);
  }
}

/* ─── Speech bubble ─────────────────────────────────────────────────── */
function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  text: string,
  color: string,
  t: number
) {
  const padding = 8;
  ctx.font = '10px JetBrains Mono, monospace';
  const lines = wrapText(ctx, text, 140);
  const lineH = 13;
  const bw = 150;
  const bh = lines.length * lineH + padding * 2;
  const bx = x - bw / 2;
  const by = y - bh;

  // Bubble body
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.strokeStyle = color + '88';
  ctx.lineWidth = 1;
  roundRect(ctx, bx, by, bw, bh, 6);
  ctx.fill();
  ctx.stroke();

  // Tail
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.beginPath();
  ctx.moveTo(x - 5, by + bh);
  ctx.lineTo(x + 5, by + bh);
  ctx.lineTo(x, by + bh + 8);
  ctx.closePath();
  ctx.fill();

  // Text
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  lines.forEach((line, i) => {
    ctx.fillText(line, bx + padding, by + padding + (i + 1) * lineH - 3);
  });
  ctx.textAlign = 'left';
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxW && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [text];
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

/* ─── Ceiling lights ───────────────────────────────────────────────── */
function drawCeilingLights(ctx: CanvasRenderingContext2D, w: number, t: number) {
  const lights = [6, 16, 26];
  for (const lx of lights) {
    const px = lx * TILE + TILE / 2;
    const beam = ctx.createLinearGradient(px, 0, px, 8 * TILE);
    beam.addColorStop(0, 'rgba(0,255,255,0.4)');
    beam.addColorStop(1, 'transparent');
    ctx.fillStyle = beam;
    ctx.fillRect(px - 15, 0, 30, 8 * TILE);
    ctx.fillStyle = '#FF5C3A';
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 0.002 + lx);
    ctx.fillRect(px - 4, 0, 8, 4);
    ctx.globalAlpha = 1;
  }
}

/* ─── BFS pathfinding ───────────────────────────────────────────────── */
function bfsPath(
  startX: number, startY: number,
  endX: number, endY: number
): Array<{x: number; y: number}> | null {
  if (startX === endX && startY === endY) return null;
  const walkable = (x: number, y: number) => {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return false;
    const t = TILE_MAP[y * MAP_W + x];
    return t === 0 || t === 3;
  };
  if (!walkable(endX, endY)) return null;

  const queue: Array<{x: number; y: number; path: Array<{x: number; y: number}>}> = [
    { x: startX, y: startY, path: [{ x: startX, y: startY }] }
  ];
  const visited = new Set<string>();
  visited.add(`${startX},${startY}`);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    if (curr.x === endX && curr.y === endY) return curr.path;

    const dirs = [[0,-1],[0,1],[-1,0],[1,0]];
    for (const [dx, dy] of dirs) {
      const nx = curr.x + dx, ny = curr.y + dy;
      const key = `${nx},${ny}`;
      if (!visited.has(key) && walkable(nx, ny)) {
        visited.add(key);
        queue.push({ x: nx, y: ny, path: [...curr.path, { x: nx, y: ny }] });
      }
    }
  }
  return null;
}

/* ─── Floor effect canvas overlay ─────────────────────────────────── */
function drawFloorEffect(
  ctx: CanvasRenderingContext2D,
  effect: string,
  color: string,
  t: number,
  cx: number, cy: number
) {
  if (effect === 'ripple') {
    for (let i = 0; i < 3; i++) {
      const phase = ((t * 0.001 + i * 0.33) % 1);
      const radius = phase * 60;
      const alpha = (1 - phase) * 0.4;
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(cx, cy + 30, radius, radius * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  } else if (effect === 'data-stream') {
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 8; i++) {
      const x = cx - 80 + i * 23;
      const offset = (t * 0.05 + i * 40) % 120;
      const grad = ctx.createLinearGradient(x, cy, x, cy - 120 + offset);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x, cy - 120 + offset, 2, 120 - offset);
    }
    ctx.globalAlpha = 1;
  } else if (effect === 'alarm') {
    ctx.fillStyle = '#FF3A5C';
    for (let y = 0; y < ctx.canvas.height; y += 40) {
      ctx.globalAlpha = 0.05 + 0.03 * Math.sin(t * 0.01 + y * 0.1);
      ctx.fillRect(0, y, ctx.canvas.width, 20);
    }
    ctx.globalAlpha = 1;
  } else if (effect === 'glow-pulse') {
    const alpha = 0.15 + 0.1 * Math.sin(t * 0.003);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 30, 80, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

/* ─── Main Game Canvas ─────────────────────────────────────────────── */
interface GameCanvasProps {
  state: SammyState;
  speechBubble: string | null;
  floorEffect: string;
  onArrived?: () => void;
  charRef?: React.RefObject<Character | null>; // Ref pasado desde el componente padre
}

export function GameCanvas({ state, speechBubble, floorEffect, onArrived, charRef: externalCharRef }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const charRef   = useRef<Character | null>(null);
  const spriteRef = useRef<HTMLImageElement | null>(null);
  const rafRef    = useRef<number>(0);
  const tRef      = useRef<number>(0);

  /* ── Sync charRef to parent ─────────────────────────────────── */
  useEffect(() => {
    if (externalCharRef) externalCharRef.current = charRef.current;
  });

  /* ── Load sprite ──────────────────────────────────────────────── */
  useEffect(() => {
    const img = new Image();
    img.src = '/assets/sammy.webp';
    img.onload = () => { spriteRef.current = img; };
  }, []);

  /* ── Init character ─────────────────────────────────────────── */
  useEffect(() => {
    charRef.current = {
      id: 'sammy',
      name: 'Sammy',
      x: SAMMY_START_X, y: SAMMY_START_Y,
      px: SAMMY_START_X, py: SAMMY_START_Y,
      state: state,
      prevState: 'idle',
      frame: 0,
      frameTimer: 0,
      targetX: SAMMY_START_X, targetY: SAMMY_START_Y,
      speed: 2.5,
      color: STATE_CONFIG[state].color,
      speechBubble,
      bubbleTimer: 0,
      lastUpdate: Date.now(),
      _spriteImg: null,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Update character when state changes ─────────────────────── */
  useEffect(() => {
    const char = charRef.current;
    if (!char) return;
    char.prevState = char.state;
    char.state = state;
    char.color = STATE_CONFIG[state].color;
    char.frame = 0;
    char.frameTimer = 0;
    char.speechBubble = speechBubble;
    char.speed = STATE_CONFIG[state].speed;
    char._spriteImg = spriteRef.current ?? undefined;
  }, [state, speechBubble]);

  /* ── Game loop ──────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      tRef.current += dt;

      const char = charRef.current;
      if (externalCharRef) externalCharRef.current = char;
      if (char) {
        char._spriteImg = spriteRef.current ?? undefined;
        if (char.x !== char.targetX || char.y !== char.targetY) {
          const dx = char.targetX - char.x;
          const dy = char.targetY - char.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 0.1) {
            char.x = char.targetX;
            char.y = char.targetY;
            char.px = char.x;
            char.py = char.y;
            onArrived?.();
          } else {
            const step = char.speed * (dt / 16);
            char.px += (dx / dist) * step;
            char.py += (dy / dist) * step;
            // Snap to grid for pathfinding
            char.x = Math.round(char.px);
            char.y = Math.round(char.py);
          }
        } else {
          char.px = char.x;
          char.py = char.y;
        }

        /* ── State transitions ───────────────────────────── */
        char.frameTimer += dt;
        if (char.frameTimer > STATE_CONFIG[char.state].loopDuration) {
          char.frameTimer = 0;
          char.frame = (char.frame + 1) % STATE_CONFIG[char.state].loopFrames;
        }
      }

      /* ── Render ─────────────────────────────────────────── */
      const W = canvas.width, H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // Layer 1: Background + city
      drawCity(ctx, W, tRef.current);
      drawFloor(ctx, W, H, tRef.current);

      // Layer 2: Tile map (desks, walls, platforms)
      drawTileMap(ctx);

      // Layer 3: Floor effect
      if (char) {
        drawFloorEffect(
          ctx, floorEffect,
          STATE_CONFIG[char.state].color,
          tRef.current,
          char.px * TILE + TILE / 2,
          char.py * TILE + TILE / 2
        );
      }

      // Layer 4: Character
      if (char) {
        drawCharacter(ctx, char, tRef.current);
      }

      // Layer 5: Ceiling lights overlay
      drawCeilingLights(ctx, W, tRef.current);

      // Scanlines
      ctx.fillStyle = 'rgba(0,255,255,0.015)';
      for (let y = 0; y < H; y += 4) {
        ctx.fillRect(0, y, W, 2);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onArrived]);

  return (
    <canvas
      ref={canvasRef}
      width={MAP_W * TILE}
      height={MAP_H * TILE}
      style={{
        width: '100%',
        aspectRatio: `${MAP_W * TILE} / ${MAP_H * TILE}`,
        borderRadius: 8,
        imageRendering: 'pixelated',
      }}
    />
  );
}

/* ─── Walk to position helper ─────────────────────────────────────── */
export function useCharacterWalk() {
  const charRef = useRef<Character | null>(null);

  const walkTo = useCallback((x: number, y: number) => {
    const char = charRef.current;
    if (!char) return;
    char.targetX = x;
    char.targetY = y;
    char.state = 'walking';
  }, []);

  const setChar = useCallback((c: Character | null) => {
    charRef.current = c;
  }, []);

  return { walkTo, setChar };
}

/* ─── State descriptions for UI ───────────────────────────────────── */
export const STATE_LABELS: Record<SammyState, string> = {
  idle:        'Monitoreando sistemas',
  walking:    'Caminando',
  typing:     'Procesando datos',
  reading:    'Analizando información',
  waiting:    'Esperando input',
  celebrating:'¡Celebrando éxito!',
  alert:      '⚠ ALERTA',
  thinking:   'Pensando...',
  sleeping:   'Modo descanso',
};
