'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { 
  ExternalLink, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  MessageCircle, 
  Mail, 
  Globe, 
  ShoppingBag, 
  Code2, 
  LayoutGrid,
  Zap,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Info
} from 'lucide-react';
import { fetchPublicPaymentSettings, toWhatsAppUrl } from '@/services/public-config.service';

type Platform = 'wordpress' | 'wix' | 'shopify' | 'other';

const PLATFORMS: Array<{ id: Platform; name: string; icon: React.ReactNode; desc: string }> = [
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: <img src="/integrations/Woo_logo_color.svg" className="h-5 md:h-6 w-auto object-contain" alt="WordPress" />,
    desc: 'Elementor, Divi o Gutenberg',
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: <img src="/integrations/Wix.svg" className="h-4 md:h-5 w-auto object-contain" alt="Wix" />,
    desc: 'Editor clásico o Studio',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: <img src="/integrations/shopify.svg" className="h-5 md:h-6 w-auto object-contain" alt="Shopify" />,
    desc: 'Themes 2.0 y secciones',
  },
  {
    id: 'other',
    name: 'HTML custom',
    icon: <Code2 className="w-5 h-5 md:w-6 md:h-6 text-[#FF5C3A]" />,
    desc: 'Webflow, Square o React',
  },
];

const PLATFORM_STEPS: Record<Platform, Array<{ title: string; detail: string }>> = {
  wordpress: [
    { title: 'Plugin Lookitry (ZIP)', detail: 'Descarga nuestro plugin. En WordPress ve a Plugins → Añadir nuevo → Subir plugin y selecciona el archivo .zip.' },
    { title: 'Localiza tu sección', detail: 'Abre el editor de tu página (Elementor, Divi o Gutenberg) en el producto deseado.' },
    { title: 'Inserta bloque HTML', detail: 'Agrega un widget de "Código HTML" o "Custom HTML" cerca del botón de compra.' },
    { title: 'Inyecta el código', detail: 'Pega el fragmento de código que generamos abajo dentro del bloque HTML.' },
    { title: 'Publica y verifica', detail: 'Actualiza tu sitio y verifica que el probador aparezca correctamente en la tienda.' },
  ],
  wix: [
    { title: 'Abre Wix Studio/Editor', detail: 'Entra al editor de tu sitio y selecciona la sección donde irá el probador.' },
    { title: 'Añadir integrado', detail: 'Haz clic en el panel "+" → Integrar → Widget HTML.' },
    { title: 'Configura la URL', detail: 'Selecciona "Dirección Web" y pega el link directo de tu probador.' },
    { title: 'Ajuste de dimensiones', detail: 'Expande el contenedor para que el probador tenga suficiente espacio visual.' },
  ],
  shopify: [
    { title: 'Personaliza tu tema', detail: 'Shopify Admin → Tienda en línea → Temas → Personalizar.' },
    { title: 'Agregar sección Liquid', detail: 'Clic en "Agregar sección" → "Custom Liquid" o "HTML".' },
    { title: 'Código de integración', detail: 'Pega el snippet de Lookitry en el campo de texto de la sección.' },
    { title: 'Guardar y monitorear', detail: 'Guarda los cambios y verifica la aparición del botón en tu página de producto.' },
  ],
  other: [
    { title: 'Accede al código fuente', detail: 'Localiza el archivo .html o el editor de componentes de tu plataforma.' },
    { title: 'Posicionamiento', detail: 'Pega el código cerca del botón "Añadir al carrito" o en un banner destacado.' },
    { title: 'Sincronización', detail: 'Guarda y despliega los cambios en tu servidor para activar la experiencia.' },
    { title: 'Validación final', detail: 'Abre tu sitio en vivo y realiza la primera prueba virtual con un producto.' },
  ],
};

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5">
    <div className="w-4 h-4 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#FF5C3A] cursor-help transition-all shadow-sm">
      <Info className="w-2.5 h-2.5" />
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 shadow-2xl z-50 pointer-events-none border-b-4 border-b-[#FF5C3A]">
      <p className="text-[10px] leading-relaxed text-[var(--text-primary)] font-bold uppercase tracking-wider">{text}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#FF5C3A]"></div>
    </div>
  </div>
);

export function EmbedSection() {
  const { brand } = useAuth();
  const [support, setSupport] = useState({ whatsapp: 'https://wa.me/573105436281', email: 'info@lookitry.com' });

  useEffect(() => {
    fetchPublicPaymentSettings()
      .then(data => {
        if (!data) return;
        setSupport({
          whatsapp: toWhatsAppUrl(data.manualWhatsapp) || 'https://wa.me/573105436281',
          email: data.manualEmail || 'info@lookitry.com',
        });
      })
      .catch(() => {});
  }, []);
  const [platform, setPlatform] = useState<Platform | null>('wordpress');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'widget' | 'iframe'>('widget');

  const baseUrl = 'https://lookitry.com';
  const embedUrl = brand ? `${baseUrl}/marca/${brand.slug}` : '';
  
  const iframeCode = `<iframe src="${baseUrl}/embed/${brand?.slug}" width="100%" height="750" frameborder="0" scrolling="no" allow="camera; clipboard-write" style="border-radius:2rem; box-shadow:0 10px 50px rgba(0,0,0,0.10); overflow: hidden;"></iframe>`;
  
  const widgetCode = `<div id="lookitry-tester-container" data-slug="${brand?.slug}"></div>\n<script src="${baseUrl}/widget.js" async defer></script>`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const sectionStyle = "bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-5 md:p-8 space-y-6 md:space-y-8 shadow-xl shadow-black/5 relative overflow-hidden group";
  const labelStyle = "text-xs font-bold tracking-tight text-[var(--text-secondary)] mb-4 block opacity-80";

  return (
    <div className="space-y-6 md:space-y-8 pb-12">

      {/* ── HEADER ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={sectionStyle}>
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
           <Code2 size={180} />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
           <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
              <Code2 className="w-5 h-5 md:w-6 md:h-6 text-[#FF5C3A]" />
           </div>
           <div>
              <h3 className="text-lg md:text-xl font-bold text-[var(--text-primary)] tracking-tight">Inyección de código</h3>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold tracking-[0.1em] opacity-60">Sincronización con tu tienda</p>
           </div>
        </div>
        
        <p className="text-sm font-semibold text-[var(--text-secondary)] leading-relaxed relative z-10 max-w-2xl tracking-tight opacity-70">
          El motor de Lookitry se integra sin fricción en cualquier plataforma. Selecciona tu ecosistema y despliega la experiencia premium en menos de 180 segundos.
        </p>

        <div className="flex flex-wrap gap-3 md:gap-4 relative z-10">
           <a href={embedUrl} target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-6 py-3 bg-[#FF5C3A] text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-[#FF5C3A]/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2">
             <ExternalLink size={14} /> Ver probador público
           </a>
           <button onClick={() => setShowPreview(!showPreview)} className="px-6 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-xl font-bold uppercase tracking-widest text-[10px] hover:border-[#FF5C3A]/40 transition-all flex items-center justify-center gap-2">
             {showPreview ? <><EyeOff size={14} /> Ocultar preview</> : <><Eye size={14} /> Vista previa</>}
           </button>
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
               <div className="rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-2xl mt-6 bg-white">
                  <div className="h-10 bg-zinc-900 flex items-center px-6 gap-2 border-b border-white/5">
                     <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><div className="w-2 h-2 rounded-full bg-amber-500" /><div className="w-2 h-2 rounded-full bg-emerald-500" /></div>
                     <span className="text-[9px] font-mono text-zinc-500 truncate ml-4">{embedUrl}</span>
                  </div>
                  <div className="overflow-auto">
                    <iframe src={embedUrl} className="w-full min-w-[320px] h-[600px] bg-white" title="Preview" />
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── PLATFORM SELECTOR ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={sectionStyle}>
        <label className={labelStyle}>Ecosistema de destino (plataforma)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5 relative z-10">
           {PLATFORMS.map((p) => {
             const active = platform === p.id;
             return (
               <button 
                 key={p.id}
                 onClick={() => setPlatform(p.id)}
                 className={`p-4 md:p-5 rounded-2xl border text-left transition-all relative overflow-hidden group/plat ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-lg' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30'}`}
               >
                 <div className={`mb-3 h-8 flex items-center justify-start transition-transform duration-500 ${active ? 'scale-110' : 'opacity-40 group-hover/plat:opacity-100'}`}>
                    {p.icon}
                 </div>
                 <h4 className={`text-[11px] font-bold tracking-tight ${active ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{p.name}</h4>
                 <p className="text-[9px] font-semibold text-[var(--text-muted)] mt-1 opacity-50 uppercase tracking-tighter">{p.desc}</p>
                 {active && <div className="absolute top-3 right-3 text-[#FF5C3A]"><CheckCircle2 size={16} strokeWidth={3} /></div>}
               </button>
             );
           })}
        </div>

        <AnimatePresence mode="wait">
          {platform && (
            <motion.div 
               key={platform}
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 10 }}
               className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-[var(--border-color)]"
            >
               {PLATFORM_STEPS[platform].map((step, idx) => (
                 <div key={idx} className="relative space-y-2 group/step">
                    <div className="flex items-center gap-3">
                       <span className="w-7 h-7 rounded-lg bg-[var(--text-primary)] text-[var(--bg-card)] flex items-center justify-center font-bold text-[10px] group-hover/step:bg-[#FF5C3A] transition-colors shrink-0">{idx + 1}</span>
                       <h5 className="text-[10px] font-bold tracking-tight text-[var(--text-primary)]">{step.title}</h5>
                    </div>
                    <p className="text-[10px] font-medium text-[var(--text-muted)] tracking-tight leading-relaxed opacity-70">{step.detail}</p>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── CODE SNIPPETS ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={sectionStyle}>
         <label className={labelStyle}>Bloque de inyección de interfaz</label>
         
         <div className="flex flex-col sm:flex-row bg-[var(--bg-input)] p-1.5 rounded-2xl border border-[var(--border-color)] mb-6 md:mb-8 shadow-inner relative z-10 gap-1.5 sm:gap-0">
            {[
              { id: 'widget', label: 'Widget inteligente', icon: <Zap size={14} />, tip: 'Se adapta al botón de compra original.' },
              { id: 'iframe', label: 'iFrame clásico', icon: <LayoutGrid size={14} />, tip: 'Contenedor fijo independiente.' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#FF5C3A] text-white shadow-lg shadow-[#FF5C3A]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
         </div>

         <div className="relative z-10 group/code">
            <div className="absolute top-4 right-4 flex gap-2 opacity-100 md:opacity-0 group-hover/code:opacity-100 transition-opacity z-20">
               <button 
                 onClick={() => copy(activeTab === 'widget' ? widgetCode : iframeCode, activeTab)}
                 className="px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-lg text-[9px] font-bold uppercase tracking-widest border border-white/10 hover:bg-[#FF5C3A] transition-all"
               >
                 {copiedKey === activeTab ? <><Check size={12} strokeWidth={4} className="text-emerald-400" /> Copiado</> : <><Copy size={12} /> Copiar código</>}
               </button>
            </div>
            
            <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl overflow-hidden min-h-[160px] flex items-center relative">
               <div className="absolute top-0 left-0 w-1 h-full bg-[#FF5C3A]/40" />
               <pre className="text-[10px] md:text-[11px] font-mono text-indigo-300/90 leading-relaxed font-semibold whitespace-pre-wrap break-all w-full pl-4 overflow-x-auto">
                  {activeTab === 'widget' ? widgetCode : iframeCode}
               </pre>
            </div>
            
            <div className="mt-6 flex items-start gap-4 p-4 md:p-5 bg-[var(--bg-input)] rounded-xl border border-[var(--border-color)] border-dashed">
               <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-[#FF5C3A]/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-[#FF5C3A]" />
               </div>
               <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed italic opacity-70">
                 {activeTab === 'widget' 
                   ? 'El widget inteligente requiere que el contenedor tenga el ID descriptivo. Se ajustará automáticamente al diseño de tu tienda.' 
                   : 'El iFrame es una ventana aislada. Ideal si usas Elementor o Divi sin acceso a la lógica del carrito de compras.'}
               </p>
            </div>
         </div>
      </motion.section>

      {/* ── SUPPORT ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${sectionStyle} bg-gradient-to-br from-[#FF5C3A]/5 to-indigo-500/5`}>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-[var(--text-primary)] leading-none">¿Bloqueo en el <br /><span className="text-[#FF5C3A]">despliegue?</span></h3>
               <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-widest max-w-sm opacity-60">Nuestro equipo de arquitectura está listo para ayudarte con la integración directa sin costo adicional.</p>
            </div>
            <div className="flex gap-4">
               <a href={support.whatsapp} target="_blank" rel="noopener noreferrer" className="p-5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-emerald-500/5 group/wa">
                  <MessageCircle className="w-6 h-6 group-hover/wa:scale-110 transition-transform" />
               </a>
               <a href={`mailto:${support.email}`} className="p-5 bg-[#FF5C3A]/10 text-[#FF5C3A] rounded-2xl border border-[#FF5C3A]/20 hover:bg-[#FF5C3A] hover:text-white transition-all shadow-xl shadow-[#FF5C3A]/5 group/mail">
                  <Mail className="w-6 h-6 group-hover/mail:scale-110 transition-transform" />
               </a>
            </div>
         </div>
      </motion.section>

    </div>
  );
}
