'use client';

/* ─── CONTROL TOWER ROOM ───────────────────────────────────────────────────── */
import React from 'react';

export function ControlTowerRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#050810" />
      <rect width="280" height="95" fill="#07091a" />

      {/* Back wall monitors */}
      {[50, 120, 190].map((x, i) => (
        <g key={i}>
          <rect x={x} y={18} width={44} height={28} rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.7" />
          {[4, 8, 12, 16, 20].map((ly, li) => (
            <rect key={li} x={x + 3} y={18 + ly} width={li % 3 === 0 ? 38 : 28} height={1} fill={color} opacity="0.3" />
          ))}
          <rect x={x + 1} y={19} width={42} height={4} fill={color} opacity="0.08" />
        </g>
      ))}

      {/* Left wall panel */}
      <rect x={0} y={95} width={36} height={85} fill="#060913" />
      {[20, 30, 40, 50, 60, 70].map((y, i) => (
        <rect key={i} x={8} y={y + 95} width={6} height={2} fill={i % 2 === 0 ? color : accent} opacity="0.6" />
      ))}

      {/* Isometric floor */}
      <FloorGrid color={color} y0={95} rows={4} cols={9} />

      {/* Radar circles on floor */}
      <circle cx={140} cy={148} r={38} fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <circle cx={140} cy={148} r={25} fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <circle cx={140} cy={148} r={12} fill="none" stroke={color} strokeWidth="0.4" opacity="0.2" />

      {/* Command console */}
      <ellipse cx={140} cy={148} rx={45} ry={12} fill={color} opacity="0.05" />
      <rect x={110} y={140} width={60} height={8} rx={3} fill="#0a1525" stroke={color} strokeWidth="0.5" opacity="0.8" />
      {[116, 126, 136, 146, 156].map((x, i) => (
        <rect key={i} x={x} y={142} width={6} height={4} rx={0.5} fill={i === 2 ? color : '#1a2840'} opacity="0.9" />
      ))}

      {/* Radar sweep line */}
      <line x1={140} y1={148} x2={140} y2={112} stroke={color} strokeWidth="1.5" opacity="0.5"
        className="cc-radar-sweep" style={{ transformOrigin: '140px 148px' }} />

      {/* Floor glow */}
      <ellipse cx={140} cy={158} rx={70} ry={18} fill={color} opacity="0.035" />
    </>
  );
}

/* ─── ISOMETRIC FLOOR GRID ──────────────────────────────────────────────────── */
export function FloorGrid({ color, y0 = 95, rows = 4, cols = 9 }: { color: string; y0?: number; rows?: number; cols?: number }) {
  const tiles = [];
  const tw = 32;
  const th = 14;
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
