import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Crear cuenta gratis — Lookitry',
  description:
    'Crea tu cuenta y activa el probador virtual con IA para tu tienda. 7 dias gratis, sin tarjeta de credito.',
  robots: {
    index: true,
    follow: false,
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
