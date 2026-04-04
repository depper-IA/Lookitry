import type { Metadata } from 'next';
import TerminosClient from './TerminosClient';

const BASE_URL = 'https://lookitry.com';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Lookitry',
  description:
    'Términos y condiciones de uso de la plataforma Lookitry. Ley 1480 de 2011, Ley 1581 de 2012, Ley 527 de 1999 — Colombia.',
  alternates: {
    canonical: `/terminos`,
  },
  robots: {
    index: true,
    follow: false,
  },
  openGraph: {
    type: 'website',
    url: `/terminos`,
    title: 'Términos y Condiciones — Lookitry',
    description: 'Términos y condiciones de uso de la plataforma Lookitry. Legislación colombiana.',
  },
};

export default function TerminosPage() {
  return <TerminosClient />;
}
