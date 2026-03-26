import type { Metadata } from 'next';
import { AplicacionesClient } from '@/components/landing/AplicacionesClient';

export const metadata: Metadata = {
  title: 'Aplicaciones Reales — Lookitry',
  description: 'Ejemplos reales de categorías que ya usan el probador virtual de Lookitry.',
};

export default function AplicacionesPage() {
  return <AplicacionesClient />;
}
