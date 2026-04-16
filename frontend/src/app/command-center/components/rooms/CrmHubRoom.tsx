'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function CrmHubRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#040b06" />
      <rect width="280" height={95} fill="#050d07" />

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

      {/* Funnel chart */}
      <polygon points="110,100 170,100 160,115 120,115" fill={color} opacity="0.15" stroke={color} strokeWidth="0.5" />
      <polygon points="120,115 160,115 152,128 128,128" fill={color} opacity="0.2" stroke={color} strokeWidth="0.5" />
      <polygon points="128,128 152,128 146,140 134,140" fill={color} opacity="0.3" stroke={color} strokeWidth="0.5" />

      {/* Lead nodes */}
      {[50, 80, 110, 200, 230].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={155} r={5} fill={i < 2 ? color : '#1a2010'} opacity="0.8" />
          <line x1={x} y1={155} x2={140} y2={140} stroke={color} strokeWidth="0.3" opacity="0.2" />
        </g>
      ))}

      {/* MRR counter */}
      <rect x={200} y={100} width={65} height={30} rx={2} fill="#061a0c" stroke={color} strokeWidth="0.5" />
      <text x={208} y={112} fill={color} fontSize="6" opacity="0.7" fontFamily="monospace">MRR</text>
      <text x={205} y={124} fill={color} fontSize="9" fontWeight="bold" opacity="0.95" fontFamily="monospace">$2,082</text>

      <ellipse cx={140} cy={162} rx={70} ry={15} fill={color} opacity="0.04" />
    </>
  );
}
