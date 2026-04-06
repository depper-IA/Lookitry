'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface HalfStarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
}

export function HalfStarRating({
  value,
  onChange,
  readOnly = false,
  size = 32,
  className = '',
}: HalfStarRatingProps) {
  const [hoverValue, setHoverValue] = useState(0);

  const activeValue = hoverValue || value;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, starIndex: number) => {
    if (readOnly) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    setHoverValue(isHalf ? starIndex - 0.5 : starIndex);
  };

  const handleMouseLeave = () => {
    if (readOnly) return;
    setHoverValue(0);
  };

  const handleClick = (starIndex: number, e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isHalf = x < rect.width / 2;
    onChange(isHalf ? starIndex - 0.5 : starIndex);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`} onMouseLeave={handleMouseLeave}>
      {[1, 2, 3, 4, 5].map((starIndex) => {
        const filled = activeValue >= starIndex;
        const halfFilled = !filled && activeValue >= starIndex - 0.5;

        return (
          <div
            key={starIndex}
            className="relative"
            style={{ width: size, height: size }}
          >
            {/* Fondo de estrella (vacía) */}
            <Star
              className="absolute top-0 left-0 text-white/25"
              size={size}
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
            />
            {/* Estrella llena */}
            {filled && (
              <Star
                className="absolute top-0 left-0 text-[var(--accent)]"
                size={size}
                fill="var(--accent)"
                stroke="none"
              />
            )}
            {/* Mitad llena (izquierda) */}
            {!filled && halfFilled && (
              <div className="absolute top-0 left-0 overflow-hidden" style={{ width: size / 2 }}>
                <Star
                  className="text-[var(--accent)]"
                  size={size}
                  fill="var(--accent)"
                  stroke="none"
                />
              </div>
            )}
            {/* Área clickeable */}
            {!readOnly && onChange && (
              <svg
                className="absolute top-0 left-0 cursor-pointer"
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                onMouseMove={(e) => handleMouseMove(e, starIndex)}
                onClick={(e) => handleClick(starIndex, e)}
              >
                <rect
                  x="0"
                  y="0"
                  width={size}
                  height={size}
                  fill="transparent"
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}
