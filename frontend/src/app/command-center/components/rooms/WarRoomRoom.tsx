'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function WarRoomRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#0a0104" />
      <rect width="280" height={95} fill="#0d0206" />

      {/* Back wall monitors */}
      {[50, 120, 190].map((x, i) => (
        <g key={i}>
          <rect x={x} y={18} width={44} height={28} rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.7" />
          {[4, 8, 12, 16, 20].map((ly, li) => (
            <rect key={li} x={x + 3} y={18 + ly} width={li % 3 === 0 ? 38 : 28} height={1} fill={color} opacity="0.3" />
          ))}
        </g>
      ))}

      {/* Network map */}
      {[[50, 40], [130, 55], [210, 40], [90, 70], [170, 70]].map(([nx, ny], i) => (
        <circle key={i} cx={nx} cy={ny} r={4} fill={color} opacity="0.3" className="cc-blink" />
      ))}
      {[[50, 40], [130, 55], [210, 40], [90, 70], [170, 70]].map(([nx, ny], i) =>
        i < 4 ? (
          <line key={i} x1={nx} y1={ny} x2={[130, 210, 90, 170][i]} y2={[55, 40, 70, 70][i]}
            stroke={color} strokeWidth="0.4" opacity="0.3" />
        ) : null
      )}

      {/* Floor */}
      <FloorGrid color={color} y0={95} rows={4} cols={9} />

      {/* Radar circles */}
      <circle cx={140} cy={142} r={42} fill="none" stroke={color} strokeWidth="0.6" opacity="0.25" />
      <circle cx={140} cy={142} r={28} fill="none" stroke={color} strokeWidth="0.5" opacity="0.2" />
      <circle cx={140} cy={142} r={14} fill="none" stroke={color} strokeWidth="0.4" opacity="0.2" />
      <circle cx={140} cy={142} r={3} fill={color} opacity="0.5" />

      {/* Radar blips */}
      <circle cx={162} cy={130} r="2.5" fill={accent} opacity="0.8" className="cc-blink" />
      <circle cx={118} cy={158} r={2} fill={accent} opacity="0.7" className="cc-blink" />

      {/* Sweep line */}
      <line x1={140} y1={142} x2={140} y2={102} stroke={color} strokeWidth="2" opacity="0.5"
        className="cc-radar-sweep" style={{ transformOrigin: '140px 142px' }} />

      <ellipse cx={140} cy={158} rx={68} ry={16} fill={color} opacity="0.04" />
    </>
  );
}
