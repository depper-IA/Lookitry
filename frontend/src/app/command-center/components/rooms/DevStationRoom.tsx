'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function DevStationRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#050408" />
      <rect width="280" height={95} fill="#070510" />

      {/* Back wall monitors */}
      {[50, 120, 190].map((x, i) => (
        <g key={i}>
          <rect x={x} y={18} width={44} height={28} rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.7" />
          {[4, 8, 12, 16, 20].map((ly, li) => (
            <rect key={li} x={x + 3} y={18 + ly} width={li % 3 === 0 ? 38 : 28} height={1} fill={color} opacity="0.3" />
          ))}
        </g>
      ))}

      {/* Floor */}
      <FloorGrid color={color} y0={95} rows={4} cols={9} />

      {/* Dual main monitors */}
      {[70, 155].map((x, i) => (
        <g key={i}>
          <rect x={x} y={100} width={55} height={38} rx="1" fill="#060310" stroke={color} strokeWidth="0.8" opacity="0.95" />
          {[4, 8, 12, 16, 20, 24, 28].map((ly, li) => (
            <rect key={li} x={x + 3} y={100 + ly} width={li % 3 === 0 ? 48 : li % 3 === 1 ? 35 : 42}
              height={2} fill={li % 4 === 0 ? accent : color} opacity={0.2 + (li % 3) * 0.15} className="cc-code-line" />
          ))}
        </g>
      ))}

      {/* Keyboard */}
      <rect x={105} y={143} width={70} height={12} rx={2} fill="#1a1030" stroke={color} strokeWidth="0.4" opacity="0.9" />
      {[0, 1, 2, 3, 4].map(r =>
        [0, 1, 2, 3, 4, 5, 6].map(c => (
          <rect key={`${r}-${c}`} x={108 + c * 9} y={145 + r * 2} width={7} height="1.5"
            rx="0.3" fill={color} opacity="0.15" />
        ))
      )}

      {/* Git graph */}
      <circle cx={245} cy={110} r={2} fill={color} opacity="0.9" />
      <circle cx={245} cy={120} r={2} fill={accent} opacity="0.9" />
      <circle cx={245} cy={130} r={2} fill={color} opacity="0.9" />
      <line x1={245} y1={110} x2={245} y2={130} stroke={color} strokeWidth="0.5" opacity="0.4" />

      <ellipse cx={140} cy={160} rx={65} ry={15} fill={color} opacity="0.04" />
    </>
  );
}
