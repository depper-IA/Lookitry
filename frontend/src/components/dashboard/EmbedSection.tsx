'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, Eye, EyeOff, Copy, Check, MessageCircle, Mail, Globe, ShoppingBag, Code2, LayoutGrid } from 'lucide-react';

type Platform = 'wordpress' | 'wix' | 'shopify' | 'other';

const PLATFORMS: Array<{ id: Platform; name: string; icon: React.ReactNode; desc: string }> = [
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: <Globe className="w-5 h-5 text-blue-500" />,
    desc: 'Elementor, Divi, bloques clásicos',
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: <LayoutGrid className="w-5 h-5 text-purple-500" />,
    desc: 'Editor de Wix',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: <ShoppingBag className="w-5 h-5 text-emerald-500" />,
    desc: 'Tienda en Shopify',
  },
  {
    id: 'other',
    name: 'Otro',
    icon: <Code2 className="w-5 h-5 text-gray-500" />,
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

export function EmbedSection() {
  const { brand } = useAuth();
  const [platform, setPlatform] = useState<Platform>('wordpress');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [iframeCode, setIframeCode] = useState('');

  useEffect(() => {
    if (brand?.slug) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const url = `${baseUrl}/marca/${brand.slug}`;
      setEmbedUrl(url);
      setIframeCode(`<iframe src="${url}" width="100%" height="750" frameborder="0" style="border-radius:12px; box-shadow:0 4px 24px rgba(0,0,0,0.10);"></iframe>`);
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

  const steps = PLATFORM_STEPS[platform];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">

      {/* Hero */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-syne font-bold">Agrega el probador a tu sitio web</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="mt-1 text-sm">
          En menos de 5 minutos tus clientes podrán probarse ropa virtualmente desde tu página.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={embedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF5C3A] hover:bg-[#e04e30] rounded-xl text-sm font-medium transition-colors text-white"
          >
            <ExternalLink className="w-4 h-4" />
            Ver mi probador
          </a>
          <button
            onClick={() => setShowPreview(v => !v)}
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] border rounded-xl text-sm font-medium transition-colors hover:opacity-80"
          >
            {showPreview
              ? <><EyeOff className="w-4 h-4" /> Ocultar vista previa</>
              : <><Eye className="w-4 h-4" /> Ver vista previa</>
            }
          </button>
        </div>
      </div>

      {/* Vista previa inline */}
      {showPreview && embedUrl && (
        <div style={{ borderColor: 'var(--border-color)' }} className="rounded-2xl overflow-hidden border-2 shadow-lg">
          <div style={{ background: 'var(--bg-sidebar)', borderColor: 'var(--border-color)' }} className="px-4 py-2 flex items-center gap-2 border-b">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <span style={{ color: 'var(--text-muted)' }} className="text-xs font-mono truncate">{embedUrl}</span>
          </div>
          <iframe src={embedUrl} width="100%" height="700" style={{ border: 'none', display: 'block' }} title="Vista previa del probador" />
        </div>
      )}

      {/* Paso 1: Elige tu plataforma */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center font-bold text-sm">1</div>
          <div>
            <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold">¿Qué plataforma usa tu sitio web?</h2>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs">Selecciona para ver las instrucciones exactas</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PLATFORMS.map(p => (
            <button
              key={p.id}
              onClick={() => setPlatform(p.id)}
              style={{
                borderColor: platform === p.id ? '#FF5C3A' : 'var(--border-color)',
                background: platform === p.id ? 'rgba(255,92,58,0.08)' : 'var(--bg-hover)',
              }}
              className="rounded-xl border-2 p-3 text-left transition-all min-h-[44px]"
            >
              <div className="mb-2">{p.icon}</div>
              <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{p.name}</p>
              <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5 leading-tight">{p.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2: Instrucciones */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center font-bold text-sm">2</div>
          <div>
            <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold">Sigue estos pasos en {PLATFORMS.find(p => p.id === platform)?.name}</h2>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs">Muy fácil, no necesitas saber programar</p>
          </div>
        </div>
        <div className="space-y-3">
          {steps.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-hover)', borderColor: 'var(--border-color)' }} className="flex gap-4 p-4 rounded-xl border">
              <div className="w-6 h-6 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p style={{ color: 'var(--text-primary)' }} className="font-semibold text-sm">{s.title}</p>
                <p style={{ color: 'var(--text-muted)' }} className="text-xs mt-0.5">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paso 3: El código */}
      <div style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }} className="rounded-2xl border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A] flex items-center justify-center font-bold text-sm">3</div>
          <div>
            <h2 style={{ color: 'var(--text-primary)' }} className="font-semibold">Copia este código</h2>
            <p style={{ color: 'var(--text-muted)' }} className="text-xs">Pégalo en el lugar que elegiste en tu sitio</p>
          </div>
        </div>

        {/* Código iframe */}
        <div style={{ borderColor: 'var(--border-color)' }} className="rounded-xl border overflow-hidden mb-4">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
            <span className="text-xs text-gray-400 font-mono">código HTML</span>
            <button
              onClick={() => copy(iframeCode, 'iframe')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                copiedKey === 'iframe'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#FF5C3A] hover:bg-[#e04e30] text-white'
              }`}
            >
              {copiedKey === 'iframe'
                ? <><Check className="w-3.5 h-3.5" /> Copiado</>
                : <><Copy className="w-3.5 h-3.5" /> Copiar código</>
              }
            </button>
          </div>
          <div className="bg-gray-900 px-4 py-4 overflow-x-auto">
            <pre className="text-xs text-green-300 whitespace-pre-wrap break-all font-mono leading-relaxed">
              {iframeCode}
            </pre>
          </div>
        </div>

        {/* URL sola para Wix */}
        {platform === 'wix' && (
          <div style={{ borderColor: 'var(--border-color)' }} className="rounded-xl border overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800">
              <span className="text-xs text-gray-400 font-mono">URL del probador (para Wix iFrame)</span>
              <button
                onClick={() => copy(embedUrl, 'url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  copiedKey === 'url'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#FF5C3A] hover:bg-[#e04e30] text-white'
                }`}
              >
                {copiedKey === 'url'
                  ? <><Check className="w-3.5 h-3.5" /> Copiada</>
                  : <><Copy className="w-3.5 h-3.5" /> Copiar URL</>
                }
              </button>
            </div>
            <div className="bg-gray-900 px-4 py-4">
              <code className="text-xs text-blue-300 font-mono break-all">{embedUrl}</code>
            </div>
          </div>
        )}
      </div>

      {/* Ayuda */}
      <div style={{ borderColor: 'var(--border-color)', background: 'var(--bg-hover)' }} className="rounded-2xl border p-5">
        <p style={{ color: 'var(--text-primary)' }} className="font-semibold mb-1">¿Necesitas ayuda?</p>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-3">
          Si tienes algún problema para instalar el probador en tu sitio, contáctanos y te ayudamos sin costo adicional.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://wa.me/573105436281"
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF5C3A]/10 rounded-xl border text-sm font-medium hover:bg-[#FF5C3A]/20 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-[#FF5C3A]" />
            WhatsApp +57 310 543 6281
          </a>
          <a
            href="mailto:info@lookitry.com"
            style={{ borderColor: 'var(--border-color)', color: 'var(--text-primary)' }}
            className="flex items-center gap-2 px-4 py-2 min-h-[44px] bg-[#FF5C3A]/10 rounded-xl border text-sm font-medium hover:bg-[#FF5C3A]/20 transition-colors"
          >
            <Mail className="w-4 h-4 text-[#FF5C3A]" />
            info@lookitry.com
          </a>
        </div>
      </div>

    </div>
  );
}
