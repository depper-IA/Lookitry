import type { Metadata } from 'next';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Prueba Lookitry por $20.000',
  description:
    'Crea tu cuenta y activa el probador virtual con IA para tu tienda. Accede a nuestra prueba de 7 días por solo $20.000 COP.',
  robots: {
    index: true,
    follow: false,
  },
};

export default function RegisterPage() {
  return <RegisterForm />;
}
