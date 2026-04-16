'use client';

import { useEffect, useRef } from 'react';

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random(),
      da: (Math.random() - 0.5) * 0.02,
    }));

    const draw = (t: number = 0) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((s) => {
        s.a += s.da;
        if (s.a <= 0 || s.a >= 1) s.da *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${Math.abs(s.a)})`;
        ctx.fill();
      });
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => cancelAnimationFrame(rafId);
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} className="starfield" />;
}
