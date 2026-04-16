'use client';

import React from 'react';
import { FloorGrid } from './ControlTowerRoom';

export function TradingFloorRoom({ color, accent }: { color: string; accent: string }) {
  return (
    <>
      <rect width="280" height="180" fill="#070700" />
      <rect width="280" height={95} fill="#0a0900" />

      {/* 4 monitors with candlestick charts */}
      {[35, 95, 155, 215].map((x, i) => (
        <g key={i}>
          <rect x={x} y={15} width={42} height={30} rx="1" fill="#090900" stroke={color} strokeWidth="0.5" opacity="0.8" />
          {[0, 6, 12, 18, 24, 30].map((cx, ci) => {
            const h = [10, 6, 14, 8, 12, 9][ci];
            const isGreen = ci % 2 === 0;
            return (
              <rect key={ci} x={x + 4 + cx} y={45 - h - 8} width={4} height={h} rx="0.5"
                fill={isGreen ? accent : '#FF4444'} opacity="0.85" />
            );
          })}
        </g>
      ))}

      {/* Floor */}
      <FloorGrid color={color} y0={95} rows={4} cols={9} />

      {/* Ticker tape */}
      <rect x={0} y={155} width={280} height={10} fill={color} opacity="0.07" />
      <text x={10} y={162} fill={color} fontSize="6" opacity="0.6" fontFamily="monospace">
        BTC $67,420 ▲ ETH $3,247 ▼ SOL $142 ▲ ADA $0.47 ▲ BNB $589 ▲ AVAX $38 ▼
      </text>

      {/* Trading desk */}
      <rect x={90} y={125} width={100} height={22} rx={2} fill="#1a1500" stroke={color} strokeWidth="0.5" />
      {[100, 120, 140, 160, 175].map((x, i) => (
        <rect key={i} x={x} y={128} width={12} height={8} rx="0.5" fill="#0a0900" stroke={color} strokeWidth="0.3" opacity="0.9" />
      ))}

      <ellipse cx={140} cy={155} rx={65} ry={16} fill={color} opacity="0.04" />
    </>
  );
}
