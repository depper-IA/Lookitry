'use client';

/* ─── SAMMY ROOM ─────────────────────────────────────────────────────────────
   Sammy Control Tower — Full immersive room with SVG background integration.
   Avatar stands inside the room, not on top of it.
────────────────────────────────────────────────────────────────────────── */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HeartbeatData, AgentStatus } from './types';
import { SammySprite } from './SammySprite';

interface Props {
  agentStatus: AgentStatus;
  heartbeatData?: HeartbeatData | null;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

/* ─── SVG ROOM BACKGROUND ─────────────────────────────────────────────────── */
const ROOM_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 497" style="position:absolute;top:0;left:0;width:100%;height:100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#030508"/>
      <stop offset="100%" stop-color="#080815"/>
    </linearGradient>
    <linearGradient id="floor" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#00FFFF" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#00FFFF" stop-opacity="0.02"/>
    </linearGradient>
    <filter id="glow"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="softglow"><feGaussianBlur stdDeviation="6"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  
  <!-- Background -->
  <rect width="700" height="497" fill="url(#bg)"/>
  
  <!-- City skyline -->
  <g fill="#0a0f18">
    <polygon points="0,250 40,200 40,300 0,300"/>
    <polygon points="40,300 80,230 80,300 40,300"/>
    <polygon points="80,300 130,180 130,300 80,300"/>
    <polygon points="130,300 180,150 180,300 130,300"/>
    <polygon points="180,300 240,120 240,300 180,300"/>
    <polygon points="240,300 290,170 290,300 240,300"/>
    <polygon points="290,300 350,100 350,300 290,300"/>
    <polygon points="350,300 400,140 400,300 350,300"/>
    <polygon points="400,300 460,110 460,300 400,300"/>
    <polygon points="460,300 510,160 510,300 460,300"/>
    <polygon points="510,300 560,130 560,300 510,300"/>
    <polygon points="560,300 610,180 610,300 560,300"/>
    <polygon points="610,300 660,200 660,300 610,300"/>
    <polygon points="660,300 700,230 700,300 660,300"/>
  </g>
  
  <!-- Building windows -->
  <g fill="#00FFFF" opacity="0.5" filter="url(#glow)">
    <rect x="50" y="210" width="3" height="5"/><rect x="60" y="220" width="3" height="5"/><rect x="45" y="235" width="3" height="5"/>
    <rect x="100" y="190" width="3" height="5"/><rect x="115" y="200" width="3" height="5"/><rect x="130" y="185" width="3" height="5"/>
    <rect x="190" y="160" width="3" height="5"/><rect x="205" y="170" width="3" height="5"/>
    <rect x="260" y="130" width="3" height="5"/><rect x="275" y="145" width="3" height="5"/>
    <rect x="310" y="120" width="3" height="5"/><rect x="325" y="135" width="3" height="5"/><rect x="340" y="115" width="3" height="5"/>
    <rect x="420" y="150" width="3" height="5"/><rect x="440" y="130" width="3" height="5"/>
    <rect x="480" y="140" width="3" height="5"/><rect x="495" y="155" width="3" height="5"/>
    <rect x="530" y="120" width="3" height="5"/><rect x="545" y="135" width="3" height="5"/>
    <rect x="580" y="160" width="3" height="5"/><rect x="595" y="175" width="3" height="5"/>
    <rect x="640" y="200" width="3" height="5"/><rect x="655" y="210" width="3" height="5"/>
  </g>
  
  <!-- Main control desk -->
  <rect x="80" y="310" width="540" height="25" fill="#0a1525" stroke="#00FFFF" stroke-opacity="0.3"/>
  <rect x="80" y="305" width="540" height="8" fill="#0a1525" stroke="#00FFFF" stroke-opacity="0.5"/>
  <line x1="80" y1="313" x2="620" y2="313" stroke="#00FFFF" stroke-opacity="0.6" stroke-width="2" filter="url(#glow)"/>
  
  <!-- Monitors -->
  <g>
    <!-- Left -->
    <rect x="100" y="210" width="90" height="70" fill="#050810" stroke="#00FFFF" stroke-opacity="0.4"/>
    <rect x="108" y="218" width="74" height="50" fill="#0a1015"/>
    <line x1="108" y1="225" x2="182" y2="225" stroke="#00FFFF" stroke-opacity="0.2"/>
    <text x="112" y="238" fill="#00FFFF" font-size="7" font-family="monospace" opacity="0.7">SYSTEM STATUS</text>
    <circle cx="170" cy="235" r="4" fill="#00FF41" filter="url(#glow)"/>
    <circle cx="170" cy="250" r="4" fill="#00FF41" filter="url(#glow)"/>
    
    <!-- Center (largest) -->
    <rect x="250" y="170" width="200" height="110" fill="#050810" stroke="#00FFFF" stroke-opacity="0.5"/>
    <rect x="260" y="180" width="180" height="90" fill="#0a1015"/>
    <rect x="260" y="180" width="180" height="12" fill="#00FFFF" fill-opacity="0.08"/>
    <text x="268" y="190" fill="#00FFFF" font-size="8" font-family="monospace">COMMAND CENTER v1.0</text>
    <line x1="260" y1="210" x2="440" y2="210" stroke="#00FFFF" stroke-opacity="0.2"/>
    <line x1="260" y1="230" x2="380" y2="230" stroke="#00FFFF" stroke-opacity="0.15"/>
    <line x1="260" y1="250" x2="350" y2="250" stroke="#00FFFF" stroke-opacity="0.1"/>
    <rect x="270" y="255" width="35" height="8" fill="#FF5C3A" opacity="0.6"/>
    <rect x="310" y="255" width="35" height="8" fill="#00FF41" opacity="0.6"/>
    <text x="360" y="262" fill="#00FFFF" font-size="7" font-family="monospace" opacity="0.6">◉ ACTIVE</text>
    
    <!-- Right -->
    <rect x="510" y="220" width="90" height="60" fill="#050810" stroke="#00FFFF" stroke-opacity="0.4"/>
    <rect x="518" y="228" width="74" height="44" fill="#0a1015"/>
    <text x="525" y="242" fill="#FF5C3A" font-size="7" font-family="monospace" opacity="0.6">ALERTS</text>
    <text x="525" y="256" fill="#00FFFF" font-size="7" font-family="monospace" opacity="0.4">NONE ACTIVE</text>
  </g>
  
  <!-- Floor with perspective -->
  <polygon points="0,335 700,335 700,497 0,497" fill="url(#floor)"/>
  <line x1="0" y1="360" x2="700" y2="360" stroke="#00FFFF" stroke-opacity="0.04"/>
  <line x1="0" y1="400" x2="700" y2="400" stroke="#00FFFF" stroke-opacity="0.03"/>
  <line x1="0" y1="450" x2="700" y2="450" stroke="#00FFFF" stroke-opacity="0.02"/>
  <line x1="350" y1="335" x2="0" y2="497" stroke="#00FFFF" stroke-opacity="0.05"/>
  <line x1="350" y1="335" x2="700" y2="497" stroke="#00FFFF" stroke-opacity="0.05"/>
  
  <!-- Standing platform (where avatar stands) -->
  <ellipse cx="350" cy="420" rx="70" ry="12" fill="#00FFFF" opacity="0.06" filter="url(#softglow)"/>
  <ellipse cx="350" cy="418" rx="50" ry="8" fill="#00FFFF" opacity="0.12"/>
  <ellipse cx="350" cy="416" rx="65" ry="10" fill="none" stroke="#00FFFF" stroke-width="0.8" opacity="0.3"/>
  <ellipse cx="350" cy="414" rx="80" ry="14" fill="none" stroke="#00FFFF" stroke-width="0.4" opacity="0.2"/>
  
  <!-- Side panels -->
  <rect x="0" y="120" width="60" height="200" fill="#0a0f18" opacity="0.5"/>
  <rect x="640" y="120" width="60" height="200" fill="#0a0f18" opacity="0.5"/>
  
  <!-- Ceiling lights -->
  <line x1="150" y1="0" x2="150" y2="80" stroke="#00FFFF" stroke-opacity="0.3"/>
  <rect x="145" y="75" width="10" height="5" fill="#00FFFF" opacity="0.5" filter="url(#glow)"/>
  <line x1="350" y1="0" x2="350" y2="100" stroke="#00FFFF" stroke-opacity="0.4"/>
  <rect x="345" y="95" width="10" height="5" fill="#00FFFF" opacity="0.7" filter="url(#glow)"/>
  <line x1="550" y1="0" x2="550" y2="80" stroke="#00FFFF" stroke-opacity="0.3"/>
  <rect x="545" y="75" width="10" height="5" fill="#00FFFF" opacity="0.5" filter="url(#glow)"/>
  
  <!-- Data streams -->
  <line x1="75" y1="150" x2="75" y2="330" stroke="#00FFFF" stroke-width="0.5" stroke-dasharray="4,6" opacity="0.4"/>
  <line x1="625" y1="150" x2="625" y2="330" stroke="#00FFFF" stroke-width="0.5" stroke-dasharray="4,6" opacity="0.4"/>
</svg>
`;

export function SammyRoom({ agentStatus, heartbeatData }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const radarRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const [heartbeat, setHeartbeat] = useState<HeartbeatData | null>(null);

  const isBusy  = agentStatus.status === 'busy';
  const isError = agentStatus.status === 'error';
  const statusColor = isError ? '#FF003C' : isBusy ? '#FFD700' : '#00FF41';
  
  const statusLabel = agentStatus.status === 'sleep' ? 'DORMIDA'
    : agentStatus.status === 'error' ? 'ERROR'
    : agentStatus.status === 'busy' ? 'TRABAJANDO'
    : 'IDLE';

  /* ── Heartbeat from prop or local fetch ────────────────────────── */
  useEffect(() => {
    if (heartbeatData) {
      setHeartbeat(heartbeatData);
      return;
    }
    const load = async () => {
      try {
        const res = await fetch('/api/agents/status');
        if (res.ok) setHeartbeat(await res.json());
      } catch { /* silent */ }
    };
    load();
    const id = setInterval(load, 10_000);
    return () => clearInterval(id);
  }, [heartbeatData]);

  /* ── Particle system on floor ────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn based on status
      if (isBusy && Math.random() > 0.7) {
        for (let i = 0; i < 2 && particlesRef.current.length < 60; i++) {
          particlesRef.current.push({
            x: 250 + Math.random() * 200,
            y: 420,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 1.5 - 0.5,
            life: 1,
            color: Math.random() > 0.5 ? '#00FFFF' : '#FF5C3A',
            size: Math.random() * 2 + 1,
          });
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => p.life > 0);
      for (const p of particlesRef.current) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.015;
        p.life -= 0.012;
        ctx.globalAlpha = p.life * 0.7;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [isBusy]);

  /* ── Radar canvas ───────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = radarRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;

    const draw = (t: number) => {
      ctx.clearRect(0, 0, 80, 80);
      const cx = 40, cy = 40, r = 35;

      // Grid
      ctx.strokeStyle = '#00FF4122';
      ctx.lineWidth = 0.5;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * i / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy);
      ctx.moveTo(cx, cy - r); ctx.lineTo(cx, cy + r);
      ctx.stroke();

      // Sweep
      const sweep = (t * 0.002) % (Math.PI * 2);
      ctx.fillStyle = '#00FF4133';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, sweep - 0.5, sweep);
      ctx.fill();

      // Center
      ctx.fillStyle = '#00FFFF';
      ctx.shadowColor = '#00FFFF';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  /* ── Heartbeat for display ───────────────────────────────────────── */
  const displayHeartbeat = heartbeatData ?? heartbeat;

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      aspectRatio: '700/497',
      background: '#030508',
      borderRadius: 8,
      overflow: 'hidden',
      border: `1px solid ${statusColor}33`,
      boxShadow: `0 0 30px ${statusColor}22`,
    }}>
      {/* SVG Background */}
      <div
        style={{ position: 'absolute', inset: 0, zIndex: 0 }}
        dangerouslySetInnerHTML={{ __html: ROOM_SVG }}
      />

      {/* Scanlines overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.02) 2px, rgba(0,255,255,0.02) 4px)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        width={700}
        height={497}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />

      {/* HUD: Top center status */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 16px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${statusColor}55`,
        borderRadius: 4,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10,
        color: statusColor,
        letterSpacing: '0.1em',
        zIndex: 10,
        boxShadow: `0 0 12px ${statusColor}22`,
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: statusColor,
          animation: isBusy ? 'cc-pulse 0.4s infinite' : 'cc-pulse 1.5s infinite',
          boxShadow: `0 0 6px ${statusColor}`,
        }} />
        SAMMY — {statusLabel}
      </div>

      {/* HUD: Task bubble */}
      <div style={{
        position: 'absolute', top: 12, left: 12,
        maxWidth: 160,
        padding: '6px 10px',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        border: '1px solid #00FFFF33',
        borderRadius: 4,
        zIndex: 10,
      }}>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 6, color: '#00FFFF66',
          letterSpacing: '0.1em', marginBottom: 3,
        }}>
          ▶ CURRENT_TASK
        </div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 8, color: '#00FFFF',
          textShadow: '0 0 4px #00FFFF66',
        }}>
          {agentStatus.task}
          <span style={{ animation: 'cc-blink 0.8s step-end infinite' }}>█</span>
        </div>
      </div>

      {/* HUD: Radar (top right) */}
      <div style={{
        position: 'absolute', top: 12, right: 12,
        width: 50, height: 50,
        background: 'rgba(0,0,0,0.7)',
        border: `1px solid ${statusColor}44`,
        borderRadius: 4,
        zIndex: 10,
      }}>
        <canvas ref={radarRef} width={80} height={80} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* HUD: Stats (bottom left) */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12,
        display: 'flex', gap: 8,
        zIndex: 10,
      }}>
        {[
          { label: 'AGENTS', value: displayHeartbeat ? `${displayHeartbeat.stats?.agentsCount ?? '?'}/8` : '—/8' },
          { label: 'TASKS', value: displayHeartbeat?.stats?.totalTasks?.toString() ?? '—' },
          { label: 'OK%', value: displayHeartbeat?.stats?.successRate ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} style={{
            background: 'rgba(0,0,0,0.7)',
            border: `1px solid ${statusColor}33`,
            borderRadius: 4,
            padding: '4px 8px',
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 12, color: statusColor, fontWeight: 700,
            }}>
              {value}
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 6, color: statusColor, opacity: 0.6,
            }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* HUD: Services status (bottom right) */}
      {displayHeartbeat?.services && (
        <div style={{
          position: 'absolute', bottom: 12, right: 12,
          display: 'flex', gap: 6, flexDirection: 'column', alignItems: 'flex-end',
          zIndex: 10,
        }}>
          {Object.entries(displayHeartbeat.services).slice(0, 4).map(([name, st]) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 3,
              padding: '3px 6px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 7,
              color: st === 'ok' ? '#00FF41' : st === 'warn' ? '#FFD700' : '#FF003C',
              backdropFilter: 'blur(4px)',
            }}>
              <span>{st === 'ok' ? '●' : st === 'warn' ? '◐' : '✕'}</span>
              <span style={{ opacity: 0.7 }}>{name.toUpperCase()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Avatar (center bottom, standing on platform) */}
      <div style={{
        position: 'absolute',
        bottom: 45,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 15,
      }}>
        <SammySprite
          mood={
            agentStatus.status === 'sleep' ? 'tired' :
            agentStatus.status === 'busy' ? 'working' :
            agentStatus.status === 'error' ? 'alert' : 'idle'
          }
          action={
            agentStatus.status === 'sleep' ? 'sleeping' :
            agentStatus.status === 'busy' ? 'typing' :
            agentStatus.status === 'error' ? 'alert' : 'standing'
          }
          response={agentStatus.task || "Sistemas listos."}
          confidence={0.95}
        />
      </div>

      {/* Activity rings around avatar */}
      <div style={{
        position: 'absolute',
        bottom: 35,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 70,
        height: 70,
        borderRadius: '50%',
        border: `2px solid ${statusColor}44`,
        animation: isBusy ? 'sammy-ring-spin 1.5s linear infinite' : 'sammy-ring-pulse 3s ease-in-out infinite',
        pointerEvents: 'none',
        zIndex: 14,
      }} />
      <div style={{
        position: 'absolute',
        bottom: 40,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 55,
        height: 55,
        borderRadius: '50%',
        border: `1px solid ${statusColor}33`,
        animation: isBusy ? 'sammy-ring-spin 2.5s linear infinite reverse' : 'none',
        pointerEvents: 'none',
        zIndex: 14,
      }} />

      {/* Error flash overlay */}
      {isError && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#FF003C10',
          animation: 'cc-pulse 0.4s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 20,
        }} />
      )}

      {/* Corner brackets */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 5, pointerEvents: 'none' }}>
        {[[0, 0, 1, 1], [700, 0, -1, 1], [0, 497, 1, -1], [700, 497, -1, -1]].map(([cx, cy, sx, sy], i) => (
          <g key={i} stroke={statusColor} strokeWidth={2} fill="none" opacity={0.6}>
            <path d={`M${Number(cx)},${Number(cy)} L${Number(cx) + Number(sx) * 20},${Number(cy)} L${Number(cx) + Number(sx) * 20},${Number(cy) + Number(sy) * 20}`} />
          </g>
        ))}
      </svg>
    </div>
  );
}