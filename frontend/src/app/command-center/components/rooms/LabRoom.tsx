'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function LabRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#040a04" />
      <rect width="280" height={95} fill="#050d05" />

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

      {/* Test rigs */}
      {[40, 100, 160, 220].map((x, ri) => (
        <g key={ri}>
          <rect x={x} y={105} width={40} height={45} rx="1" fill="#060d06" stroke={color} strokeWidth="0.4" opacity="0.8" />
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <g key={i}>
              <rect x={x + 5} y={110 + i * 5} width={30} height={3} rx="0.5"
                fill="#04080a" stroke={color} strokeWidth="0.2" opacity="0.8" />
              <circle cx={x + 37} cy={111.5 + i * 5} r="1.5"
                fill={(ri + i) % 3 === 0 ? color : (ri + i) % 3 === 1 ? accent : '#ff4444'}
                opacity="0.9" className={(ri + i) % 2 === 0 ? 'cc-blink' : ''} />
            </g>
          ))}
        </g>
      ))}

      {/* BUILD PASSING text */}
      <rect x={95} y={160} width={90} height={12} rx={2} fill={color} opacity="0.12" />
      <text x={105} y={169} fill={color} fontSize="7" fontFamily="monospace" opacity="0.9">✓ BUILD PASSING</text>

      <ellipse cx={140} cy={160} rx={70} ry={14} fill={color} opacity="0.04" />
    </>
  );
}
