'use client';

import { Lead, STATUS_COLORS, STATUS_LABELS, cleanLeadName, formatDate } from '../types';
import { IconX, IconMapPin, IconPhone, IconMail, IconGlobe, IconStar } from './LeadIcons';

interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
}

export default function LeadDetailModal({ lead, onClose }: LeadDetailModalProps) {
  // Google Maps: usar nombre + direccion para encontrar el negocio correcto (mas preciso que lat/long)
  const googleMapsUrl = (lead.name && lead.address)
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lead.name} ${lead.address}`)}`
    : lead.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lead.address)}`
    : lead.latitude && lead.longitude
    ? `https://www.google.com/maps/search/?api=1&query=${lead.latitude},${lead.longitude}`
    : null;

  const phoneLink = lead.phone ? `tel:+57${lead.phone.replace(/\D/g, '')}` : null;
  const emailLink = lead.email ? `mailto:${lead.email}` : null;

  const instagramLink = lead.instagram
    ? lead.instagram.startsWith('http') ? lead.instagram : `https://instagram.com/${lead.instagram.replace('@', '')}`
    : null;

  const tiktokLink = lead.tiktok
    ? lead.tiktok.startsWith('http') ? lead.tiktok : `https://tiktok.com/@${lead.tiktok.replace('@', '')}`
    : null;

  const websiteLink = lead.website && !lead.website.startsWith('http')
    ? `https://${lead.website}`
    : lead.website || null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border"
        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b backdrop-blur-md" style={{ borderColor: 'var(--border-color)', backgroundColor: 'color-mix(in srgb, var(--bg-card) 90%, transparent)' }}>
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{cleanLeadName(lead.name)}</h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {lead.business_type || lead.source}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-muted)' }}
          >
            <IconX />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Action Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: '#4285F4', color: '#fff' }}
              >
                <IconMapPin /> Google Maps
              </a>
            )}
            {phoneLink && (
              <a
                href={phoneLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: '#25D366', color: '#fff' }}
              >
                <IconPhone /> Llamar
              </a>
            )}
            {emailLink && (
              <a
                href={emailLink}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--accent)', color: '#fff' }}
              >
                <IconMail /> Email
              </a>
            )}
            {websiteLink && (
              <a
                href={websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium text-sm transition-all hover:scale-[1.02]"
                style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-primary)', borderColor: 'var(--border-color)', border: '1px solid' }}
              >
                <IconGlobe /> Website
              </a>
            )}
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Estado:</span>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold"
              style={{ backgroundColor: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status] }}
            >
              {STATUS_LABELS[lead.status]}
            </span>
          </div>

          {/* Location Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Ubicación</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <IconMapPin />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Dirección</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{lead.address || 'No disponible'}</p>
              </div>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <IconGlobe />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Ciudad / País</span>
                </div>
                <p className="text-sm" style={{ color: 'var(--text-primary)' }}>{lead.city || '—'}, {lead.country}</p>
              </div>
            </div>
            {lead.latitude != null && lead.longitude != null && (
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Coordenadas</p>
                <p className="text-sm font-mono" style={{ color: 'var(--text-secondary)' }}>
                  {lead.latitude.toFixed(6)}, {lead.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {/* Contact Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Contacto</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.phone && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Teléfono</p>
                  <a href={phoneLink!} className="text-sm font-medium hover:underline" style={{ color: 'var(--accent)' }}>
                    {lead.phone}
                  </a>
                </div>
              )}
              {lead.email && (
                <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Email</p>
                  <a href={emailLink!} className="text-sm font-medium hover:underline truncate block" style={{ color: 'var(--accent)' }}>
                    {lead.email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Social Section */}
          {(lead.instagram || lead.tiktok || lead.website) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Redes Sociales</h3>
              <div className="flex flex-wrap gap-3">
                {lead.instagram && (
                  <a
                    href={instagramLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#E4405F20', color: '#E4405F', border: '1px solid #E4405F30' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    @{lead.instagram.replace('@', '')}
                  </a>
                )}
                {lead.tiktok && (
                  <a
                    href={tiktokLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: '#00000020', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.15v-3.45a4.85 4.85 0 01-1-.11z"/></svg>
                    @{lead.tiktok.replace('@', '')}
                  </a>
                )}
                {lead.website && (
                  <a
                    href={websiteLink!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
                    style={{ backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}
                  >
                    <IconGlobe /> Website
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Rating Section */}
          {(lead.rating != null || lead.user_ratings_total != null) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Valoración Google</h3>
              <div className="flex items-center gap-4 p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                {lead.rating != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{lead.rating.toFixed(1)}</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} style={{ color: star <= Math.round(lead.rating!) ? '#FBBD23' : 'var(--text-muted)' }}>
                          <IconStar />
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {lead.user_ratings_total !== undefined && (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    ({lead.user_ratings_total.toLocaleString()} reseñas)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notes Section */}
          {lead.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Notas</h3>
              <div className="p-4 rounded-xl border" style={{ backgroundColor: 'var(--bg-base)', borderColor: 'var(--border-color)' }}>
                <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{lead.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Creado: {formatDate(lead.created_at)} • Fuente: {lead.source}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
