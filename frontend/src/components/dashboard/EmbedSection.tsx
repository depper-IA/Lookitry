'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, Eye, EyeOff, Copy, Check, MessageCircle, Mail, Globe, ShoppingBag, Code2, LayoutGrid } from 'lucide-react';

type Platform = 'wordpress' | 'wix' | 'shopify' | 'other';

const PLATFORMS: Array<{ id: Platform; name: string; icon: React.ReactNode; desc: string }> = [
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: <Globe className="w-5 h-5 text-blue-400" />,
    desc: 'Elementor, Divi, bloques clásicos',
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: <LayoutGrid className="w-5 h-5 text-violet-400" />,
    desc: 'Editor de Wix',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: <ShoppingBag className="w-5 h-5 text-emerald-400" />,
    desc: 'Tienda en Shopify',
  },
  {
    id: 'other',
    name: 'Otro',
    icon: <Code2 className="w-5 h-5 text-[#FF5C3A]" />,
    desc: 'HTML, Webflow, Squarespace…',
  },
];

const PLATFORM_STEPS: Record<Platform, Array<{ title: string; detail: string }>> = {
  wordpress: [
    { title: 'Abre la página donde quieres el probador', detail: 'Ve a Páginas → Editar en tu WordPress.' },
    { title: 'Agrega un bloque HTML personalizado', detail: 'Haz clic en el "+" → busca "HTML personalizado" o "Custom HTML".' },
    { title: 'Pega el código de abajo', detail: 'Copia el código y pégalo dentro del bloque HTML.' },
    { title: 'Guarda y publica', detail: 'Haz clic en "Actualizar" o "Publicar" y listo.' },
  ],
  wix: [
    { title: 'Abre el editor de Wix', detail: 'Entra a tu panel de Wix y haz clic en "Editar sitio".' },
    { title: 'Agrega un elemento HTML', detail: 'Haz clic en "+" → Más → HTML iFrame.' },
    { title: 'Pega la URL del probador', detail: 'En el campo de URL pega la dirección que aparece abajo.' },
    { title: 'Ajusta el tamaño y publica', detail: 'Arrastra para ajustar el tamaño y haz clic en "Publicar".' },
  ],
  shopify: [
    { title: 'Ve al editor de tu tienda', detail: 'En Shopify Admin → Tienda en línea → Temas → Personalizar.' },
    { title: 'Agrega una sección HTML', detail: 'Haz clic en "Agregar sección" → busca "HTML personalizado".' },
    { title: 'Pega el código de abajo', detail: 'Copia el código y pégalo en el campo de contenido.' },
    { title: 'Guarda los cambios', detail: 'Haz clic en "Guardar" y el probador aparecerá en tu tienda.' },
  ],
  other: [
    { title: 'Abre el editor de tu sitio', detail: 'Accede al editor HTML o de contenido de tu plataforma.' },
    { title: 'Encuentra el lugar donde quieres el probador', detail: 'Puede ser una página de producto, una sección especial, etc.' },
    { title: 'Pega el código de abajo', detail: 'Copia el código HTML y pégalo en el lugar elegido.' },
    { title: 'Guarda y verifica', detail: 'Guarda los cambios y abre tu sitio para ver el probador.' },
  ],
};

// Ícono de código SVG alineado con el sistema de íconos del resto de la sección
function CodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

// Card contenedor — misma estética que el resto de la sección
function SectionCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={`p-6 md:p-8 rounded-[2.5rem] bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm ${className}`}
    >
      {children}
    </section>
  );
}

// Header de sección — mismo patrón que General / Apariencia / Pro
function SectionHeader({ step, title, subtitle }: { step?: number; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--border-color)] pb-5 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center flex-shrink-0">
        {step !== undefined ? (
          <span className="text-[#FF5C3A] font-black text-sm">{step}</span>
        ) : (
          <CodeIcon className="w-5 h-5 text-[#FF5C3A]" />
        )}
      </div>
      <div>
        <h3 className="text-base font-bold text-[var(--text-primary)] italic uppercase tracking-tight">{title}</h3>
        <p className="text-[10px] text-[var(--text-secondary)] uppercase font-medium tracking-widest">{subtitle}</p>
      </div>
    </div>
  );
}

export function EmbedSection() {
  const { brand } = useAuth();
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<Platform | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [iframeCode, setIframeCode] = useState('');
  const [widgetCode, setWidgetCode] = useState('');
  const [activeTab, setActiveTab] = useState<'widget' | 'iframe'>('widget');

  useEffect(() => {
    if (brand?.slug) {
      const baseUrl = 'https://lookitry.com';
      const url = `${baseUrl}/marca/${brand.slug}`;
      setEmbedUrl(url);
      
      // Iframe clásico
      setIframeCode(`<iframe src="${baseUrl}/embed/${brand.slug}" width="100%" height="750" frameborder="0" style="border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.10);"></iframe>`);
      
      // Widget inteligente
      setWidgetCode(
        `<div id="lookitry-tester-container" data-slug="${brand.slug}"></div>\n` +
        `<script src="${baseUrl}/widget.js" async defer></script>`
      );
    }
  }, [brand]);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  if (!brand) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-[#FF5C3A]/30 border-t-[#FF5C3A] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">

      {/* Hero — misma estructura que el header de la página */}
      <SectionCard>
        <SectionHeader title="Código Embed" subtitle="Integra el probador en tu sitio" />
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-5">
          En menos de 5 minutos tus clientes podrán probarse ropa virtualmente desde tu página.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5C3A] hover:bg-[#e04e30] rounded-2xl text-sm font-semibold transition-colors duration-200 text-white cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Ver mi probador
          </a>
          <button
            onClick={() => setShowPreview(v => !v)}
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border rounded-2xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--bg-hover)] cursor-pointer"
          >
            {showPreview
              ? <><EyeOff className="w-4 h-4" /> Ocultar vista previa</>
              : <><Eye className="w-4 h-4" /> Ver vista previa</>
            }
          </button>
        </div>
      </SectionCard>

      {/* Vista previa inline */}
      {showPreview && embedUrl && (
        <div
          style={{ borderColor: 'var(--border-color)' }}
          className="rounded-[2.5rem] overflow-hidden border shadow-lg"
        >
          <div
            style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
            className="px-5 py-3 flex items-center gap-2 border-b"
          >
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/70" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/70" />
            </div>
            <span style={{ color: 'var(--text-muted)' }} className="text-xs font-mono truncate ml-1">{embedUrl}</span>
          </div>
          <iframe src={embedUrl} width="100%" height="700" style={{ border: 'none', display: 'block' }} title="Vista previa del probador" />
        </div>
      )}

      {/* Paso 1 + 2: Grid de plataformas + pasos expandibles */}
      <SectionCard>
        <SectionHeader step={1} title="Tu plataforma" subtitle="Selecciona para ver instrucciones exactas" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PLATFORMS.map(p => {
            const active = expandedPlatform === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setPlatform(p.id);
                  setExpandedPlatform(active ? null : p.id);
                }}
                style={{
                  borderColor: active ? '#FF5C3A' : 'var(--border-color)',
                  background: active ? 'rgba(255,92,58,0.08)' : 'var(--bg-hover)',
                }}
                className="rounded-2xl border-2 p-4 text-left transition-all duration-200 cursor-pointer hover:opacity-90"
              >
                <div className="mb-2.5">{p.icon}</div>
                <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{p.name}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5 leading-tight">{p.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Pasos — aparecen debajo del grid al seleccionar */}
        {expandedPlatform && (
          <div className="mt-4 space-y-2">
            <p style={{ color: 'var(--text-muted)' }} className="text-[10px] uppercase font-semibold tracking-widest mb-3">
              Pasos para {PLATFORMS.find(p => p.id === expandedPlatform)?.name}
            </p>
            {PLATFORM_STEPS[expandedPlatform].map((s, i) => (
              <div
                key={i}
                style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }}
                className="flex gap-3 p-4 rounded-2xl border"
              >
                <div className="w-6 h-6 rounded-xl bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{s.title}</p>
                  <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5 leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Paso 2: Código */}
      <SectionCard>
        <SectionHeader step={2} title="Copia el código" subtitle="Pégalo en el lugar elegido de tu sitio" />

        {/* Sistema de pestañas */}
        <div className="flex bg-[var(--bg-base)] p-1 rounded-2xl mb-6 border border-[var(--border-color)]">
          <button
            onClick={() => setActiveTab('widget')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'widget'
                ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Widget Inteligente
            <span className="hidden sm:inline-block ml-1 opacity-60 text-[8px] border border-white/30 px-1 rounded">REC</span>
          </button>
          <button
            onClick={() => setActiveTab('iframe')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'iframe'
                ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            iFrame Clásico
          </button>
        </div>

        {/* Bloque de código */}
        <div style={{ borderColor: 'var(--border-color)' }} className="rounded-2xl border overflow-hidden mb-4 shadow-sm bg-[var(--bg-base)]">
          {/* Barra superior del bloque de código */}
          <div
            style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
            className="flex items-center justify-between px-4 py-3 border-b"
          >
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
              </div>
              <span style={{ color: 'var(--text-muted)' }} className="text-xs font-mono ml-1">
                {activeTab === 'widget' ? 'lookitry-widget.html' : 'index.html'}
              </span>
            </div>
            <button
              onClick={() => copy(activeTab === 'widget' ? widgetCode : iframeCode, activeTab)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                copiedKey === activeTab
                  ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/20 hover:bg-[#FF5C3A]/20'
              }`}
            >
              {copiedKey === activeTab
                ? <><Check className="w-3.5 h-3.5" /> Copiado</>
                : <><Copy className="w-3.5 h-3.5" /> Copiar código</>
              }
            </button>
          </div>

          {/* Contenido del código */}
          <div className="px-5 py-6 overflow-x-auto min-h-[120px] flex items-center">
            <pre className="text-xs text-[var(--text-primary)] whitespace-pre-wrap break-all font-mono leading-relaxed w-full">
              {activeTab === 'widget' ? widgetCode : iframeCode}
            </pre>
          </div>

          {/* Nota descriptiva según el tab */}
          <div className="px-5 py-3 bg-[var(--bg-sidebar)] border-t border-[var(--border-color)]">
             <p className="text-[10px] text-[var(--text-muted)] font-medium italic">
                {activeTab === 'widget' 
                  ? '💡 El Widget se adapta automáticamente al botón de "Añadir al carrito" y ofrece una integración más limpia.'
                  : '⚠️ El iFrame usa un contenedor fijo. Recomendado si el widget tiene conflictos con tu plantilla.'
                }
             </p>
          </div>
        </div>

        {/* URL sola para Wix o configuraciones manuales */}
        {(platform === 'wix' || activeTab === 'iframe') && (
          <div style={{ borderColor: 'var(--border-color)' }} className="rounded-2xl border overflow-hidden mt-6 bg-[var(--bg-base)] shadow-sm">
            <div
              style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }}
              className="flex items-center justify-between px-4 py-3 border-b"
            >
              <span style={{ color: 'var(--text-muted)' }} className="text-[10px] font-black uppercase tracking-widest">URL del probador</span>
              <button
                onClick={() => copy(embedUrl, 'url')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-200 cursor-pointer ${
                  copiedKey === 'url'
                    ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                    : 'bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/20 hover:bg-[#FF5C3A]/20'
                }`}
              >
                {copiedKey === 'url'
                  ? <><Check className="w-3.5 h-3.5" /> Copiada</>
                  : <><Copy className="w-3.5 h-3.5" /> Copiar URL</>
                }
              </button>
            </div>
            <div className="px-5 py-4">
              <code className="text-xs text-[var(--text-primary)] font-mono break-all">{embedUrl}</code>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Ayuda */}
      <SectionCard>
        <SectionHeader title="¿Necesitas ayuda?" subtitle="Te ayudamos sin costo adicional" />
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-5">
          Si tienes algún problema para instalar el probador en tu sitio, contáctanos y te ayudamos.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/573105436281"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5C3A]/10 rounded-2xl border text-sm font-semibold hover:bg-[#FF5C3A]/20 transition-colors duration-200 cursor-pointer"
            style={{ borderColor: 'rgba(255,92,58,0.2)', color: 'var(--text-primary)' } as React.CSSProperties}
          >
            <MessageCircle className="w-4 h-4 text-[#FF5C3A]" />
            WhatsApp +57 310 543 6281
          </a>
          <a
            href="mailto:info@lookitry.com"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FF5C3A]/10 rounded-2xl border text-sm font-semibold hover:bg-[#FF5C3A]/20 transition-colors duration-200 cursor-pointer"
            style={{ borderColor: 'rgba(255,92,58,0.2)', color: 'var(--text-primary)' } as React.CSSProperties}
          >
            <Mail className="w-4 h-4 text-[#FF5C3A]" />
            info@lookitry.com
          </a>
        </div>
      </SectionCard>

    </div>
  );
}
