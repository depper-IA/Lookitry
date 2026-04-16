'use client';

import { useEffect, useRef } from 'react';

export function DataStream() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const draw = () => {
      ctx.fillStyle = 'rgba(10, 10, 30, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00FFFF';
      ctx.font = '10px monospace';
      const text = `HEARTBEAT::ACTIVE STATUS:OK NEXT_PING:++${Math.random().toString(36).slice(2, 6)}`;
      ctx.fillText(text, 10, Math.random() * canvas.height);
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={60}
      style={{ borderRadius: 8, opacity: 0.8 }}
    />
  );
}
