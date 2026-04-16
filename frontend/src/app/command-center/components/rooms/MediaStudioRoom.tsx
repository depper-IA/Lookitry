'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function MediaStudioRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#060509" />
      <rect width="280" height={95} fill="#09060f" />

      {/* Back wall monitors */}
      {[80, 160].map((x, i) => (
        <g key={i}>
          <rect x={x} y={18} width={44} height={28} rx="1" fill="#07101e" stroke={color} strokeWidth="0.5" opacity="0.7" />
          {[4, 8, 12, 16, 20].map((ly, li) => (
            <rect key={li} x={x + 3} y={18 + ly} width={li % 3 === 0 ? 38 : 28} height={1} fill={color} opacity="0.3" />
          ))}
        </g>
      ))}

      {/* Social icons on wall */}
      {[60, 90, 120, 150, 180, 210].map((x, i) => (
        <rect key={i} x={x} y={52} width={10} height={10} rx={2} fill={color} opacity={0.1 + i * 0.05} />
      ))}

      {/* Floor */}
      <FloorGrid color={color} y0={95} rows={4} cols={9} />

      {/* Ring light */}
      <circle cx={140} cy={135} r={30} fill="none" stroke={color} strokeWidth="2" opacity="0.25" />
      <circle cx={140} cy={135} r={22} fill="none" stroke={accent} strokeWidth="1" opacity="0.2" />

      {/* Camera stand */}
      <rect x={133} y={125} width={14} height={18} rx={2} fill="#1a0d20" stroke={color} strokeWidth="0.5" />
      <ellipse cx={140} cy={125} rx={8} ry={5} fill={color} opacity="0.4" />

      {/* LED indicators */}
      {[5, 12, 19, 26].map((r, i) => (
        <circle key={i} cx={113 + i * 18} cy={158} r="2.5" fill={i === 0 ? color : '#1a1a2e'} opacity="0.9"
          className={i === 0 ? 'cc-blink' : ''} />
      ))}

      <ellipse cx={140} cy={162} rx={60} ry={14} fill={color} opacity="0.03" />
    </>
  );
}
