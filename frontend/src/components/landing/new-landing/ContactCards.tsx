'use client';

import { useEffect, useState } from 'react';
import { fetchPublicPaymentSettings, formatWhatsAppDisplay, toWhatsAppUrl } from '@/services/public-config.service';

export function ContactCards() {
  const [contact, setContact] = useState({
    email: 'info@lookitry.com',
    whatsappUrl: 'https://wa.me/573105436281',
    whatsappDisplay: '+57 310 543 6281',
  });

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then(data => {
        if (!data) return;
        setContact({
          email: data.manualEmail || 'info@lookitry.com',
          whatsappUrl: toWhatsAppUrl(data.manualWhatsapp) || 'https://wa.me/573105436281',
          whatsappDisplay: formatWhatsAppDisplay(data.manualWhatsapp),
        });
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-5">
      <a
        href={`mailto:${contact.email}`}
        className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#FF5C3A]/40 transition-colors"
      >
        <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Canal oficial</p>
        <p className="text-white text-lg font-semibold mt-1">Email corporativo</p>
        <p className="text-[#bbb] text-sm mt-2">{contact.email}</p>
        <p className="text-[#666] text-xs mt-3">Respuesta tipica: menos de 24h habiles.</p>
      </a>
      <a
        href={contact.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 hover:border-[#FF5C3A]/40 transition-colors"
      >
        <p className="text-[11px] uppercase tracking-[0.1em] text-[#FF5C3A] font-semibold">Canal rapido</p>
        <p className="text-white text-lg font-semibold mt-1">WhatsApp de soporte</p>
        <p className="text-[#bbb] text-sm mt-2">{contact.whatsappDisplay}</p>
        <p className="text-[#666] text-xs mt-3">Ideal para onboarding e integracion inicial.</p>
      </a>
      <div className="rounded-3xl border border-[#2a2a2a] bg-[#111] p-6 md:col-span-2">
        <p className="text-white text-lg font-semibold">Horario y cobertura</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-[#FF5C3A] text-xs uppercase tracking-wider">Horario COL</p>
            <p className="text-[#bbb] text-sm mt-1">Lunes a viernes, 9:00 a.m. - 6:00 p.m.</p>
          </div>
          <div>
            <p className="text-[#FF5C3A] text-xs uppercase tracking-wider">Implementacion</p>
            <p className="text-[#bbb] text-sm mt-1">Activacion guiada para Shopify, WooCommerce y HTML.</p>
          </div>
          <div>
            <p className="text-[#FF5C3A] text-xs uppercase tracking-wider">Soporte tecnico</p>
            <p className="text-[#bbb] text-sm mt-1">Acompanamiento en integracion y configuracion del widget.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
