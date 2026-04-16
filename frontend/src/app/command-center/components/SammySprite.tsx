'use client';

/* ─── SAMMY SPRITE — Action-driven avatar with environment reactions
    Shows different animation states based on current action/mood
────────────────────────────────────────────────────────────────────────── */

import React, { useEffect, useRef, useState } from 'react';
import { SammyMood, FloorEffect, AvatarAction } from './SammyBrain';

interface Props {
  mood: SammyMood;
  action: AvatarAction;
  response: string;
  confidence: number;
  floorEffect?: 'none' | 'ripple' | 'glow-pulse' | 'data-stream' | 'grid-hack' | 'alarm';
}

/* ─── Overlay renderers per action ───────────────────────────────── */
function TypingOverlay() {
  return (
    <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 3 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 4, height: 4, borderRadius: '50%', background: '#00FF41',
          animation: 'particle-rise 0.3s infinite', animationDelay: `${i * 0.1}s`,
        }} />
      ))}
    </div>
  );
}

function ThinkingOverlay() {
  return (
    <>
      <div style={{ position: 'absolute', top: -18, right: -12, width: 14, height: 14, borderRadius: '50%', background: '#8B5CF6', opacity: 0.7, animation: 'bubble-think 1.5s infinite' }} />
      <div style={{ position: 'absolute', top: -28, right: -18, width: 9, height: 9, borderRadius: '50%', background: '#A78BFA', opacity: 0.5, animation: 'bubble-think 1.5s infinite 0.3s' }} />
      <div style={{ position: 'absolute', top: -38, right: -10, width: 6, height: 6, borderRadius: '50%', background: '#8B5CF6', opacity: 0.3, animation: 'bubble-think 1.5s infinite 0.6s' }} />
    </>
  );
}

function CelebratingOverlay() {
  return (
    <div style={{ position: 'absolute', inset: -20, pointerEvents: 'none' }}>
      {[...Array(8)].map((_, i) => {
        const angle = i * 45;
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: 3, height: 3, borderRadius: '50%',
            background: '#FFD700', boxShadow: '0 0 6px #FFD700',
            animation: `celebrate-particle 0.8s infinite`,
            animationDelay: `${i * 0.1}s`,
            transform: `rotate(${angle}deg) translateY(-30px)`,
          }} />
        );
      })}
    </div>
  );
}

function SleepingOverlay() {
  return (
    <>
      <div style={{ position: 'absolute', top: -8, right: -10, fontSize: 14, color: '#4FC3F7', textShadow: '0 0 8px #4FC3F7', animation: 'z-float 2s ease-in-out infinite', fontFamily: 'monospace', fontWeight: 'bold' }}>z</div>
      <div style={{ position: 'absolute', top: -20, right: -18, fontSize: 11, color: '#81D4FA', textShadow: '0 0 6px #81D4FA', animation: 'z-float 2s ease-in-out infinite 0.5s', fontFamily: 'monospace', fontWeight: 'bold' }}>Z</div>
      <div style={{ position: 'absolute', top: -30, right: -22, fontSize: 8, color: '#4FC3F7', textShadow: '0 0 4px #4FC3F7', animation: 'z-float 2s ease-in-out infinite 1s', fontFamily: 'monospace', fontWeight: 'bold' }}>z</div>
    </>
  );
}

function AlertOverlay() {
  return (
    <div style={{ position: 'absolute', top: -35, left: '50%', transform: 'translateX(-50%)', fontSize: 18, animation: 'alert-flash 0.2s infinite', filter: 'drop-shadow(0 0 8px #FF003C)' }}>
      ⚠
    </div>
  );
}

function WalkingOverlay() {
  return (
    <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', width: 50, height: 6, borderRadius: '50%', background: '#00FFFF22', filter: 'blur(4px)', animation: 'walk-shadow 0.4s infinite' }} />
  );
}

function PointingOverlay() {
  return (
    <div style={{ position: 'absolute', top: 5, right: -20, fontSize: 16, animation: 'point-bounce 1s ease-in-out infinite', filter: 'drop-shadow(0 0 4px #FF5C3A)' }}>
      👉
    </div>
  );
}

function ScanningOverlay() {
  return (
    <div style={{ position: 'absolute', inset: -15, borderRadius: '50%', border: '2px solid #00FFFF44', animation: 'scan-ring 1.5s linear infinite' }} />
  );
}

function RepairingOverlay() {
  const positions = [{ top: '15%', left: '15%' }, { top: '15%', left: '70%' }, { top: '70%', left: '15%' }, { top: '70%', left: '70%' }];
  return (
    <div style={{ position: 'absolute', inset: -10 }}>
      {positions.map((p, i) => (
        <div key={i} style={{
          position: 'absolute', ...p,
          width: 6, height: 6, borderRadius: '1px',
          background: '#00FF41', boxShadow: '0 0 4px #00FF41',
          animation: `repair-flash 0.35s infinite`,
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
    </div>
  );
}

/* ─── Action configuration map ──────────────────────────────────── */
const ACTION_CONFIG: Record<AvatarAction, {
  overlay: React.ReactNode;
  color: string;
  speed: string;
  bounce: string;
}> = {
  standing:   { overlay: null,                color: '#00FFFF', speed: '2s',    bounce: 'bounce-idle'     },
  typing:     { overlay: <TypingOverlay />,    color: '#00FF41', speed: '0.25s', bounce: 'bounce-working'  },
  thinking:   { overlay: <ThinkingOverlay />,  color: '#8B5CF6', speed: '1.5s',  bounce: 'bounce-thinking' },
  celebrating:{ overlay: <CelebratingOverlay />, color: '#FFD700', speed: '0.2s', bounce: 'bounce-excited'  },
  sleeping:   { overlay: <SleepingOverlay />, color: '#4FC3F7', speed: '4s',    bounce: 'bounce-tired'    },
  alert:      { overlay: <AlertOverlay />,    color: '#FF003C', speed: '0.1s',  bounce: 'bounce-alert'    },
  walking:    { overlay: <WalkingOverlay />,  color: '#00FFFF', speed: '0.4s',  bounce: 'bounce-walk'     },
  pointing:   { overlay: <PointingOverlay />, color: '#FF5C3A', speed: '0.6s',  bounce: 'bounce-happy'    },
  scanning:   { overlay: <ScanningOverlay />, color: '#00FFFF', speed: '1.5s',  bounce: 'bounce-idle'     },
  repairing:  { overlay: <RepairingOverlay />, color: '#00FF41', speed: '0.35s', bounce: 'bounce-working'  },
};

export function SammySprite({ mood, action, response, confidence, floorEffect = 'ripple' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number }>>([]);
  let particleId = useRef(0);

  const cfg = ACTION_CONFIG[action] ?? ACTION_CONFIG.standing;

  /* ── Alert shake ─────────────────────────────────────────────── */
  useEffect(() => {
    if (action !== 'alert' || !containerRef.current) return;
    let frame = 0;
    const animate = () => {
      if (frame > 60 || action !== 'alert') return;
      const el = containerRef.current;
      if (el) {
        const intensity = 1 - frame / 60;
        el.style.transform = `translateX(-50%) translate(${(Math.random() - 0.5) * 8 * intensity}px, ${(Math.random() - 0.5) * 4 * intensity}px)`;
      }
      frame++;
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      if (containerRef.current) containerRef.current.style.transform = 'translateX(-50%)';
    };
  }, [action]);

  /* ── Float for sleeping ─────────────────────────────────────── */
  useEffect(() => {
    if (action !== 'sleeping' || !containerRef.current) return;
    const el = containerRef.current;
    let time = 0;
    const animate = () => {
      if (action !== 'sleeping' || !el) return;
      time += 0.015;
      el.style.transform = `translateX(-50%) translateY(${Math.sin(time) * 3}px)`;
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      if (containerRef.current) containerRef.current.style.transform = 'translateX(-50%)';
    };
  }, [action]);

  /* ── Scanning rotation ─────────────────────────────────────── */
  useEffect(() => {
    if (action !== 'scanning') return;
    const el = containerRef.current;
    if (!el) return;
    let frame = 0;
    const animate = () => {
      if (action !== 'scanning' || !el) return;
      frame++;
      el.style.transform = `translateX(-50%) rotate(${frame * 3}deg)`;
      requestAnimationFrame(animate);
    };
    const raf = requestAnimationFrame(animate);
    return () => {
      cancelAnimationFrame(raf);
      if (containerRef.current) containerRef.current.style.transform = 'translateX(-50%)';
    };
  }, [action]);

  /* ── Active particle emitter ──────────────────────────────── */
  useEffect(() => {
    const active = ['typing', 'celebrating', 'scanning', 'repairing'].includes(action);
    if (!active) { setParticles([]); return; }
    const interval = setInterval(() => {
      const newP = { id: particleId.current++, x: 20 + Math.random() * 16 };
      setParticles(prev => [...prev.slice(-15), newP]);
      setTimeout(() => setParticles(prev => prev.filter(p => p.id !== newP.id)), 700);
    }, 80);
    return () => clearInterval(interval);
  }, [action]);

  return (
    <>
      {/* Floor effect */}
      <FloorEffect effect={floorEffect as any} mood={mood} />

      {/* Avatar */}
      <div
        ref={containerRef}
        style={{
          position: 'absolute', bottom: 30, left: '50%',
          transform: 'translateX(-50%)',
          width: 64, height: 90, zIndex: 15,
        }}
      >
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -15, left: '50%', transform: 'translateX(-50%)',
          width: 80, height: 100,
          background: `radial-gradient(ellipse, ${cfg.color}44 0%, transparent 70%)`,
          borderRadius: '50%',
          animation: `glow-${mood} ${cfg.speed} infinite`,
          filter: 'blur(12px)', zIndex: 0,
        }} />

        {/* Action overlay */}
        {cfg.overlay}

        {/* Character */}
        <div style={{ position: 'relative', zIndex: 1, animation: cfg.bounce }}>
          <img
            src="/assets/sammy.webp"
            alt={`Sammy — ${action}`}
            width={64} height={90}
            style={{
              imageRendering: 'auto',
              filter: `drop-shadow(0 0 ${action === 'typing' || action === 'repairing' ? 12 : 6}px ${cfg.color}88)`,
            }}
          />
        </div>

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x, bottom: 20,
            width: 3, height: 3, borderRadius: '50%',
            background: cfg.color,
            boxShadow: `0 0 4px ${cfg.color}`,
            animation: 'particle-rise-fast 0.7s ease-out forwards',
            zIndex: 2,
          }} />
        ))}

        {/* Action label */}
        <div style={{
          position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', alignItems: 'center', gap: 4, zIndex: 5,
        }}>
          <div style={{
            width: 7, height: 7, borderRadius: '50%', background: cfg.color,
            boxShadow: `0 0 6px ${cfg.color}`,
            animation: action === 'typing' ? 'cc-pulse 0.3s infinite' : 'cc-pulse 1.5s infinite',
          }} />
          <span style={{ fontSize: 6, color: cfg.color, fontFamily: 'monospace', textShadow: `0 0 3px ${cfg.color}` }}>
            {action.toUpperCase()} {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Response bubble */}
        <div style={{
          position: 'absolute', top: -52, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.75)',
          border: `1px solid ${cfg.color}44`,
          borderRadius: 6, padding: '4px 8px',
          maxWidth: 160, backdropFilter: 'blur(8px)', zIndex: 10,
        }}>
          <div style={{ fontSize: 7, color: cfg.color, fontFamily: 'monospace', textShadow: `0 0 3px ${cfg.color}` }}>
            "{response}"
          </div>
        </div>
      </div>

      {/* Activity rings */}
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        width: 80, height: 80, borderRadius: '50%',
        border: `2px solid ${cfg.color}33`,
        animation: ['typing', 'scanning'].includes(action)
          ? 'ring-spin 1.5s linear infinite'
          : 'ring-pulse 3s ease-in-out infinite',
        pointerEvents: 'none', zIndex: 14,
      }} />
      <div style={{
        position: 'absolute', bottom: 25, left: '50%', transform: 'translateX(-50%)',
        width: 60, height: 60, borderRadius: '50%',
        border: `1px solid ${cfg.color}22`,
        animation: action === 'typing' ? 'ring-spin 2s linear infinite reverse' : 'none',
        pointerEvents: 'none', zIndex: 14,
      }} />
    </>
  );
}
