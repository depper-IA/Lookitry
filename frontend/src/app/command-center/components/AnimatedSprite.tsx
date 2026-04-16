'use client';

/* ─── ANIMATED SPRITE ─────────────────────────────────────────────────────── */

interface Props {
  color: string;
  accent: string;
  x: number;
  y: number;
  isMoving: boolean;
}

export function AnimatedSprite({ color, accent, x, y, isMoving }: Props) {
  return (
    <g style={{ transform: `translate(${x - 10}px, ${y - 28}px)`, imageRendering: 'pixelated' }}>
      {/* Outer glow halo */}
      <ellipse cx="10" cy="15" rx="22" ry="30" fill={color} opacity={isMoving ? 0.04 : 0.12} className={isMoving ? '' : 'cc-halo'} />
      {/* Ground shadow */}
      <ellipse cx="10" cy="30" rx={isMoving ? 14 : 11} ry={isMoving ? 2 : 4} fill={color} opacity={isMoving ? 0.08 : 0.22} className={isMoving ? '' : 'cc-shadow-idle'} />
      {/* Legs */}
      <g className={isMoving ? 'cc-legs-walk' : 'cc-legs-idle'}>
        <rect x="5" y="22" width="5" height="9" fill={color} opacity="0.9" />
        <rect x="11" y="22" width="5" height="9" fill={color} opacity="0.9" />
        <rect x="3" y="29" width="7" height="4" fill={accent} opacity="1" />
        <rect x="11" y="29" width="7" height="4" fill={accent} opacity="1" />
      </g>
      {/* Body */}
      <g className={isMoving ? '' : 'cc-bounce'}>
        <rect x="3" y="11" width="14" height="13" fill={color} opacity="0.95" />
        <rect x="7" y="14" width="6" height="4" fill={accent} opacity="1" />
      </g>
      {/* Left arm */}
      <g style={{ transformOrigin: '2px 13px' }} className={isMoving ? 'cc-arm-l' : ''}>
        <rect x="0" y="12" width="4" height="9" fill={color} opacity="0.85" />
      </g>
      {/* Right arm */}
      <g style={{ transformOrigin: '17px 13px' }} className={isMoving ? 'cc-arm-r' : ''}>
        <rect x="17" y="12" width="4" height="9" fill={color} opacity="0.85" />
      </g>
      {/* Neck */}
      <rect x="7" y="8" width="6" height="4" fill={color} opacity="0.9" />
      {/* Head */}
      <g className={isMoving ? '' : 'cc-bounce'}>
        <rect x="3" y="0" width="14" height="10" fill={color} opacity="1" rx="1" />
      </g>
      {/* Visor */}
      <rect x="4" y="2" width="12" height="5" fill={accent} opacity="1" rx="0.5" className={isMoving ? '' : 'cc-visor-pulse'} />
      {/* Visor shine */}
      <rect x="5" y="3" width="10" height="2" fill="#ffffff" opacity="0.4" className={isMoving ? '' : 'cc-visor-pulse'} />
    </g>
  );
}
