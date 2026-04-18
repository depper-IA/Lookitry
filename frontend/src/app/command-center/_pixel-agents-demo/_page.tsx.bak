'use client';

import { useState } from 'react';
import { LookitryAgentsCanvas } from '@lookitry/sammy-engine/LookitryAgentsCanvas';
import type { CharacterState, Hotspot } from '@lookitry/sammy-engine';
import { MOOD_COLORS } from '@lookitry/sammy-engine';

const STATES: { value: CharacterState; label: string; emoji: string }[] = [
  { value: 'idle', label: 'Idle', emoji: '🧍' },
  { value: 'type', label: 'Typing', emoji: '⌨️' },
  { value: 'think', label: 'Thinking', emoji: '💭' },
  { value: 'celebrate', label: 'Celebrating', emoji: '🎉' },
  { value: 'alert', label: 'Alert', emoji: '🚨' },
  { value: 'scan', label: 'Scanning', emoji: '🔍' },
  { value: 'sleep', label: 'Sleeping', emoji: '😴' },
];

const EFFECTS = [
  { value: 'none', label: 'Ninguno' },
  { value: 'matrix', label: 'Matrix' },
  { value: 'sparkle', label: 'Sparkle' },
  { value: 'dataStream', label: 'Data Stream' },
  { value: 'scanlines', label: 'Scanlines' },
  { value: 'glitch', label: 'Glitch' },
] as const;

const BUBBLES = [
  { value: null, label: 'Sin mensaje' },
  { value: '¡Hola Sam! Sammy lista para trabajar 🚀', label: 'Saludo' },
  { value: 'Procesando datos... 87% completo', label: 'Progreso' },
  { value: '¡Tarea completada con éxito! ✅', label: 'Éxito' },
  { value: '⚠️ Detectando anomalía en el sistema', label: 'Alerta' },
  { value: '💭 Analizando mejores estrategias...', label: 'Pensando' },
  { value: '🎯 Objetivo encontrado: optimizando flujo', label: 'Objetivo' },
];

export default function PixelAgentsDemo() {
  const [state, setState] = useState<CharacterState>('idle');
  const [bubble, setBubble] = useState<string | null>(null);
  const [effect, setEffect] = useState<'none' | 'matrix' | 'sparkle' | 'dataStream' | 'scanlines' | 'glitch'>('none');
  const [sendToHotspot, setSendToHotspot] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [zoom, setZoom] = useState(2);
  const [lastClick, setLastClick] = useState('');

  const handleHotspotClick = (hs: Hotspot) => {
    setLastClick(`📍 Hotspot: ${hs.emoji} ${hs.name}`);
    setSendToHotspot(hs.id);
    // Reset after a delay so the same hotspot can be clicked again
    setTimeout(() => setSendToHotspot(null), 100);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #020208 0%, #0a0520 50%, #020208 100%)',
      color: '#e0e0e0',
      fontFamily: '"Inter", system-ui, sans-serif',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#FF5C3A',
          margin: '0 0 8px 0',
          letterSpacing: '-0.5px',
        }}>
          🎮 Pixel Agents Demo — Sammantha Engine
        </h1>
        <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>
          Motor adaptado de{' '}
          <a href="https://github.com/pablodelucca/pixel-agents" target="_blank" rel="noopener noreferrer" style={{ color: '#FF5C3A' }}>
            github.com/pablodelucca/pixel-agents
          </a>{' '}
          para Lookitry Command Center
        </p>
      </div>

      {/* Main layout */}
      <div style={{
        display: 'flex',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
        flexWrap: 'wrap',
      }}>
        {/* Canvas */}
        <div style={{ flex: '1 1 600px' }}>
          <div style={{
            background: 'rgba(255, 92, 58, 0.05)',
            border: '1px solid rgba(255, 92, 58, 0.2)',
            borderRadius: '12px',
            padding: '16px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
            }}>
              <span style={{ fontSize: '12px', color: '#888', fontFamily: '"JetBrains Mono", monospace' }}>
                Sammantha @ Lookitry HQ — {zoom}x zoom
              </span>
              {lastClick && (
                <span style={{ fontSize: '11px', color: '#FF5C3A', fontFamily: '"JetBrains Mono", monospace' }}>
                  {lastClick}
                </span>
              )}
            </div>

            <LookitryAgentsCanvas
              width={640}
              height={360}
              zoom={zoom}
              showGrid={showGrid}
              showHotspots={showHotspots}
              externalState={state}
              externalBubble={bubble}
              externalEffect={effect === 'none' ? null : effect}
              sendToHotspot={sendToHotspot}
              onHotspotClick={handleHotspotClick}
              onTileClick={(col, row) => setLastClick(`🗺️ Tile: (${col}, ${row})`)}
              onCharacterClick={(ch) => setLastClick(`🤖 Sammantha — State: ${ch.state}`)}
            />

            {/* Controls below canvas */}
            <div style={{
              display: 'flex',
              gap: '12px',
              marginTop: '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', color: '#666' }}>Zoom:</span>
              {[1, 2, 3, 4].map(z => (
                <button
                  key={z}
                  onClick={() => setZoom(z)}
                  style={{
                    background: zoom === z ? '#FF5C3A' : 'transparent',
                    color: zoom === z ? '#000' : '#FF5C3A',
                    border: '1px solid #FF5C3A',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {z}x
                </button>
              ))}

              <div style={{ width: '1px', height: '16px', background: '#333', margin: '0 4px' }} />

              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={e => setShowGrid(e.target.checked)}
                  style={{ accentColor: '#FF5C3A' }}
                />
                Grid
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#888', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={e => setShowHotspots(e.target.checked)}
                  style={{ accentColor: '#FF5C3A' }}
                />
                Hotspots
              </label>
            </div>
          </div>
        </div>

        {/* Controls panel */}
        <div style={{ flex: '0 0 280px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* State buttons */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <h3 style={{ fontSize: '12px', color: '#FF5C3A', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Estado de Sammy
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              {STATES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setState(s.value)}
                  style={{
                    background: state === s.value ? `${MOOD_COLORS[s.value] || '#FF5C3A'}22` : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${state === s.value ? (MOOD_COLORS[s.value] || '#FF5C3A') : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: '6px',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: state === s.value ? (MOOD_COLORS[s.value] || '#FF5C3A') : '#888',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{s.emoji}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Effects */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <h3 style={{ fontSize: '12px', color: '#FF5C3A', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Floor Effect
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {EFFECTS.map(e => (
                <button
                  key={e.value}
                  onClick={() => setEffect(e.value)}
                  style={{
                    background: effect === e.value ? 'rgba(255, 92, 58, 0.15)' : 'transparent',
                    border: `1px solid ${effect === e.value ? '#FF5C3A' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: effect === e.value ? '#FF5C3A' : '#888',
                    fontFamily: '"JetBrains Mono", monospace',
                  }}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speech bubbles */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <h3 style={{ fontSize: '12px', color: '#FF5C3A', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Speech Bubble
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {BUBBLES.map(b => (
                <button
                  key={b.label}
                  onClick={() => setBubble(b.value)}
                  style={{
                    background: bubble === b.value ? 'rgba(255, 92, 58, 0.15)' : 'transparent',
                    border: `1px solid ${bubble === b.value ? '#FF5C3A' : 'rgba(255,255,255,0.08)'}`,
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: bubble === b.value ? '#FF5C3A' : '#888',
                    fontFamily: 'inherit',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            padding: '14px',
          }}>
            <h3 style={{ fontSize: '12px', color: '#FF5C3A', margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Hotspots
            </h3>
            {[
              { emoji: '📊', name: 'Monitores', id: 'monitors' },
              { emoji: '💻', name: 'Terminal', id: 'terminal' },
              { emoji: '🔔', name: 'Alertas', id: 'alerts' },
              { emoji: '🎯', name: "Sammys's Desk", id: 'sammys-desk' },
              { emoji: '📁', name: 'Archivos', id: 'files' },
              { emoji: '🗺️', name: 'Mapa', id: 'map' },
              { emoji: '☁️', name: 'Cloud', id: 'cloud' },
              { emoji: '⚡', name: 'Energy', id: 'energy' },
            ].map(h => (
              <div
                key={h.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '3px 0',
                  fontSize: '11px',
                  color: '#888',
                }}
              >
                <span>{h.emoji}</span>
                <span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{h.name}</span>
              </div>
            ))}
            <p style={{ fontSize: '10px', color: '#555', margin: '8px 0 0 0' }}>
              💡 Click en un hotspot para que Sammy camine hacia él
            </p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div style={{
        maxWidth: '1200px',
        margin: '24px auto 0',
        background: 'rgba(255, 92, 58, 0.05)',
        border: '1px solid rgba(255, 92, 58, 0.15)',
        borderRadius: '10px',
        padding: '16px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
      }}>
        <div>
          <h4 style={{ color: '#FF5C3A', fontSize: '11px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>🎮 Motor Adaptado</h4>
          <p style={{ fontSize: '11px', color: '#888', margin: 0, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.5 }}>
            Canvas RAF game loop con BFS pathfinding. 9 estados de personaje. 8 hotspots navegables. 6 efectos de piso.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#FF5C3A', fontSize: '11px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>🧠 Integración IA</h4>
          <p style={{ fontSize: '11px', color: '#888', margin: 0, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.5 }}>
            SammyBrain conecta con OpenRouter. Mood-driven states. Event system con simulación automática.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#FF5C3A', fontSize: '11px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>🖼️ Sprites Pixel Art</h4>
          <p style={{ fontSize: '11px', color: '#888', margin: 0, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.5 }}>
            char_0.png → char_5.png cargados del repo Pixel Agents. Floor tiles, furniture, speech bubbles.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#FF5C3A', fontSize: '11px', margin: '0 0 6px 0', textTransform: 'uppercase' }}>⚡ Efectos Visuales</h4>
          <p style={{ fontSize: '11px', color: '#888', margin: 0, fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.5 }}>
            Matrix rain, sparkles, data stream, scanlines, glitch. Mood glow colors por estado.
          </p>
        </div>
      </div>
    </div>
  );
}
