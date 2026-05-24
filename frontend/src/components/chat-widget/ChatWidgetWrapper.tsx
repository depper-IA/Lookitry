'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const ChatWidgetComponent = dynamic(
  () => import('./ChatWidget').then((mod) => mod.ChatWidget),
  { ssr: false }
);

// Rutas donde SÍ aparece el chat (landing pages)
const ALLOWED_PATHS = [
  '/',
  '/planes',
  '/probador-virtual',
  '/checkout',
  '/demo',
  '/contacto',
  '/aviso-legal',
  '/politicas-privacidad',
  '/terminos',
  '/cookies',
  '/blog',
  '/casos-de-exito',
  '/ayuda',
  '/activar-cuenta',
];

// Rutas donde NO aparece el chat (dashboard, admin, auth, embed, plugin, mini-landing, trial, etc.)
const BLOCKED_PATHS = [
  '/dashboard',
  '/admin',
  '/auth',
  '/api',
  '/embed',
  '/plugin-woocommerce',
  '/mini-landing',
  '/trial',
  '/command-center',
  '/estado',
  '/api-developer',
];

function isAllowedPath(pathname: string): boolean {
  // Bloquear rutas explícitas primero
  for (const blocked of BLOCKED_PATHS) {
    if (pathname.startsWith(blocked)) return false;
  }
  
  // Permitir solo rutas de landing específicas
  for (const allowed of ALLOWED_PATHS) {
    if (pathname === allowed || pathname === allowed + '/') return true;
  }
  
  // Permitir rutas dinámicas de checkout (checkout/:slug)
  if (pathname.startsWith('/checkout/')) return true;
  
  // Permitir blog posts
  if (pathname.startsWith('/blog/')) return true;
  
  return false;
}

export function ChatWidgetWrapper() {
  const pathname = usePathname();
  
  if (!isAllowedPath(pathname)) return null;
  
  return <ChatWidgetComponent />;
}