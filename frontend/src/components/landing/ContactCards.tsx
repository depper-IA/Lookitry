'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
      <motion.a
        href={`mailto:${contact.email}`}
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="rounded-3xl border border-border-active bg-dark-card p-6 hover:border-accent/40 transition-all"
      >
        <p className="text-[11px] uppercase tracking-[0.1em] text-accent font-semibold">Canal oficial</p>
        <p className="text-white text-lg font-semibold mt-1">Email corporativo</p>
        <p className="text-text-secondary text-sm mt-2">{contact.email}</p>
        <p className="text-text-muted text-xs mt-3">Respuesta típica: menos de 24h hábiles.</p>
      </motion.a>
      <motion.a
        href={contact.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="rounded-3xl border border-border-active bg-dark-card p-6 hover:border-accent/40 transition-all"
      >
        <p className="text-[11px] uppercase tracking-[0.1em] text-accent font-semibold">Canal rápido</p>
        <p className="text-white text-lg font-semibold mt-1">WhatsApp de soporte</p>
        <p className="text-text-secondary text-sm mt-2">{contact.whatsappDisplay}</p>
        <p className="text-text-muted text-xs mt-3">Ideal para onboarding e integración inicial.</p>
      </motion.a>
      <motion.div
        whileHover={{ y: -8, transition: { duration: 0.3 } }}
        className="rounded-3xl border border-border-active bg-dark-card p-6 md:col-span-2 hover:border-accent/40 transition-all"
      >
        <p className="text-white text-lg font-semibold">Horario y cobertura</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-accent text-xs uppercase tracking-wider">Horario COL</p>
            <p className="text-text-secondary text-sm mt-1">Lunes a viernes, 9:00 a.m. - 6:00 p.m.</p>
          </div>
          <div>
            <p className="text-accent text-xs uppercase tracking-wider">Implementación</p>
            <p className="text-text-secondary text-sm mt-1">Activación guiada para Shopify, WooCommerce y HTML.</p>
          </div>
          <div>
            <p className="text-accent text-xs uppercase tracking-wider">Soporte técnico</p>
            <p className="text-text-secondary text-sm mt-1">Acompañamiento en integración y configuración del widget.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
