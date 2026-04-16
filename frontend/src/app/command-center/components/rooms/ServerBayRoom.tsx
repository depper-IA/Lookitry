'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function ServerBayRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#050810" />
      <rect width="280" height={95} fill="#060a18" />

      {/* Floor */}
      <FloorGrid color={color} y0={95} rows={4} cols={9} />

      {/* Server racks */}
      {[30, 80, 130, 180, 230].map((x, ri) => (
        <g key={ri}>
          <rect x={x} y={20} width={32} height={135} rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.85" />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
            <rect key={i} x={x + 3} y={25 + i * 12} width={26} height={8} rx="0.5"
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
      <rect x={0} y={158} width={280} height={6} fill={color} opacity="0.06" />
      <ellipse cx={140} cy={162} rx={90} ry={14} fill={color} opacity="0.025" />
    </>
  );
}
