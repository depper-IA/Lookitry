'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import './command-center.css';

/* ─── CUSTOM ASSETS (Sam's creations) ─────────────────────────────────────── */
// Assets served from /public/assets/ — copied from repo root

/* ─── HEARTBEAT TYPES ──────────────────────────────────────────────────────── */
interface HeartbeatData {
  agents: {
    id: string;
    name: string;
    status: 'ready' | 'busy' | 'idle' | 'error';
    lastTask: string;
  }[];
  stats: {
    agentsCount: number;
    totalTasks: number;
    successRate: number;
  };
  services: Record<string, string>;
}

/* ─── SAMMY ROOM (Immersive + Heartbeat-driven) ─────────────────────────────── */
function SammyRoom({ agentId }: { agentId: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement>(null);
  const scanRef = useRef(0);
  const particlesRef = useRef<{ x: number; y: number; vx: number; vy: number; life: number; color: string }[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null);
  const [speechBubble, setSpeechBubble] = useState('');
  const [taskTyping, setTaskTyping] = useState('');
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const targetTask = useRef('');

  // Fetch heartbeat
  useEffect(() => {
    const loadHeartbeat = async () => {
      try {
        const res = await fetch('/api/agents/status');
        if (!res.ok) return;
        const data: HeartbeatData = await res.json();
        setHeartbeat(data);

        // Update speech bubble target for Sammy
        const sammy = data.agents.find(a => a.id === 'sammy');
        if (sammy) {
          targetTask.current = sammy.lastTask && sammy.lastTask !== 'Sin actividad reciente'
            ? sammy.lastTask
            : 'Monitoreando agentes...';
        }
      } catch { /* silent */ }
    };
    loadHeartbeat();
    const id = setInterval(loadHeartbeat, 15_000);
    return () => clearInterval(id);
  }, []);

  // Typewriter effect for task text
  useEffect(() => {
    if (typingRef.current) clearInterval(typingRef.current);
    if (targetTask.current === taskTyping) return;
    typingRef.current = setInterval(() => {
      setTaskTyping(prev => {
        if (prev.length < targetTask.current.length) {
          return targetTask.current.slice(0, prev.length + 1);
        }
        clearInterval(typingRef.current!);
        return prev;
      });
    }, 40);
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [targetTask.current]);

  const sammyStatus = heartbeat?.agents.find(a => a.id === 'sammy')?.status ?? 'idle';
  const isBusy = sammyStatus === 'busy';
  const isError = sammyStatus === 'error';

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const spawn = () => {
      if (particlesRef.current.length < 60) {
        const count = isBusy ? 3 : 1;
        for (let i = 0; i < count; i++) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: -(Math.random() * 2.5 + 0.8),
            life: 1,
            color: isBusy ? (Math.random() > 0.5 ? '#00FFFF' : '#FF5C3A') : '#00FF41',
          });
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isBusy) spawn();

      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.012;
        ctx.globalAlpha = p.life * 0.7;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2, 2);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [isBusy]);

  // Radar animation
  useEffect(() => {
    const canvas = radarCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const CX = 40, CY = 40, R = 36;
    let raf = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, 80, 80);

      // Grid circles
      ctx.strokeStyle = '#00FF4133';
      ctx.lineWidth = 0.5;
      for (let r = R / 3; r <= R; r += R / 3) {
        ctx.beginPath();
        ctx.arc(CX, CY, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Crosshairs
      ctx.beginPath();
      ctx.moveTo(CX - R, CY); ctx.lineTo(CX + R, CY);
      ctx.moveTo(CX, CY - R); ctx.lineTo(CX, CY + R);
      ctx.stroke();

      // Radar sweep
      const sweep = (t * 0.001) % (Math.PI * 2);
      const grad = ctx.createConicGradient(sweep, CX, CY);
      grad.addColorStop(0, '#00FF4133');
      grad.addColorStop(0.15, '#00FF4100');
      grad.addColorStop(1, '#00FF4100');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI * 2);
      ctx.fill();

      // Agent dots
      if (heartbeat) {
        heartbeat.agents.forEach((a, i) => {
          const angle = (i / heartbeat.agents.length) * Math.PI * 2;
          const dist = R * 0.5;
          const dx = CX + Math.cos(angle) * dist - 3;
          const dy = CY + Math.sin(angle) * dist - 3;
          ctx.fillStyle = a.status === 'ready' ? '#00FF41' : a.status === 'busy' ? '#FFD700' : a.status === 'error' ? '#FF003C' : '#334155';
          ctx.beginPath();
          ctx.arc(dx + 3, dy + 3, 3, 0, Math.PI * 2);
          ctx.fill();
          // Blink if error
          if (a.status === 'error' && Math.sin(t * 0.01) > 0) {
            ctx.fillStyle = '#FF003C88';
            ctx.beginPath();
            ctx.arc(dx + 3, dy + 3, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }

      // Center dot (Sammy)
      ctx.fillStyle = '#00FFFF';
      ctx.beginPath();
      ctx.arc(CX, CY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#00FFFF44';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(CX, CY, 7, 0, Math.PI * 2);
      ctx.stroke();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [heartbeat]);

  const statusColor = isError ? '#FF003C' : isBusy ? '#FFD700' : '#00FF41';
  const statusLabel = isError ? '⚠ ERROR' : isBusy ? '⚡ ACTIVE' : '◉ IDLE';

  return (
    <div style={{ position: 'relative', width: '100%', aspectRatio: '280/180', overflow: 'hidden',
      background: '#030508', borderRadius: 6 }}>

      {/* Room image */}
      <Image src="/assets/Room-sammanta.png" alt="Sammy Room" fill
        style={{ objectFit: 'cover', imageRendering: 'auto', opacity: isError ? 0.6 : 0.85 }}
        unoptimized />

      {/* Scan lines overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.02) 2px, rgba(0,255,255,0.02) 4px)', pointerEvents: 'none' }} />

      {/* Error flash */}
      {isError && (
        <div style={{ position: 'absolute', inset: 0, background: '#FF003C18',
          animation: 'cc-pulse 0.5s ease-in-out infinite', pointerEvents: 'none' }} />
      )}

      {/* Particle canvas */}
      <canvas ref={canvasRef} width={280} height={180}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

      {/* HUD: corner brackets */}
      <svg viewBox="0 0 280 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        {/* Corner brackets */}
        {[[0, 0], [280, 0], [0, 180], [280, 180]].map(([cx, cy], i) => {
          const sx = i % 2 === 0 ? 1 : -1;
          const sy = i < 2 ? 1 : -1;
          return (
            <g key={i} stroke={statusColor} strokeWidth={1.5} fill="none" opacity={0.7}>
              <path d={`M${cx + sx * 12},${cy} L${cx},${cy} L${cx},${cy + sy * 12}`} />
            </g>
          );
        })}
        {/* Top data line */}
        <line x1={16} y1={12} x2={264} y2={12} stroke="#00FFFF" strokeWidth={0.5} opacity={0.3} />
        <line x1={16} y1={168} x2={264} y2={168} stroke="#00FFFF" strokeWidth={0.5} opacity={0.3} />
      </svg>

      {/* Mini radar (top right) */}
      <div style={{ position: 'absolute', top: 8, right: 8, width: 40, height: 40,
        background: '#00000088', border: '1px solid #00FF4144', borderRadius: 4 }}>
        <canvas ref={radarCanvasRef} width={80} height={80}
          style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Speech bubble (top left) */}
      <div style={{ position: 'absolute', top: 8, left: 8, maxWidth: 140,
        background: '#00FFFF11', border: '1px solid #00FFFF44', borderRadius: 4,
        padding: '4px 8px', backdropFilter: 'blur(4px)' }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, color: '#00FFFF88', marginBottom: 2 }}>
          CURRENT_TASK
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7.5, color: '#00FFFF',
          minHeight: 10, lineHeight: 1.3 }}>
          {taskTyping}
          <span style={{ animation: 'cc-blink 0.8s step-end infinite' }}>█</span>
        </div>
      </div>

      {/* Stats HUD (bottom left) */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', gap: 8 }}>
        {[
          { label: 'AGENTS', value: heartbeat ? `${heartbeat.stats.agentsCount}/${heartbeat.agents.length}` : '—/10' },
          { label: 'TASKS', value: heartbeat?.stats.totalTasks?.toString() ?? '—' },
          { label: 'SUCCESS', value: heartbeat ? `${heartbeat.stats.successRate}%` : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{ background: '#00000066', border: '1px solid #00FF4122',
            borderRadius: 3, padding: '2px 6px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: '#00FF41', fontWeight: 700 }}>{value}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 6, color: '#00FF4177' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Services status (bottom right) */}
      <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', gap: 4, flexDirection: 'column', alignItems: 'flex-end' }}>
        {heartbeat && Object.entries(heartbeat.services).slice(0, 4).map(([name, status]) => (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 3,
            fontFamily: "'JetBrains Mono', monospace", fontSize: 6.5, color: status === 'ok' ? '#00FF41' : status === 'warn' ? '#FFD700' : '#FF003C' }}>
            <span>{status === 'ok' ? '●' : status === 'warn' ? '◐' : '✕'}</span>
            <span style={{ opacity: 0.7 }}>{name.toUpperCase()}</span>
          </div>
        ))}
      </div>

      {/* Status badge */}
      <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 5, padding: '2px 10px', borderRadius: 2,
        border: `1px solid ${statusColor}55`,
        background: `${statusColor}11`,
        fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: '0.1em', color: statusColor }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor,
          animation: sammyStatus === 'busy' ? 'cc-pulse 0.5s infinite' : 'cc-pulse 1.5s infinite' }} />
        SAMMY — {statusLabel}
      </div>

      {/* Avatar */}
      <div style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        width: 48, height: 60, imageRendering: 'pixelated',
        animation: isBusy ? 'sammy-typing 0.3s steps(2) infinite' : isError ? 'sammy-error 0.5s ease-in-out infinite' : 'sammy-idle 3s ease-in-out infinite',
      }}>
        <Image src="/assets/sammy.webp" alt="Sammy Avatar" fill
          style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
          unoptimized />
      </div>
    </div>
  );
}

/* ─── CONFIG ───────────────────────────────────────────────────────────────── */
const SB_URL  = 'https://vkdooutklowctuudjnkl.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZrZG9vdXRrbG93Y3R1dWRqbmtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NjU2NjUsImV4cCI6MjA4NjM0MTY2NX0.ysvYQtcl2hCEOJVczXG-4knzt6oOd74z9iE3Ci_KOWM';

/* ─── API ROUTE HELPERS ─────────────────────────────────────────────────────── */
async function fetchSVGFromAPI(agentId: string, type: 'character' | 'room'): Promise<string> {
  const res = await fetch('/api/command-center/generate-svg', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId, type })
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const data = await res.json();
  return data.svg || '';
}

/* ─── AGENTS ───────────────────────────────────────────────────────────────── */
interface Agent {
  id: string; name: string; role: string; icon: string;
  themeColor: string; accentColor: string; roomType: string;
  patrol: { x: number; y: number }[];
  activity: string;
  metrics: Record<string, number | string>;
}

const AGENTS: Agent[] = [
  {
    id: 'sammy', name: 'Sammy', role: 'COORDINATOR', icon: '🧠',
    themeColor: '#00FFFF', accentColor: '#FF5C3A', roomType: 'control-tower',
    patrol: [{ x: 0.5, y: 0.55 }, { x: 0.3, y: 0.65 }, { x: 0.7, y: 0.6 }],
    activity: 'Coordinating agent operations',
    metrics: { tasks: 47, messages: 23, health: 94 },
  },
  {
    id: 'rebecca', name: 'Rebecca', role: 'CONTENT / UGC', icon: '📲',
    themeColor: '#EC4899', accentColor: '#FCD34D', roomType: 'media-studio',
    patrol: [{ x: 0.45, y: 0.5 }, { x: 0.65, y: 0.5 }, { x: 0.45, y: 0.65 }],
    activity: 'Drafting TikTok for Lookitry',
    metrics: { posts: 12, reach: 4700, engagement: 8.2 },
  },
  {
    id: 'leo', name: 'Leo', role: 'TRADING', icon: '📈',
    themeColor: '#FFD700', accentColor: '#00E5A0', roomType: 'trading-floor',
    patrol: [{ x: 0.5, y: 0.5 }, { x: 0.3, y: 0.6 }, { x: 0.7, y: 0.6 }],
    activity: 'LONG BTC 0.05 @ $67,420',
    metrics: { pnl: 847, trades: 23, positions: 4 },
  },
  {
    id: 'webwizard', name: 'WebWizard', role: 'FRONTEND DEV', icon: '🎨',
    themeColor: '#8B5CF6', accentColor: '#00FFFF', roomType: 'dev-station',
    patrol: [{ x: 0.45, y: 0.52 }, { x: 0.62, y: 0.52 }, { x: 0.45, y: 0.52 }],
    activity: 'Building Command Center UI',
    metrics: { commits: 12, components: 3, lines: 847 },
  },
  {
    id: 'dataalchemist', name: 'DataAlchemist', role: 'BACKEND / DB', icon: '🧪',
    themeColor: '#06B6D4', accentColor: '#FF00FF', roomType: 'server-bay',
    patrol: [{ x: 0.4, y: 0.5 }, { x: 0.6, y: 0.5 }, { x: 0.5, y: 0.65 }],
    activity: 'Indexing project knowledge RAG',
    metrics: { queries: 1247, embeddings: 38, uptime: 99.9 },
  },
  {
    id: 'growthpilot', name: 'GrowthPilot', role: 'SALES / CRM', icon: '🛰️',
    themeColor: '#10B981', accentColor: '#06B6D4', roomType: 'crm-hub',
    patrol: [{ x: 0.5, y: 0.5 }, { x: 0.35, y: 0.62 }, { x: 0.65, y: 0.62 }],
    activity: 'Qualifying 8 new leads',
    metrics: { leads: 139, converted: 11, mrr: 2082 },
  },
  {
    id: 'devguardian', name: 'DevGuardian', role: 'QA / SECURITY', icon: '🛡️',
    themeColor: '#00FF41', accentColor: '#FFD700', roomType: 'lab',
    patrol: [{ x: 0.5, y: 0.5 }, { x: 0.3, y: 0.62 }, { x: 0.7, y: 0.62 }],
    activity: 'All tests passing ✓',
    metrics: { tests: 234, failing: 0, coverage: 89 },
  },
  {
    id: 'architectai', name: 'ArchitectAI', role: 'DEVOPS / VPS', icon: '🏗️',
    themeColor: '#FF003C', accentColor: '#FF8800', roomType: 'war-room',
    patrol: [{ x: 0.5, y: 0.5 }],
    activity: 'Infrastructure nominal',
    metrics: { alerts: 0, uptime: 99.97, deploys: 3 },
  },
];

/* ─── PARTICLE SYSTEM ────────────────────────────────────────────────────────── */
interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number; color: string;
}
function createParticle(x: number, y: number, color: string): Particle {
  return {
    x, y,
    vx: (Math.random() - 0.5) * 0.8,
    vy: -Math.random() * 1.2 - 0.3,
    life: 1,
    decay: 0.008 + Math.random() * 0.006,
    size: 2,
    color,
  };
}
function updateParticle(p: Particle): void {
  p.x += p.vx; p.y += p.vy; p.life -= p.decay;
}
function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  const alpha = p.life * 0.7;
  ctx.fillStyle = p.color + Math.round(alpha * 255).toString(16).padStart(2, '0');
  ctx.fillRect(p.x, p.y, p.size, p.size);
}

/* ─── ANIMATED SPRITE ─────────────────────────────────────────────────────── */
function AnimatedSprite({ color, accent, x, y, isMoving }: {
  color: string; accent: string; x: number; y: number; isMoving: boolean;
}) {
  return (
    <g style={{ transform: `translate(${x - 10}px, ${y - 28}px)`, imageRendering: 'pixelated' }}>
      {/* Outer glow halo — visible when idle */}
      <ellipse cx="10" cy="15" rx="22" ry="30" fill={color} opacity={isMoving ? 0.04 : 0.12} className={isMoving ? '' : 'cc-halo'} />
      {/* Ground shadow */}
      <ellipse
        cx="10" cy="30"
        rx={isMoving ? 14 : 11}
        ry={isMoving ? 2 : 4}
        fill={color}
        opacity={isMoving ? 0.08 : 0.22}
        className={isMoving ? '' : 'cc-shadow-idle'}
      />
      {/* Legs */}
      <g className={isMoving ? 'cc-legs-walk' : 'cc-legs-idle'}>
        <rect x="5" y="22" width="5" height="9" fill={color} opacity="0.9" />
        <rect x="11" y="22" width="5" height="9" fill={color} opacity="0.9" />
        <rect x="3" y="29" width="7" height="4" fill={accent} opacity="1" />
        <rect x="11" y="29" width="7" height="4" fill={accent} opacity="1" />
      </g>
      {/* Body */}
      <g className={isMoving ? '' : 'cc-bounce'}>
        <rect x="3" y="11" width="14" height="13" fill={color} opacity="0.95" />
        <rect x="7" y="14" width="6" height="4" fill={accent} opacity="1" />
      </g>
      {/* Left arm */}
      <g style={{ transformOrigin: '2px 13px' }} className={isMoving ? 'cc-arm-l' : ''}>
        <rect x="0" y="12" width="4" height="9" fill={color} opacity="0.85" />
      </g>
      {/* Right arm */}
      <g style={{ transformOrigin: '17px 13px' }} className={isMoving ? 'cc-arm-r' : ''}>
        <rect x="17" y="12" width="4" height="9" fill={color} opacity="0.85" />
      </g>
      {/* Neck */}
      <rect x="7" y="8" width="6" height="4" fill={color} opacity="0.9" />
      {/* Head */}
      <g className={isMoving ? '' : 'cc-bounce'}>
        <rect x="3" y="0" width="14" height="10" fill={color} opacity="1" rx="1" />
      </g>
      {/* Visor */}
      <rect x="4" y="2" width="12" height="5" fill={accent} opacity="1" rx="0.5" className={isMoving ? '' : 'cc-visor-pulse'} />
      {/* Visor shine */}
      <rect x="5" y="3" width="10" height="2" fill="#ffffff" opacity="0.4" className={isMoving ? '' : 'cc-visor-pulse'} />
    </g>
  );
}

/* ─── ISOMETRIC FLOOR HELPER ───────────────────────────────────────────────── */
function IsoFloor({ color, y0 = 95, rows = 4, cols = 9 }: { color: string; y0?: number; rows?: number; cols?: number }) {
  const tiles = [];
  const tw = 32; const th = 14;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * tw + (r % 2) * (tw / 2) + tw / 2;
      const cy = y0 + r * th;
      tiles.push(
        <polygon
          key={`${r}-${c}`}
          points={`${cx},${cy - th / 2} ${cx + tw / 2},${cy} ${cx},${cy + th / 2} ${cx - tw / 2},${cy}`}
          fill="none" stroke={color} strokeWidth="0.5" opacity="0.25"
        />
      );
    }
  }
  return <g>{tiles}</g>;
}

/* ─── MONITORS BACK WALL ───────────────────────────────────────────────────── */
function BackWallMonitors({ color, count = 3, y = 18 }: { color: string; count?: number; y?: number }) {
  const positions = count === 3 ? [50, 120, 190] : count === 2 ? [80, 160] : [120];
  return (
    <g>
      {positions.map((x, i) => (
        <g key={i}>
          <rect x={x} y={y} width={44} height={28} rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.7" />
          {/* Screen lines */}
          {[4, 8, 12, 16, 20].map((ly, li) => (
            <rect key={li} x={x + 3} y={y + ly} width={li % 3 === 0 ? 38 : 28} height={1} fill={color} opacity="0.3" />
          ))}
          <rect x={x + 1} y={y + 1} width={42} height={4} fill={color} opacity="0.08" />
        </g>
      ))}
    </g>
  );
}

/* ─── ROOM SVG BACKGROUNDS ─────────────────────────────────────────────────── */
function ControlTowerRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#050810" />
      <rect width="280" height="95" fill="#07091a" />
      <BackWallMonitors color={color} count={3} />
      {/* Left wall panel */}
      <rect x="0" y="95" width="36" height="85" fill="#060913" />
      {[20, 30, 40, 50, 60, 70].map((y, i) => (
        <rect key={i} x="8" y={y + 95} width="6" height="2" fill={i % 2 === 0 ? color : accent} opacity="0.6" />
      ))}
      <IsoFloor color={color} />
      {/* Radar circle on floor */}
      <circle cx="140" cy="148" r="38" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <circle cx="140" cy="148" r="25" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <circle cx="140" cy="148" r="12" fill="none" stroke={color} strokeWidth="0.4" opacity="0.2" />
      {/* Command console */}
      <ellipse cx="140" cy="148" rx="45" ry="12" fill={color} opacity="0.05" />
      <rect x="110" y="140" width="60" height="8" rx="3" fill="#0a1525" stroke={color} strokeWidth="0.5" opacity="0.8" />
      {[116, 126, 136, 146, 156].map((x, i) => (
        <rect key={i} x={x} y="142" width="6" height="4" rx="0.5" fill={i === 2 ? color : '#1a2840'} opacity="0.9" />
      ))}
      {/* Radar sweep line (CSS animated) */}
      <line x1="140" y1="148" x2="140" y2="112" stroke={color} strokeWidth="1.5" opacity="0.5"
        className="cc-radar-sweep" style={{ transformOrigin: '140px 148px' }} />
      {/* Floor glow */}
      <ellipse cx="140" cy="158" rx="70" ry="18" fill={color} opacity="0.035" />
    </>
  );
}

function MediaStudioRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#060509" />
      <rect width="280" height="95" fill="#09060f" />
      <BackWallMonitors color={color} count={2} />
      {/* Social icons on wall */}
      {[60, 90, 120, 150, 180, 210].map((x, i) => (
        <rect key={i} x={x} y="52" width="10" height="10" rx="2" fill={color} opacity={0.1 + i * 0.05} />
      ))}
      <IsoFloor color={color} />
      {/* Ring light */}
      <circle cx="140" cy="135" r="30" fill="none" stroke={color} strokeWidth="2" opacity="0.25" />
      <circle cx="140" cy="135" r="22" fill="none" stroke={accent} strokeWidth="1" opacity="0.2" />
      {/* Camera stand */}
      <rect x="133" y="125" width="14" height="18" rx="2" fill="#1a0d20" stroke={color} strokeWidth="0.5" />
      <ellipse cx="140" cy="125" rx="8" ry="5" fill={color} opacity="0.4" />
      {/* LED indicators */}
      {[5, 12, 19, 26].map((r, i) => (
        <circle key={i} cx={113 + i * 18} cy="158" r="2.5" fill={i === 0 ? color : '#1a1a2e'} opacity="0.9"
          className={i === 0 ? 'cc-blink' : ''} />
      ))}
      <ellipse cx="140" cy="162" rx="60" ry="14" fill={color} opacity="0.03" />
    </>
  );
}

function TradingFloorRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#070700" />
      <rect width="280" height="95" fill="#0a0900" />
      {/* 4 monitors with charts */}
      {[35, 95, 155, 215].map((x, i) => (
        <g key={i}>
          <rect x={x} y="15" width="42" height="30" rx="1" fill="#090900" stroke={color} strokeWidth="0.5" opacity="0.8" />
          {/* Candlestick chart */}
          {[0, 6, 12, 18, 24, 30].map((cx, ci) => {
            const h = [10, 6, 14, 8, 12, 9][ci];
            const isGreen = ci % 2 === 0;
            return (
              <rect key={ci} x={x + 4 + cx} y={45 - h - 8} width="4" height={h} rx="0.5"
                fill={isGreen ? accent : '#FF4444'} opacity="0.85" />
            );
          })}
        </g>
      ))}
      <IsoFloor color={color} />
      {/* Ticker tape */}
      <rect x="0" y="155" width="280" height="10" fill={color} opacity="0.07" />
      <text x="10" y="162" fill={color} fontSize="6" opacity="0.6" fontFamily="monospace">
        BTC $67,420 ▲  ETH $3,247 ▼  SOL $142 ▲  ADA $0.47 ▲  BNB $589 ▲  AVAX $38 ▼
      </text>
      {/* Trading desk */}
      <rect x="90" y="125" width="100" height="22" rx="2" fill="#1a1500" stroke={color} strokeWidth="0.5" />
      {[100, 120, 140, 160, 175].map((x, i) => (
        <rect key={i} x={x} y="128" width="12" height="8" rx="0.5" fill="#0a0900" stroke={color} strokeWidth="0.3" opacity="0.9" />
      ))}
      <ellipse cx="140" cy="155" rx="65" ry="16" fill={color} opacity="0.04" />
    </>
  );
}

function DevStationRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#050408" />
      <rect width="280" height="95" fill="#070510" />
      <BackWallMonitors color={color} count={3} />
      {/* Code lines on wall monitors */}
      <IsoFloor color={color} />
      {/* Dual main monitors */}
      {[70, 155].map((x, i) => (
        <g key={i}>
          <rect x={x} y="100" width="55" height="38" rx="1" fill="#060310" stroke={color} strokeWidth="0.8" opacity="0.95" />
          {[4, 8, 12, 16, 20, 24, 28].map((ly, li) => (
            <rect key={li} x={x + 3} y={100 + ly} width={li % 3 === 0 ? 48 : li % 3 === 1 ? 35 : 42}
              height="2" fill={li % 4 === 0 ? accent : color} opacity={0.2 + (li % 3) * 0.15} className="cc-code-line" />
          ))}
        </g>
      ))}
      {/* Keyboard */}
      <rect x="105" y="143" width="70" height="12" rx="2" fill="#1a1030" stroke={color} strokeWidth="0.4" opacity="0.9" />
      {[0, 1, 2, 3, 4].map(r =>
        [0, 1, 2, 3, 4, 5, 6].map(c => (
          <rect key={`${r}-${c}`} x={108 + c * 9} y={145 + r * 2} width="7" height="1.5"
            rx="0.3" fill={color} opacity="0.15" />
        ))
      )}
      {/* Git graph */}
      <circle cx="245" cy="110" r="2" fill={color} opacity="0.9" />
      <circle cx="245" cy="120" r="2" fill={accent} opacity="0.9" />
      <circle cx="245" cy="130" r="2" fill={color} opacity="0.9" />
      <line x1="245" y1="110" x2="245" y2="130" stroke={color} strokeWidth="0.5" opacity="0.4" />
      <ellipse cx="140" cy="160" rx="65" ry="15" fill={color} opacity="0.04" />
    </>
  );
}

function ServerBayRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#050810" />
      <rect width="280" height="95" fill="#060a18" />
      <IsoFloor color={color} />
      {/* Server racks */}
      {[30, 80, 130, 180, 230].map((x, ri) => (
        <g key={ri}>
          <rect x={x} y="20" width="32" height="135" rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.85" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <rect key={i} x={x + 3} y={25 + i * 12} width="26" height="8" rx="0.5"
              fill="#06090f" stroke={color} strokeWidth="0.3" opacity="0.9" />
          ))}
          {/* LEDs per rack */}
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <circle key={i} cx={x + 28} cy={29 + i * 12} r="1.5"
              fill={(ri + i) % 3 === 0 ? color : (ri + i) % 3 === 1 ? accent : '#0a1020'}
              opacity="0.9"
              className={(ri + i) % 3 === 0 ? 'cc-blink' : ''} />
          ))}
        </g>
      ))}
      {/* Cable trays */}
      <rect x="0" y="158" width="280" height="6" fill={color} opacity="0.06" />
      <ellipse cx="140" cy="162" rx="90" ry="14" fill={color} opacity="0.025" />
    </>
  );
}

function CrmHubRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#040b06" />
      <rect width="280" height="95" fill="#050d07" />
      <BackWallMonitors color={color} count={3} />
      <IsoFloor color={color} />
      {/* Funnel chart */}
      <polygon points="110,100 170,100 160,115 120,115" fill={color} opacity="0.15" stroke={color} strokeWidth="0.5" />
      <polygon points="120,115 160,115 152,128 128,128" fill={color} opacity="0.2" stroke={color} strokeWidth="0.5" />
      <polygon points="128,128 152,128 146,140 134,140" fill={color} opacity="0.3" stroke={color} strokeWidth="0.5" />
      {/* Lead nodes */}
      {[50, 80, 110, 200, 230].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy="155" r="5" fill={i < 2 ? color : '#1a2010'} opacity="0.8" />
          <line x1={x} y1="155" x2="140" y2="140" stroke={color} strokeWidth="0.3" opacity="0.2" />
        </g>
      ))}
      {/* MRR counter */}
      <rect x="200" y="100" width="65" height="30" rx="2" fill="#061a0c" stroke={color} strokeWidth="0.5" />
      <text x="208" y="112" fill={color} fontSize="6" opacity="0.7" fontFamily="monospace">MRR</text>
      <text x="205" y="124" fill={color} fontSize="9" fontWeight="bold" opacity="0.95" fontFamily="monospace">$2,082</text>
      <ellipse cx="140" cy="162" rx="70" ry="15" fill={color} opacity="0.04" />
    </>
  );
}

function LabRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#040a04" />
      <rect width="280" height="95" fill="#050d05" />
      <BackWallMonitors color={color} count={3} />
      <IsoFloor color={color} />
      {/* Test rigs */}
      {[40, 100, 160, 220].map((x, ri) => (
        <g key={ri}>
          <rect x={x} y="105" width="40" height="45" rx="1" fill="#060d06" stroke={color} strokeWidth="0.4" opacity="0.8" />
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <g key={i}>
              <rect x={x + 5} y={110 + i * 5} width="30" height="3" rx="0.5"
                fill="#04080a" stroke={color} strokeWidth="0.2" opacity="0.8" />
              <circle cx={x + 37} cy={111.5 + i * 5} r="1.5"
                fill={(ri + i) % 3 === 0 ? color : (ri + i) % 3 === 1 ? accent : '#ff4444'}
                opacity="0.9" className={(ri + i) % 2 === 0 ? 'cc-blink' : ''} />
            </g>
          ))}
        </g>
      ))}
      {/* BUILD PASSING text */}
      <rect x="95" y="160" width="90" height="12" rx="2" fill={color} opacity="0.12" />
      <text x="105" y="169" fill={color} fontSize="7" fontFamily="monospace" opacity="0.9">✓ BUILD PASSING</text>
      <ellipse cx="140" cy="160" rx="70" ry="14" fill={color} opacity="0.04" />
    </>
  );
}

function WarRoomRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#0a0104" />
      <rect width="280" height="95" fill="#0d0206" />
      <BackWallMonitors color={color} count={3} />
      {/* Network map */}
      {[[50, 40], [130, 55], [210, 40], [90, 70], [170, 70]].map(([nx, ny], i) => (
        <circle key={i} cx={nx} cy={ny} r="4" fill={color} opacity="0.3" className="cc-blink" />
      ))}
      {[[50, 40], [130, 55], [210, 40], [90, 70], [170, 70]].map(([nx, ny], i) =>
        i < 4 ? <line key={i} x1={nx} y1={ny} x2={[130, 210, 90, 170][i]} y2={[55, 40, 70, 70][i]}
          stroke={color} strokeWidth="0.4" opacity="0.3" /> : null
      )}
      <IsoFloor color={color} />
      {/* Radar circle */}
      <circle cx="140" cy="142" r="42" fill="none" stroke={color} strokeWidth="0.6" opacity="0.25" />
      <circle cx="140" cy="142" r="28" fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <circle cx="140" cy="142" r="14" fill="none" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <circle cx="140" cy="142" r="3" fill={color} opacity="0.5" />
      {/* Radar blips */}
      <circle cx="162" cy="130" r="2.5" fill={accent} opacity="0.8" className="cc-blink" />
      <circle cx="118" cy="158" r="2" fill={accent} opacity="0.7" className="cc-blink" />
      {/* Sweep line */}
      <line x1="140" y1="142" x2="140" y2="102" stroke={color} strokeWidth="2" opacity="0.5"
        className="cc-radar-sweep" style={{ transformOrigin: '140px 142px' }} />
      <ellipse cx="140" cy="158" rx="68" ry="16" fill={color} opacity="0.04" />
    </>
  );
}

const ROOM_RENDERERS: Record<string, (props: { color: string; accent: string }) => React.ReactNode> = {
  'control-tower': (p) => <ControlTowerRoom {...p} />,
  'media-studio':  (p) => <MediaStudioRoom {...p} />,
  'trading-floor': (p) => <TradingFloorRoom {...p} />,
  'dev-station':   (p) => <DevStationRoom {...p} />,
  'server-bay':    (p) => <ServerBayRoom {...p} />,
  'crm-hub':       (p) => <CrmHubRoom {...p} />,
  'lab':           (p) => <LabRoom {...p} />,
  'war-room':      (p) => <WarRoomRoom {...p} />,
};

/* ─── AGENT ROOM PANEL ─────────────────────────────────────────────────────── */
function AgentRoomPanel({ agent, charPos, onClick, generatedChar, generatedRoom, isMoving }: {
  agent: Agent;
  charPos: { x: number; y: number };
  onClick: () => void;
  generatedChar?: string;
  generatedRoom?: string;
  isMoving: boolean;
}) {
  const c = agent.themeColor;
  const ca = agent.accentColor;
  const firstMetricKey = Object.keys(agent.metrics)[0];
  const firstMetricVal = agent.metrics[firstMetricKey];
  const thirdMetricKey = Object.keys(agent.metrics)[2];
  const thirdMetricVal = agent.metrics[thirdMetricKey];

  return (
    <button
      onClick={onClick}
      className="cc-room-panel"
      style={{
        '--theme': c,
        borderColor: `${c}44`,
        boxShadow: `0 0 18px ${c}18, inset 0 0 24px #00000066`,
      } as React.CSSProperties}
    >
      {/* Room SVG / Custom Image */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '280/180', overflow: 'hidden' }}>
        {/* SAMMY gets the immersive room */}
        {agent.id === 'sammy' ? (
          <SammyRoom agentId="sammy" />
        ) : (
          <svg viewBox="0 0 280 180" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style={{ position: 'relative' }}>
            {generatedRoom && generatedRoom.includes('<svg') ? (
              <g dangerouslySetInnerHTML={{ __html: generatedRoom }} />
            ) : (
              ROOM_RENDERERS[agent.roomType]?.({ color: c, accent: ca }) ?? null
            )}
            {/* Character — AI generated or fallback */}
            {generatedChar && generatedChar.includes('<svg') ? (
              <g dangerouslySetInnerHTML={{ __html: generatedChar }}
                 transform={`translate(${charPos.x - 12}, ${charPos.y - 36})`}
                 style={{ imageRendering: 'pixelated' }}
                 className={isMoving ? 'walking' : ''}
              />
            ) : (
              <AnimatedSprite color={c} accent={ca}
                x={charPos.x}
                y={charPos.y}
                isMoving={isMoving} />
            )}
          </svg>
        )}
          {/* Status badge */}
          <div style={{
            position: 'absolute', top: 6, left: 6,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '2px 8px', borderRadius: 2,
            border: `1px solid ${c}44`,
            background: `${c}11`,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: '0.1em', color: c,
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: c,
              animation: 'cc-pulse 1.5s ease-in-out infinite' }} />
            {agent.name.toUpperCase()} — ACTIVE
          </div>
        </div>

      {/* Metrics bar */}
      <div style={{
        padding: '8px 10px 6px',
        borderTop: `1px solid ${c}22`,
        background: '#030508',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: c, letterSpacing: '0.15em', opacity: 0.8 }}>
            {agent.role}
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 8, color: '#64748b' }}>{agent.icon}</span>
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
          {Object.entries(agent.metrics).map(([k, v]) => (
            <div key={k} style={{
              flex: 1, background: `${c}08`, border: `1px solid ${c}22`,
              borderRadius: 3, padding: '2px 4px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'monospace', fontSize: 10, color: c, fontWeight: 700 }}>{v}</div>
              <div style={{ fontFamily: 'monospace', fontSize: 7, color: '#64748b', textTransform: 'uppercase' }}>{k}</div>
            </div>
          ))}
        </div>
        {/* Progress bar */}
        <div style={{ height: 2, background: '#1e293b', borderRadius: 1, overflow: 'hidden', marginBottom: 4 }}>
          <div style={{
            height: '100%', background: c,
            width: `${typeof thirdMetricVal === 'number' ? Math.min(thirdMetricVal, 100) : 75}%`,
            transition: 'width 1s ease',
          }} />
        </div>
        <p style={{ fontFamily: 'monospace', fontSize: 8, color: '#475569', margin: 0, overflow: 'hidden',
          textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.activity}
        </p>
      </div>
    </button>
  );
}

/* ─── AGENT MODAL ──────────────────────────────────────────────────────────── */
function AgentModal({ agent, realData, onClose }: { agent: Agent; realData: any; onClose: () => void }) {
  const c = agent.themeColor;
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: '#0a0d17', border: `1px solid ${c}44`,
        boxShadow: `0 0 40px ${c}22`, borderRadius: 12,
        width: '100%', maxWidth: 480, padding: 28,
        fontFamily: "'JetBrains Mono', monospace",
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12,
            background: `${c}18`, border: `2px solid ${c}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
          }}>{agent.icon}</div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>{agent.name}</h3>
            <p style={{ margin: 0, fontSize: 10, color: c, letterSpacing: '0.15em', marginTop: 3 }}>{agent.role}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none',
            color: '#64748b', fontSize: 22, cursor: 'pointer', padding: 4 }}>×</button>
        </div>
        {/* Metrics grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
          {Object.entries(agent.metrics).map(([k, v]) => (
            <div key={k} style={{
              background: `${c}08`, border: `1px solid ${c}22`,
              borderRadius: 8, padding: '10px 12px', textAlign: 'center',
            }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: c }}>{v}</div>
              <div style={{ fontSize: 8, color: '#64748b', textTransform: 'uppercase', marginTop: 2, letterSpacing: '0.1em' }}>{k}</div>
            </div>
          ))}
        </div>
        {/* Current activity */}
        <div style={{
          background: `${c}06`, border: `1px solid ${c}22`,
          borderRadius: 8, padding: '10px 14px', marginBottom: 12,
        }}>
          <div style={{ fontSize: 8, color: '#64748b', letterSpacing: '0.15em', marginBottom: 4 }}>CURRENT ACTIVITY</div>
          <div style={{ fontSize: 12, color: '#f8fafc' }}>{agent.activity}</div>
        </div>
        {/* Status */}
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1, background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 8, color: '#64748b', letterSpacing: '0.1em' }}>STATUS</div>
            <div style={{ fontSize: 11, color: c, marginTop: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, animation: 'cc-pulse 1.5s infinite' }} />
              ACTIVE
            </div>
          </div>
          <div style={{ flex: 1, background: `${c}08`, border: `1px solid ${c}22`, borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 8, color: '#64748b', letterSpacing: '0.1em' }}>ROOM TYPE</div>
            <div style={{ fontSize: 11, color: '#f8fafc', marginTop: 2 }}>{agent.roomType.replace('-', ' ').toUpperCase()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── STAR FIELD CANVAS ────────────────────────────────────────────────────── */
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      o: Math.random() * 0.6 + 0.2,
      speed: Math.random() * 0.008 + 0.003,
      phase: Math.random() * Math.PI * 2,
    }));
    let raf = 0;
    const draw = (t: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        const opacity = s.o * (0.7 + 0.3 * Math.sin(t * s.speed + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ─── SUPABASE FETCH ───────────────────────────────────────────────────────── */
async function sbFetch(table: string, select = 'count', filter?: string) {
  const filterStr = filter ? `&${filter}` : '';
  const url = `${SB_URL}/rest/v1/${table}?select=${select}${filterStr}`;
  const res = await fetch(url, {
    headers: {
      apikey: SB_ANON,
      Authorization: `Bearer ${SB_ANON}`,
      'Content-Type': 'application/json',
      'Prefer': 'count=exact'
    },
  });
  if (!res.ok) {
    console.warn(`[sbFetch] ${table} query failed: ${res.status} — ${filter}`);
    return null;
  }
  const count = res.headers.get('content-range')?.split('/')?.[1];
  return count ? parseInt(count, 10) : null;
}

async function sbQuery(table: string, select: string, filter?: string) {
  const url = `${SB_URL}/rest/v1/${table}?select=${select}${filter ? '&' + filter : ''}`;
  const res = await fetch(url, {
    headers: { apikey: SB_ANON, Authorization: `Bearer ${SB_ANON}`, 'Content-Type': 'application/json' },
  });
  return res.ok ? res.json() : null;
}

/* ─── MAIN PAGE ─────────────────────────────────────────────────────────────── */
export default function CommandCenterPage() {
  const [clock, setClock]               = useState('--:--:--');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [charPositions, setCharPositions] = useState<Record<string, { x: number; y: number }>>(() =>
    Object.fromEntries(AGENTS.map(a => [a.id, { x: 140, y: 155 }]))
  );
  const [speed] = useState(1);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const waypointTimer = useRef<Record<string, number>>({});
  const waypointIdx = useRef<Record<string, number>>({});
  const particlesRef = useRef<Record<string, Particle[]>>({});
  const frameRef = useRef(0);
  const rafRef = useRef<number>(0);
  const roomCanvases = useRef<Record<string, HTMLCanvasElement | null>>({});
  const starsCanvas = useRef<HTMLCanvasElement | null>(null);
  const charPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const patrolT = useRef<Record<string, number>>({});

  // Init patrol
  useEffect(() => {
    AGENTS.forEach(a => {
      charPositionsRef.current[a.id] = { x: 140, y: 155 };
      patrolT.current[a.id] = 0;
      waypointIdx.current[a.id] = 0;
      particlesRef.current[a.id] = [];
    });
  }, []);
  const [realData, setRealData] = useState({
    brands: 0, activeProducts: 0,
    generationsMonth: 0, mrr: 0,
    agentsOnline: AGENTS.length,
  });

  // AI-generated SVG assets
  const [generatedCharacters, setGeneratedCharacters] = useState<Record<string, string>>({});
  const [generatedRooms, setGeneratedRooms] = useState<Record<string, string>>({});
  const [isGeneratingAssets, setIsGeneratingAssets] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [isMovingMap, setIsMovingMap] = useState<Record<string, boolean>>({});

  // Clock
  useEffect(() => {
    const id = setInterval(() => setClock(new Date().toLocaleTimeString('en-US', { hour12: false })), 1000);
    return () => clearInterval(id);
  }, []);

  // Generate AI assets on mount
  useEffect(() => {
    console.log('[CommandCenter] Starting asset generation via API route...');
    setIsGeneratingAssets(true);
    const chars: Record<string, string> = {};
    const rooms: Record<string, string> = {};

    const generate = async () => {
      for (const agent of AGENTS) {
        setGenerationProgress(`Generating ${agent.name}'s character...`);
        try {
          const charSVG = await fetchSVGFromAPI(agent.id, 'character');
          console.log(`[CommandCenter] Character ${agent.name}:`, charSVG.substring(0, 80));
          if (charSVG.includes('<svg')) chars[agent.id] = charSVG;
        } catch (e) {
          console.error(`[CommandCenter] Error generating character for ${agent.name}:`, e);
        }

        setGenerationProgress(`Generating ${agent.name}'s room...`);
        try {
          const roomSVG = await fetchSVGFromAPI(agent.id, 'room');
          if (roomSVG.includes('<svg')) rooms[agent.id] = roomSVG;
        } catch (e) {
          console.error(`[CommandCenter] Error generating room for ${agent.id}:`, e);
        }
      }

      setGeneratedCharacters(chars);
      setGeneratedRooms(rooms);
      setIsGeneratingAssets(false);
      setGenerationProgress('');
      console.log('[CommandCenter] Asset generation complete!');
      console.log('[CommandCenter] Generated characters:', Object.keys(chars));
      console.log('[CommandCenter] Generated rooms:', Object.keys(rooms));
    };

    generate();
  }, []);

  // Fetch real Supabase data
  useEffect(() => {
    const load = async () => {
      try {
        const [brands, products, gens, payments] = await Promise.all([
          sbFetch('brands', 'count'),
          sbFetch('products', 'count', 'is_active=eq.true'),
          sbFetch('generations', 'count', `created_at=gte.${new Date(Date.now()-30*86400e3).toISOString().split('T')[0]}`),
          sbQuery('subscription_payments', 'amount', 'status=eq.completed'),
        ]);
        const mrr = payments?.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) ?? 0;
        setRealData({
          brands: brands ?? 0,
          activeProducts: products ?? 0,
          generationsMonth: gens ?? 0,
          mrr,
          agentsOnline: AGENTS.length,
        });
      } catch (e) { /* silent */ }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  // Character movement + isMoving state (smooth lerp)
  useEffect(() => {
    const id = setInterval(() => {
      const spd = speedRef.current;
      const newMoving: Record<string, boolean> = {};
      const next: Record<string, { x: number; y: number }> = {};
      for (const agent of AGENTS) {
        if (agent.patrol.length < 2) { next[agent.id] = charPositionsRef.current[agent.id]; continue; }
        const t = patrolT.current[agent.id] + 0.003 * spd;
        if (t >= 1) {
          patrolT.current[agent.id] = 0;
          const from = agent.patrol[waypointIdx.current[agent.id] ?? 0];
          const to = agent.patrol[(waypointIdx.current[agent.id] + 1) % agent.patrol.length];
          waypointIdx.current[agent.id] = (waypointIdx.current[agent.id] + 1) % agent.patrol.length;
          next[agent.id] = { x: to.x * 230 + 25, y: to.y * 120 + 55 };
          newMoving[agent.id] = true;
        } else {
          patrolT.current[agent.id] = t;
          const from = agent.patrol[waypointIdx.current[agent.id] ?? 0];
          const to = agent.patrol[(waypointIdx.current[agent.id] + 1) % agent.patrol.length];
          next[agent.id] = {
            x: (from.x + (to.x - from.x) * t) * 230 + 25,
            y: (from.y + (to.y - from.y) * t) * 120 + 55,
          };
          newMoving[agent.id] = patrolT.current[agent.id] > 0.9;
        }
      }
      charPositionsRef.current = next;
      setCharPositions(next);
      setIsMovingMap(newMoving);
    }, 50);
    return () => clearInterval(id);
  }, []);

  const formatMrr = (n: number) => n > 0 ? `$${n.toLocaleString('es-CO')}` : '—';

  return (
    <>
      <StarField />

      <div style={{
        position: 'relative', zIndex: 1, minHeight: '100vh',
        fontFamily: "'JetBrains Mono', monospace",
      }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(3,3,12,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid #00FF4118',
          padding: '10px 24px',
        }}>
          <div style={{ maxWidth: 1600, margin: '0 auto' }}>
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00FF41', display: 'block', animation: 'cc-pulse 2s infinite' }} />
                </div>
                <h1 style={{ fontSize: 14, fontWeight: 700, color: '#00FF41',
                  textShadow: '0 0 12px #00FF4166', letterSpacing: '0.2em' }}>
                  LOOKITRY COMMAND CENTER
                </h1>
                <span style={{ fontSize: 10, color: '#1e4d2e', letterSpacing: '0.1em' }}>◉ ALL SYSTEMS ACTIVE</span>
                {isGeneratingAssets && (
                  <span style={{ fontSize: 9, color: '#00FFFF', marginLeft: 8 }}>[AI GEN: {generationProgress}]</span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 11 }}>
                <span style={{ color: '#00FF41', opacity: 0.7 }}>{clock}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1x', '2x', '5x'].map(s => (
                    <button key={s} style={{
                      padding: '2px 8px', borderRadius: 3, fontSize: 9, fontFamily: 'monospace',
                      border: '1px solid #1e293b', background: s === '1x' ? '#00FF4118' : 'transparent',
                      color: s === '1x' ? '#00FF41' : '#64748b', cursor: 'pointer',
                    }}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
            {/* Metrics row */}
            <div style={{ display: 'flex', gap: 24, marginTop: 6, flexWrap: 'wrap' }}>
              {[
                { label: 'CLIENTES', value: realData.brands, color: '#00FFFF' },
                { label: 'PRODUCTOS ACTIVOS', value: realData.activeProducts, color: '#8B5CF6' },
                { label: 'GENERACIONES/MES', value: realData.generationsMonth, color: '#10B981' },
                { label: 'PAGOS TOTALES', value: formatMrr(realData.mrr), color: '#FFD700' },
                { label: 'AGENTES ONLINE', value: `${realData.agentsOnline}/${AGENTS.length}`, color: '#00FF41' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ fontSize: 9, color: '#64748b' }}>
                  <span style={{ color, fontWeight: 700, fontSize: 11 }}>{value}</span>
                  {' '}<span style={{ opacity: 0.6 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        {/* ── AGENT GRID ──────────────────────────────────────────────── */}
        <main style={{ maxWidth: 1600, margin: '0 auto', padding: '20px 16px 40px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 14,
          }}>
            {AGENTS.map(agent => (
              <AgentRoomPanel
                key={agent.id}
                agent={agent}
                charPos={charPositions[agent.id] ?? { x: 140, y: 155 }}
                onClick={() => setSelectedAgent(agent)}
                generatedChar={generatedCharacters[agent.id]}
                generatedRoom={generatedRooms[agent.id]}
                isMoving={!!isMovingMap[agent.id]}
              />
            ))}
          </div>

          {/* Connection lines hint */}
          <div style={{ textAlign: 'center', marginTop: 28, fontSize: 9, color: '#1e3040',
            letterSpacing: '0.2em', fontFamily: 'monospace' }}>
            LOOKITRY OPERATIONS CENTER — REAL DATA — CLICK ROOM TO INSPECT AGENT
          </div>
        </main>
      </div>

      {/* Modal */}
      {selectedAgent && (
        <AgentModal
          agent={selectedAgent}
          realData={realData}
          onClose={() => setSelectedAgent(null)}
        />
      )}
    </>
  );
}
