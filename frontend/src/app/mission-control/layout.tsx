// Lookitry Mission Control - Root Layout
// v1.0 | Abril 2026
// ⚠️ IMPORTANTE: Este layout NO debe tener <html> ni <body>
// Next.js ya provee la estructura HTML en src/app/layout.tsx
// Este archivo solo define metadata y estilos para la ruta /mission-control/*

import { Metadata } from 'next';
import './globals.css';

// ============================================================================
// Layout
// ============================================================================

// ⚠️ IMPORTANTE: Este componente NO debe tener <html> ni <body>
// Solo retorna children - Next.js maneja la estructura HTML desde app/layout.tsx
export default function MissionControlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}