'use client';

import { MessageCircle } from 'lucide-react';

const WHATSAPP_NUMBER = '573105436281';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function WhatsAppFloatingButton() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escríbenos en WhatsApp"
      className="fixed bottom-6 right-6 z-50 hidden md:flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-xl"
      style={{
        backgroundColor: '#25D366',
        boxShadow: '0 4px 20px rgba(37, 211, 102, 0.4)',
      }}
    >
      <MessageCircle className="w-6 h-6 text-white" strokeWidth={2.5} />
    </a>
  );
}