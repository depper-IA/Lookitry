'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import './command-center.css';
import { useSammyBrain, SammyMood } from './components/SammyBrain';
import { GameCanvas, SammyState, STATE_LABELS, MAP_W, MAP_H, TILE } from './components/GameCanvas';

/* ─── Mood → State + color mapping ───────────────────────────────── */
const MOOD_TO_STATE: Record<SammyMood, SammyState> = {
  idle:     'idle',
  working:  'typing',
  thinking: 'reading',
  excited:  'celebrating',
  tired:    'sleeping',
  alert:    'alert',
  happy:    'idle',
};

const FLOOR_EFFECT: Record<string, string> = {
  ripple:       'ripple',
  'glow-pulse': 'glow-pulse',
  'data-stream':'data-stream',
  alarm:        'alarm',
  'grid-hack':  'glow-pulse',
  none:         'none',
};

const MOOD_COLORS: Record<SammyMood, string> = {
  idle:     '#FF5C3A',
  working:  '#00FF88',
  thinking:  '#9B6CF9',
  excited:  '#FFD23F',
  tired:    '#4FC3F7',
  alert:    '#FF3A5C',
  happy:    '#00FFFF',
};

/* ─── 8 Hotspot positions ─────────────────────────────────────────── */
const HOTSPOTS = [
  { x: 7,  y: 3,  label: '📊 Monitores',       icon: '📊', cmd: 'Show system status'    },
  { x: 17, y: 3,  label: '💻 Terminal',         icon: '💻', cmd: 'Run terminal diagnostics' },
  { x: 24, y: 3,  label: '🔔 Alertas',           icon: '🔔', cmd: 'Check active alerts'    },
  { x: 16, y: 13, label: '🎯 Sammys Desk',      icon: '🎯', cmd: 'Return to desk'         },
  { x: 10, y: 7,  label: '📁 Archivos',           icon: '📁', cmd: 'List recent files'      },
  { x: 22, y: 7,  label: '🗺️ Mapa',              icon: '🗺️', cmd: 'Display network map'     },
  { x: 4,  y: 11, label: '☁️ Cloud',             icon: '☁️', cmd: 'Check cloud status'     },
  { x: 28, y: 11, label: '⚡ Energy',            icon: '⚡', cmd: 'Analyze power usage'    },
];

/* ─── Main Page ────────────────────────────────────────────────────── */
export default function CommandCenterPage() {
  const [clock, setClock]             = useState('00:00:00');
  const [time, setTime]             = useState(0);
  const [activeHotspot, setActive]  = useState<string | null>(null);
  const [showHelp, setShowHelp]     = useState(false);
  const [inputVal, setInputVal]     = useState('');

  const { mood, response, floorEffect, confidence, activityLog, sendCommand } =
    useSammyBrain();

  const sammyState  = MOOD_TO_STATE[mood];
  const sammyFloor  = FLOOR_EFFECT[floorEffect] ?? 'none';
  const accentColor = MOOD_COLORS[mood] ?? '#FF5C3A';

  /* ── Clock ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      setClock(new Date().toLocaleTimeString('en-US', { hour12: false }));
      setTime(t => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /* ── Hotspot click ─────────────────────────────────────────────── */
  const handleHotspot = useCallback((hs: typeof HOTSPOTS[0]) => {
    setActive(hs.label);
    sendCommand(hs.cmd);
    setTimeout(() => setActive(null), 2500);
  }, [sendCommand]);

  /* ── Canvas click — walk ─────────────────────────────────────── */
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    const sx = (MAP_W * TILE) / rect.width;
    const sy = (MAP_H * TILE) / rect.height;
    const tx = Math.floor((e.clientX - rect.left) * sx / TILE);
    const ty = Math.floor((e.clientY - rect.top)  * sy / TILE);
    sendCommand(`Navigate to (${tx}, ${ty})`);
  }, [sendCommand]);

  /* ── Send command ─────────────────────────────────────────────── */
  const handleSend = () => {
    if (!inputVal.trim()) return;
    sendCommand(inputVal.trim());
    setInputVal('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--lkt-bg-deep)',
      fontFamily: "'Inter', sans-serif",
      display: 'flex', flexDirection: 'column',
      color: 'var(--lkt-text)',
    }}>
      {/* ── HEADER ───────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,8,12,0.92)',
        backdropFilter: 'blur(24px)',
        borderBottom: `1px solid ${accentColor}22`,
        padding: '0 24px',
        height: 68,
        display: 'flex', alignItems: 'center',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          {/* Left: Brand + Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Logo mark */}
            <div style={{
              width: 40, height: 40,
              background: `linear-gradient(135deg, ${accentColor}33, ${accentColor}11)`,
              border: `1.5px solid ${accentColor}55`,
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 18,
              boxShadow: `0 0 15px ${accentColor}22`,
            }}>
              🎙️
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h1 style={{
                  fontSize: 15, fontWeight: 800,
                  color: accentColor,
                  textShadow: `0 0 20px ${accentColor}66`,
                  letterSpacing: '0.12em',
                  margin: 0,
                  fontFamily: "'Inter', sans-serif",
                }}>
                  SAMMANTHA
                </h1>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: accentColor,
                  boxShadow: `0 0 8px ${accentColor}`,
                  animation: 'cc-pulse 1.5s infinite',
                }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--lkt-text-3)', marginTop: 2, letterSpacing: '0.05em' }}>
                {STATE_LABELS[sammyState]}
              </div>
            </div>
          </div>

          {/* Right: Info + controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Confidence */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 7, color: 'var(--lkt-text-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Confidence</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: accentColor, fontFamily: "'JetBrains Mono', monospace" }}>
                {confidence.toFixed(0)}%
              </div>
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--lkt-border)' }} />

            {/* Clock */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--lkt-text-2)', letterSpacing: '0.05em' }}>
              {clock}
            </div>

            <div style={{ width: 1, height: 24, background: 'var(--lkt-border)' }} />

            {/* Mood badge */}
            <div style={{
              padding: '5px 12px',
              background: `${accentColor}18`,
              border: `1px solid ${accentColor}44`,
              borderRadius: 6,
              fontSize: 9, fontWeight: 600,
              color: accentColor,
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}>
              {mood}
            </div>

            {/* Help */}
            <button
              onClick={() => setShowHelp(h => !h)}
              style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--lkt-surface)',
                border: '1px solid var(--lkt-border)',
                color: 'var(--lkt-text-3)',
                fontSize: 13, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.color = accentColor; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--lkt-border)'; e.currentTarget.style.color = 'var(--lkt-text-3)'; }}
            >
              ?
            </button>
          </div>
        </div>
      </header>

      {/* ── HELP OVERLAY ─────────────────────────────────────────── */}
      {showHelp && (
        <div
          onClick={() => setShowHelp(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: 500, width: '100%',
              background: 'var(--lkt-bg-2)',
              border: `1px solid ${accentColor}33`,
              borderRadius: 16,
              padding: 28,
              boxShadow: `0 0 40px ${accentColor}15`,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 800, color: accentColor, marginBottom: 20, letterSpacing: '0.05em' }}>
              ◉ SAMMANTHA CONTROL TOWER
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                ['🎯', 'Click anywhere', 'Sammy walks to that tile'],
                ['💬', 'Type a command', 'AI-powered response'],
                ['📡', 'Hotspot buttons', 'Navigate the room'],
                ['🎭', 'Mood system', 'OpenRouter AI brain'],
                ['🌊', 'Floor effects', 'Visual state feedback'],
                ['📜', 'Activity log', 'Real-time events'],
              ].map(([icon, title, desc]) => (
                <div key={title as string} style={{
                  background: 'var(--lkt-surface)',
                  border: '1px solid var(--lkt-border)',
                  borderRadius: 10, padding: '10px 12px',
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}>
                  <span style={{ fontSize: 18, lineHeight: 1 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--lkt-text)', marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 9, color: 'var(--lkt-text-3)', lineHeight: 1.4 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHelp(false)}
              style={{
                marginTop: 20, width: '100%', padding: '10px',
                background: `${accentColor}18`,
                border: `1px solid ${accentColor}44`,
                borderRadius: 8, color: accentColor,
                fontFamily: "'Inter', sans-serif",
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.1em',
              }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN ─────────────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '24px',
      }}>
        <div style={{ width: '100%', maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Game Canvas area */}
          <div style={{ position: 'relative' }}>

            {/* Hotspot buttons */}
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
              {HOTSPOTS.map((hs, i) => (
                <button
                  key={i}
                  onClick={() => handleHotspot(hs)}
                  title={hs.label}
                  style={{
                    position: 'absolute',
                    left: `${(hs.x / MAP_W) * 100}%`,
                    top:  `${(hs.y / MAP_H) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'all',
                    width: 32, height: 32,
                    borderRadius: '50%',
                    background: activeHotspot === hs.label
                      ? `${accentColor}55`
                      : 'rgba(8,8,12,0.7)',
                    border: `1.5px solid ${activeHotspot === hs.label ? accentColor : 'rgba(255,92,58,0.3)'}`,
                    backdropFilter: 'blur(8px)',
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                    boxShadow: activeHotspot === hs.label ? `0 0 14px ${accentColor}55` : 'none',
                  }}
                >
                  {hs.icon}
                </button>
              ))}
            </div>

            {/* Canvas */}
            <div
              onClick={handleCanvasClick}
              style={{
                cursor: 'crosshair',
                borderRadius: 12,
                overflow: 'hidden',
                border: `1px solid ${accentColor}22`,
                boxShadow: `0 0 30px ${accentColor}11, 0 4px 24px rgba(0,0,0,0.4)`,
              }}
            >
              <GameCanvas
                state={sammyState}
                speechBubble={response}
                floorEffect={sammyFloor}
              />
            </div>

            {/* Grid info */}
            <div style={{
              position: 'absolute', bottom: 8, right: 10,
              fontSize: 7, color: 'rgba(255,92,58,0.3)',
              fontFamily: "'JetBrains Mono', monospace",
              pointerEvents: 'none',
              letterSpacing: '0.08em',
            }}>
              CLICK TO WALK · {MAP_W}×{MAP_H} GRID · {TILE}px
            </div>
          </div>

          {/* Command input — Lookitry style */}
          <div style={{
            display: 'flex', gap: 8,
            background: 'var(--lkt-bg-2)',
            border: `1px solid var(--lkt-border)`,
            borderRadius: 10,
            padding: 4,
          }}>
            <input
              id="sammy-command"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Send command to Sammy..."
              onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
              style={{
                flex: 1,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--lkt-text)',
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                outline: 'none',
              }}
            />
            <button
              onClick={handleSend}
              style={{
                padding: '10px 20px',
                background: accentColor,
                border: 'none',
                borderRadius: 7,
                color: '#fff',
                fontFamily: "'Inter', sans-serif",
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.08em',
                transition: 'all 0.2s',
                boxShadow: `0 0 15px ${accentColor}44`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--lkt-primary-dk)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = accentColor; }}
            >
              SEND
            </button>
          </div>

          {/* State quick-switch buttons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: 6,
          }}>
            {(['idle', 'typing', 'reading', 'celebrating', 'alert'] as SammyState[]).map(s => (
              <button
                key={s}
                onClick={() => sendCommand(`Switch to ${s}`)}
                style={{
                  padding: '7px 4px',
                  background: sammyState === s ? `${accentColor}20` : 'var(--lkt-surface)',
                  border: `1px solid ${sammyState === s ? accentColor : 'var(--lkt-border)'}`,
                  borderRadius: 7,
                  color: sammyState === s ? accentColor : 'var(--lkt-text-3)',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 8, fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  transition: 'all 0.2s',
                }}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Bottom row: Response + Log */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>

            {/* Sammy's response */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--lkt-bg-2)',
              border: `1px solid ${accentColor}22`,
              borderRadius: 10,
            }}>
              <div style={{ fontSize: 8, color: accentColor, marginBottom: 8, letterSpacing: '0.15em', fontWeight: 600 }}>
                SAMMY RESPONSE
              </div>
              <div style={{ fontSize: 11, color: 'var(--lkt-text-2)', lineHeight: 1.7, fontFamily: "'Inter', sans-serif" }}>
                &ldquo;{response}&rdquo;
                <span style={{ color: accentColor, animation: 'cc-blink 0.8s step-end infinite', marginLeft: 2 }}>▌</span>
              </div>
            </div>

            {/* Activity log */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--lkt-bg-2)',
              border: `1px solid var(--lkt-border)`,
              borderRadius: 10,
              maxHeight: 120, overflowY: 'auto',
            }}>
              <div style={{ fontSize: 8, color: 'var(--lkt-text-3)', marginBottom: 8, letterSpacing: '0.15em', fontWeight: 600 }}>
                ACTIVITY LOG
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {activityLog.slice(0, 6).map((log, i) => (
                  <div key={i} style={{
                    fontSize: 9, color: i === 0 ? 'var(--lkt-text-2)' : 'var(--lkt-text-3)',
                    fontFamily: "'JetBrains Mono', monospace",
                    display: 'flex', gap: 6, alignItems: 'flex-start',
                  }}>
                    <span style={{ color: accentColor, opacity: 0.5, flexShrink: 0 }}>›</span>
                    <span style={{ opacity: 1 - (i * 0.14) }}>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer style={{
        textAlign: 'center',
        padding: '14px',
        fontSize: 7,
        color: 'var(--lkt-text-3)',
        letterSpacing: '0.2em',
        borderTop: '1px solid var(--lkt-border)',
      }}>
        SAMMANTHA AI CONTROL TOWER ◉ LOOKITRY OPS CENTER
      </footer>
    </div>
  );
}
