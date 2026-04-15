'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import './sammy-control-tower.css';

async function fetchSVGFromAPI(agentId: string, type: string): Promise<string> {
  const res = await fetch('/api/command-center/generate-svg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, type })
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.svg || '';
}

async function fetchRealMetrics() {
  try {
    const res = await fetch('/api/agents/status');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── PARTICLE ────────────────────────────────────────────────────────────────
class Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number; color: string;
  constructor(x: number, y: number, color: string) {
    this.x = x; this.y = y;
    this.vx = (Math.random() - 0.5) * 0.6;
    this.vy = -Math.random() * 0.8 - 0.2;
    this.life = 1;
    this.decay = 0.006 + Math.random() * 0.004;
    this.size = 2 + Math.random() * 2;
    this.color = color;
  }
  update() { this.x += this.vx; this.y += this.vy; this.life -= this.decay; }
  draw(ctx: CanvasRenderingContext2D) {
    const alpha = this.life * 0.7;
    ctx.fillStyle = this.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
    ctx.fillRect(this.x, this.y, this.size, this.size);
  }
}

// ─── DRAW FUNCTIONS ─────────────────────────────────────────────────────────
function drawStars(canvas: HTMLCanvasElement | null, frame: number) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 100; i++) {
    const x = ((i * 137.508 + i * i * 0.1) % canvas.width);
    const y = ((i * 97.333 + i * i * 0.07) % canvas.height);
    const twinkle = 0.3 + 0.7 * (Math.sin(frame * 0.015 + i * 0.7) * 0.5 + 0.5);
    ctx.fillStyle = `rgba(255,255,255,${twinkle * 0.7})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
}

function drawControlTower(ctx: CanvasRenderingContext2D, W: number, H: number, frame: number, themeColor: string) {
  const hex = (opacity: number) => themeColor + Math.round(opacity * 255).toString(16).padStart(2, '0');

  ctx.fillStyle = '#080815';
  ctx.fillRect(0, 0, W, H);

  // ── ISOMETRIC FLOOR ──
  const drawIsoFloor = () => {
    const tw = W * 0.15, th = tw * 0.5;
    const cols = 8, rows = 5;
    const startX = W * 0.5, startY = H * 0.58;
    for (let r = 0; r < rows; r++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + (col - r) * tw * 0.5;
        const y = startY + (col + r) * th * 0.5;
        ctx.beginPath();
        ctx.moveTo(x, y - th * 0.5);
        ctx.lineTo(x + tw * 0.5, y);
        ctx.lineTo(x, y + th * 0.5);
        ctx.lineTo(x - tw * 0.5, y);
        ctx.closePath();
        ctx.fillStyle = '#0a0a1e';
        ctx.fill();
        ctx.strokeStyle = hex(0.18);
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  };

  // ── BACK WALL WITH MONITORS ──
  const drawBackWall = () => {
    ctx.fillStyle = '#0a0a1e';
    ctx.fillRect(W * 0.03, H * 0.03, W * 0.94, H * 0.48);
    ctx.strokeStyle = hex(0.12);
    ctx.lineWidth = 0.5;
    ctx.strokeRect(W * 0.03, H * 0.03, W * 0.94, H * 0.48);

    // Center divider
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.03);
    ctx.lineTo(W * 0.5, H * 0.51);
    ctx.strokeStyle = hex(0.1);
    ctx.stroke();

    // Left panel: 12 indicator dots
    for (let i = 0; i < 12; i++) {
      const bx = W * 0.07 + (i % 4) * 18;
      const by = H * 0.08 + Math.floor(i / 4) * 18;
      const on = (frame + i * 7) % 60 < 30;
      ctx.fillStyle = on ? themeColor : hex(0.15);
      ctx.fillRect(bx, by, 6, 6);
    }

    // Left panel: mini bar chart
    for (let i = 0; i < 8; i++) {
      const bh = 6 + Math.sin(frame * 0.04 + i) * 5;
      ctx.fillStyle = hex(0.5);
      ctx.fillRect(W * 0.07 + i * 14, H * 0.35 - bh, 8, bh);
    }

    // Right panel: scrolling code lines (simulated)
    for (let i = 0; i < 6; i++) {
      const scroll = (frame * 0.3 + i * 12) % 60;
      const lineY = H * 0.1 + i * 14 - scroll % 14;
      if (lineY > H * 0.08 && lineY < H * 0.45) {
        const len = 20 + Math.sin(i + frame * 0.02) * 15;
        ctx.fillStyle = hex(0.25 + Math.sin(i + frame * 0.02) * 0.15);
        ctx.fillRect(W * 0.55 + i * 5, lineY, len, 2);
      }
    }

    // Top monitors row
    const monitors = [
      [W * 0.12, H * 0.05], [W * 0.28, H * 0.04], [W * 0.44, H * 0.04],
      [W * 0.60, H * 0.04], [W * 0.76, H * 0.05]
    ];
    monitors.forEach(([mx, my]) => {
      ctx.fillStyle = '#0d1a2d';
      ctx.fillRect(mx as number, my as number, 32, 22);
      ctx.strokeStyle = hex(0.5);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(mx as number, my as number, 32, 22);
      ctx.fillStyle = hex(0.2);
      ctx.fillRect((mx as number) + 2, (my as number) + 2, 28, 18);
      // Blinking content
      const alpha = 0.3 + Math.sin(frame * 0.07 + (mx as number)) * 0.3;
      ctx.fillStyle = hex(alpha * 0.7);
      ctx.fillRect((mx as number) + 3, (my as number) + 4, 20, 1.5);
      ctx.fillRect((mx as number) + 3, (my as number) + 8, 14, 1.5);
      ctx.fillRect((mx as number) + 3, (my as number) + 12, 18, 1.5);
    });

    // Status text top-right
    ctx.fillStyle = hex(0.6);
    ctx.font = '8px JetBrains Mono, monospace';
    ctx.fillText('◉ ALL SYSTEMS ONLINE', W * 0.62, H * 0.1);
  };

  // ── COMMAND CONSOLE (U-shaped) ──
  const drawConsole = () => {
    const cx = W * 0.5, cy = H * 0.62;

    // U-shaped console base
    ctx.fillStyle = '#0d1a2a';
    ctx.fillRect(cx - 80, cy - 18, 160, 36);
    ctx.fillStyle = '#112233';
    ctx.fillRect(cx - 74, cy - 14, 148, 28);

    // Orange/cyan buttons along console
    for (let i = 0; i < 10; i++) {
      const pulse = Math.sin(frame * 0.08 + i * 1.2) > 0;
      ctx.fillStyle = pulse ? (i % 2 === 0 ? '#FF8C00' : themeColor) : hex(0.2);
      ctx.fillRect(cx - 66 + i * 13, cy - 6, 8, 6);
    }

    // 3 hovering holographic screens
    [-40, 0, 40].forEach((dx, i) => {
      const alpha = 0.5 + Math.sin(frame * 0.04 + i) * 0.25;
      ctx.fillStyle = `rgba(0,255,255,${alpha * 0.12})`;
      ctx.fillRect(cx + dx - 22, cy - 60, 36, 26);
      ctx.strokeStyle = hex(alpha * 0.7);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx + dx - 22, cy - 60, 36, 26);
      // Screen content lines
      ctx.fillStyle = hex(alpha * 0.6);
      ctx.fillRect(cx + dx - 18, cy - 55, 26, 1.5);
      ctx.fillRect(cx + dx - 18, cy - 50, 18, 1.5);
      ctx.fillRect(cx + dx - 18, cy - 45, 22, 1.5);
    });
  };

  // ── RADAR ON FLOOR ──
  const drawRadar = () => {
    const rx = W * 0.5, ry = H * 0.82;
    const maxR = 55;

    // Base rings
    [maxR, 40, 25].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(rx, ry, r, 0, Math.PI * 2);
      ctx.strokeStyle = hex(0.12 + i * 0.06);
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Crosshairs
    ctx.strokeStyle = hex(0.08);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(rx - maxR, ry); ctx.lineTo(rx + maxR, ry);
    ctx.moveTo(rx, ry - maxR); ctx.lineTo(rx, ry + maxR);
    ctx.stroke();

    // Sweep
    const angle = (frame * 0.03) % (Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.arc(rx, ry, maxR, angle - 0.9, angle);
    ctx.closePath();
    const grad = ctx.createLinearGradient(
      rx, ry,
      rx + Math.cos(angle) * maxR, ry + Math.sin(angle) * maxR
    );
    grad.addColorStop(0, hex(0.5));
    grad.addColorStop(1, hex(0));
    ctx.fillStyle = grad;
    ctx.fill();

    // Sweep line
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(rx + Math.cos(angle) * maxR, ry + Math.sin(angle) * maxR);
    ctx.strokeStyle = hex(0.9);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Blips
    const blipSeeds = [
      { x: 20, y: -30 }, { x: -35, y: 15 }, { x: 40, y: 25 },
      { x: -15, y: 35 }, { x: 30, y: -10 }
    ];
    blipSeeds.forEach((bp, i) => {
      const blipAngle = Math.atan2(bp.y, bp.x);
      const diff = ((angle - blipAngle) + Math.PI * 2) % (Math.PI * 2);
      if (diff < 0.6) {
        const alpha = (1 - diff / 0.6) * 0.8;
        ctx.beginPath();
        ctx.arc(rx + bp.x, ry + bp.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,255,${alpha})`;
        ctx.fill();
      }
    });

    // Radar label
    ctx.fillStyle = hex(0.5 + Math.sin(frame * 0.06) * 0.2);
    ctx.font = '7px JetBrains Mono, monospace';
    ctx.fillText('◉ RADAR SWEEP', rx - 32, ry + maxR + 12);
  };

  // ── FLOOR GLOW ──
  const drawFloorGlow = () => {
    const grd = ctx.createRadialGradient(W * 0.5, H * 0.75, 0, W * 0.5, H * 0.75, W * 0.4);
    grd.addColorStop(0, hex(0.07));
    grd.addColorStop(1, 'transparent');
    ctx.fillStyle = grd;
    ctx.fillRect(0, H * 0.45, W, H * 0.55);
  };

  drawIsoFloor();
  drawBackWall();
  drawConsole();
  drawRadar();
  drawFloorGlow();
}

function drawSammyCharacter(ctx: CanvasRenderingContext2D, px: number, py: number, frame: number, themeColor: string) {
  const scale = 1.8;
  const bob = Math.sin(frame * 0.12) * 1.5;
  const hex = (opacity: number) => themeColor + Math.round(opacity * 255).toString(16).padStart(2, '0');

  const drawRect = (x: number, y: number, w: number, h: number, col: string) => {
    ctx.fillStyle = col;
    ctx.fillRect(px + x * scale, py + y * scale + bob, w * scale, h * scale);
  };

  // Shadow under feet
  ctx.fillStyle = hex(0.1);
  ctx.beginPath();
  ctx.ellipse(px + 14 * scale, py + 58 * scale + bob, 14 * scale, 5 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  drawRect(5, 42, 7, 14, themeColor + 'cc');
  drawRect(16, 42, 7, 14, themeColor + 'cc');
  // Boots
  drawRect(3, 54, 9, 6, themeColor);
  drawRect(15, 54, 9, 6, themeColor);
  // Body / suit
  drawRect(3, 20, 22, 24, '#1a2a2a');
  // Chest suit accent
  drawRect(5, 22, 18, 18, themeColor + '88');
  // Belt
  drawRect(3, 40, 22, 5, '#333333');
  // Belt buckle (orange)
  drawRect(10, 40, 8, 5, '#FF8C00');
  // Arms
  drawRect(-2, 22, 6, 16, themeColor + '77');
  drawRect(24, 22, 6, 16, themeColor + '77');
  // Gloves
  drawRect(-2, 36, 6, 5, themeColor);
  drawRect(24, 36, 6, 5, themeColor);
  // Shoulder pads
  drawRect(1, 20, 7, 5, themeColor);
  drawRect(20, 20, 7, 5, themeColor);
  // Neck
  drawRect(10, 15, 8, 7, '#c07848');
  // Afro hair
  const hairCol = '#6B3A1F';
  drawRect(2, 0, 24, 18, hairCol);
  drawRect(0, 3, 28, 14, hairCol);
  drawRect(-1, 5, 30, 10, hairCol);
  // Face
  drawRect(5, 5, 18, 14, '#c07848');
  // Eyes
  drawRect(7, 8, 4, 4, '#2a1510');
  drawRect(17, 8, 4, 4, '#2a1510');
  // Visor glow
  drawRect(5, 5, 18, 3, themeColor + '33');
  // Chest light (pulsing orange)
  const pulseAlpha = 0.5 + Math.sin(frame * 0.15) * 0.5;
  ctx.fillStyle = `rgba(255,92,58,${pulseAlpha})`;
  ctx.fillRect(px + 12 * scale, py + 27 * scale + bob, 5 * scale, 5 * scale);
}

// ─── COMPONENT ──────────────────────────────────────────────────────────────
export default function SammyControlTower() {
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading');
  const [metrics, setMetrics] = useState<any>(null);
  const [genRoomSVG, setGenRoomSVG] = useState('');
  const [genCharSVG, setGenCharSVG] = useState('');
  const [genProgress, setGenProgress] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [patrolPos, setPatrolPos] = useState({ x: 0.5, y: 0.68 });

  const frameRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const starsCanvas = useRef<HTMLCanvasElement>(null);
  const towerCanvas = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const patrolT = useRef(0);
  const patrolFrom = useRef({ x: 0.5, y: 0.68 });
  const patrolTo = useRef({ x: 0.5, y: 0.68 });

  const PATROL = [
    { x: 0.5, y: 0.68 }, { x: 0.35, y: 0.72 }, { x: 0.65, y: 0.72 },
    { x: 0.5, y: 0.78 }, { x: 0.38, y: 0.65 }, { x: 0.62, y: 0.65 }
  ];
  let patrolIdx = 0;

  useEffect(() => { setIsMounted(true); }, []);

  // Load real metrics
  useEffect(() => {
    const load = async () => {
      const data = await fetchRealMetrics();
      setMetrics(data);
      setPhase('ready');
    };
    load();
  }, []);

  // AI generation
  useEffect(() => {
    if (phase !== 'ready') return;
    const generate = async () => {
      setGenProgress('Generating room background...');
      try {
        const room = await fetchSVGFromAPI('sammy', 'room');
        if (room.includes('<svg')) setGenRoomSVG(room);
      } catch (e) { console.error(e); }
      setGenProgress('Generating Sammy sprite...');
      try {
        const char = await fetchSVGFromAPI('sammy', 'character');
        if (char.includes('<svg')) setGenCharSVG(char);
      } catch (e) { console.error(e); }
      setGenProgress('');
    };
    generate();
  }, [phase]);

  // Game loop
  const gameLoop = useCallback(() => {
    const f = frameRef.current;
    frameRef.current++;

    drawStars(starsCanvas.current, f);

    // Update patrol
    patrolT.current += 0.004;
    if (patrolT.current >= 1) {
      patrolT.current = 0;
      patrolIdx = (patrolIdx + 1) % PATROL.length;
      patrolFrom.current = patrolPos;
      patrolTo.current = PATROL[patrolIdx];
    }
    const t = patrolT.current;
    const lerpX = patrolFrom.current.x + (patrolTo.current.x - patrolFrom.current.x) * t;
    const lerpY = patrolFrom.current.y + (patrolTo.current.y - patrolFrom.current.y) * t;
    setPatrolPos({ x: lerpX, y: lerpY });

    // Update & spawn particles
    const parts = particlesRef.current;
    if (parts.length < 30 && Math.random() < 0.3) {
      const canvas = towerCanvas.current;
      if (canvas) {
        parts.push(new Particle(
          canvas.width * 0.5 + (Math.random() - 0.5) * 60,
          canvas.height * 0.6,
          '#00FFFF'
        ));
      }
    }
    for (let i = parts.length - 1; i >= 0; i--) {
      parts[i].update();
      if (parts[i].life <= 0) parts.splice(i, 1);
    }

    // Draw tower
    const canvas = towerCanvas.current;
    if (canvas) {
      const ctx = canvas.getContext('2d')!;
      drawControlTower(ctx, canvas.width, canvas.height, f, '#00FFFF');
      // Particles
      parts.forEach(p => p.draw(ctx));
      // Sammy character
      const charX = patrolPos.x * canvas.width - 14;
      const charY = patrolPos.y * canvas.height - 30;
      drawSammyCharacter(ctx, charX, charY, f, '#00FFFF');
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [patrolPos]);

  useEffect(() => {
    if (phase !== 'ready') return;
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [phase, gameLoop]);

  // ─── RENDER ────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="sct-loading">
        <div className="sct-loading-inner">
          <div className="sct-loading-title">◉ SAMMY CONTROL TOWER</div>
          <div className="sct-loading-sub">Connecting to Lookitry Command Grid...</div>
          <div className="sct-loading-spinner" />
          {genProgress && <div className="sct-loading-progress">{genProgress}</div>}
        </div>
      </div>
    );
  }

  const stats = metrics?.stats || {};
  const agents = metrics?.agents || [];
  const services = metrics?.services || {};
  const recentActivity = metrics?.recentActivity || [];

  return (
    <div className="sct-root scanlines">
      {isMounted && (
        <canvas
          ref={starsCanvas}
          className="sct-stars"
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
        />
      )}

      {/* Header */}
      <div className="sct-header">
        <div className="sct-header-left">
          <div className="sct-title">◉ SAMMY CONTROL TOWER</div>
          <div className="sct-subtitle">LOOKITRY COMMAND CENTER — AGENT: SAMMY</div>
        </div>
        <div className="sct-header-center">
          <div className="sct-metric">
            <span className="sct-metric-label">BRANDS</span>
            <span className="sct-metric-value">{stats.totalTasks ?? '—'}</span>
          </div>
          <div className="sct-metric">
            <span className="sct-metric-label">AGENTS</span>
            <span className="sct-metric-value">{stats.agentsCount ?? '—'}</span>
          </div>
          <div className="sct-metric">
            <span className="sct-metric-label">UPTIME</span>
            <span className="sct-metric-value" style={{ color: '#00FF41' }}>{stats.uptime ?? '—'}</span>
          </div>
          <div className="sct-metric">
            <span className="sct-metric-label">TASKS</span>
            <span className="sct-metric-value">{stats.totalTasks ?? '—'}</span>
          </div>
        </div>
        <div className="sct-header-right">
          <div className="sct-status-dots">
            {Object.entries(services).map(([k, v]: [string, any]) => (
              <div key={k} className={`sct-status-dot ${v}`} title={k} />
            ))}
          </div>
          <div className="sct-time">{new Date().toLocaleTimeString()}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="sct-main">
        {/* Left Panel — Agent Roster */}
        <div className="sct-panel sct-agents-panel">
          <div className="sct-panel-title">◉ AGENT ROSTER</div>
          {agents.slice(0, 8).map((agent: any) => (
            <div key={agent.id} className="sct-agent-row">
              <div className={`sct-agent-dot ${agent.status}`} />
              <div className="sct-agent-info">
                <div className="sct-agent-name" style={{ color: agent.color }}>{agent.name}</div>
                <div className="sct-agent-task">{agent.lastTask || agent.specialty}</div>
              </div>
              <div className="sct-agent-status" data-status={agent.status}>{agent.status.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Center — Control Tower Canvas */}
        <div className="sct-tower-wrap">
          <canvas
            ref={towerCanvas}
            className="sct-tower-canvas"
            width={900}
            height={580}
            style={{ imageRendering: 'pixelated' }}
          />
          {/* AI Generated room SVG overlay */}
          {genRoomSVG && (
            <div className="sct-svg-overlay sct-room-overlay">
              <div dangerouslySetInnerHTML={{ __html: genRoomSVG }} />
            </div>
          )}
          {/* AI Generated character SVG overlay */}
          {genCharSVG && (
            <div
              className="sct-svg-overlay sct-char-overlay"
              style={{
                left: `${patrolPos.x * 100}%`,
                top: `${patrolPos.y * 100}%`,
              }}
            >
              <div dangerouslySetInnerHTML={{ __html: genCharSVG }} />
            </div>
          )}

          {/* Character label */}
          <div className="sct-char-label">
            <div className="sct-char-name">SAMMY</div>
            <div className="sct-char-role">COORDINATOR</div>
          </div>
        </div>

        {/* Right Panel — Activity Feed */}
        <div className="sct-panel sct-activity-panel">
          <div className="sct-panel-title">◉ ACTIVITY FEED</div>
          {recentActivity.length === 0 && (
            <div className="sct-activity-empty">No recent activity</div>
          )}
          {recentActivity.slice(0, 8).map((a: any, i: number) => (
            <div key={i} className="sct-activity-row">
              <div className="sct-activity-icon">{a.icon}</div>
              <div className="sct-activity-info">
                <div className="sct-activity-title">{a.title}</div>
                <div className="sct-activity-desc">{a.description}</div>
              </div>
              <div className="sct-activity-time">{a.time}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="sct-footer">
        <div className="sct-footer-left">
          <span style={{ color: '#00FFFF88' }}>CONTROL TOWER v1.0</span>
          <span style={{ color: '#00FF4144', marginLeft: 16 }}>◉ LOOKITRY COMMAND CENTER</span>
        </div>
        <div className="sct-footer-right">
          {genProgress && <span style={{ color: '#FF8C00' }}>{genProgress}</span>}
        </div>
      </div>
    </div>
  );
}
