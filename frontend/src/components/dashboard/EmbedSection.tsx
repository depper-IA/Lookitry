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

type Platform = 'wordpress' | 'wix' | 'shopify' | 'other';

const PLATFORMS: Array<{ id: Platform; name: string; icon: React.ReactNode; desc: string }> = [
  {
    id: 'wordpress',
    name: 'WordPress',
    icon: <Globe className="w-6 h-6 text-blue-400" />,
    desc: 'Elementor, Divi o Gutenberg',
  },
  {
    id: 'wix',
    name: 'Wix',
    icon: <LayoutGrid className="w-6 h-6 text-violet-400" />,
    desc: 'Editor Clásico o Studio',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    icon: <ShoppingBag className="w-6 h-6 text-emerald-400" />,
    desc: 'Themes 2.0 y secciones',
  },
  {
    id: 'other',
    name: 'HTML Custom',
    icon: <Code2 className="w-6 h-6 text-[#FF5C3A]" />,
    desc: 'Webflow, Square o React',
  },
];

const PLATFORM_STEPS: Record<Platform, Array<{ title: string; detail: string }>> = {
  wordpress: [
    { title: 'Localiza tu sección ideal', detail: 'Abre el editor de tu página (Elementor, Divi o Gutenberg).' },
    { title: 'Inserta un bloque HTML', detail: 'Agrega un widget de "Código HTML" o "Custom HTML" donde desees el botón.' },
    { title: 'Inyecta el genoma', detail: 'Pega el código que generamos abajo dentro del bloque.' },
    { title: 'Publica el cambio', detail: 'Actualiza y verifica el impacto visual en tu sitio.' },
  ],
  wix: [
    { title: 'Abre Wix Studio/Editor', detail: 'Entra al editor de tu sitio y selecciona la sección deseada.' },
    { title: 'Añadir Embebido', detail: 'Haz clic en el panel "+" → Embeber → Widget HTML.' },
    { title: 'Configura la URL', detail: 'Selecciona "Dirección Web" y pega el link de tu probador.' },
    { title: 'Ajuste de Dimensiones', detail: 'Expande el contenedor para que el probador respire.' },
  ],
  shopify: [
    { title: 'Personaliza tu Tema', detail: 'Shopify Admin → Tienda en línea → Temas → Personalizar.' },
    { title: 'Agregar Sección Liquid/HTML', detail: 'Clic en "Agregar sección" → "Custom Liquid" o "HTML".' },
    { title: 'Código de Integración', detail: 'Pega el snippet de Lookitry en el campo de texto.' },
    { title: 'Guardar Configuración', detail: 'Guarda los cambios y monitoriza la conversión.' },
  ],
  other: [
    { title: 'Accede al Código Fuente', detail: 'Localiza el archivo .html o el editor de componentes de tu plataforma.' },
    { title: 'Posicionamiento Estratégico', detail: 'Pega el código cerca del botón "Añadir al carrito" o en un banner.' },
    { title: 'Sincronización', detail: 'Guarda y despliega los cambios en tu servidor.' },
    { title: 'Validación', detail: 'Abre tu sitio y realiza la primera prueba virtual.' },
  ],
};

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-1.5">
    <div className="w-4 h-4 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[var(--text-muted)] hover:text-[#FF5C3A] cursor-help transition-all shadow-sm">
      <Info className="w-2.5 h-2.5" />
    </div>
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 shadow-2xl z-50 pointer-events-none border-b-4 border-b-[#FF5C3A]">
      <p className="text-[10px] leading-relaxed text-[var(--text-primary)] font-black uppercase tracking-wider italic">{text}</p>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#FF5C3A]"></div>
    </div>
  </div>
);

export function EmbedSection() {
  const { brand } = useAuth();
  const [platform, setPlatform] = useState<Platform | null>('wordpress');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeTab, setActiveTab] = useState<'widget' | 'iframe'>('widget');

  const baseUrl = 'https://lookitry.com';
  const embedUrl = brand ? `${baseUrl}/marca/${brand.slug}` : '';
  
  const iframeCode = `<iframe src="${baseUrl}/embed/${brand?.slug}" width="100%" height="750" frameborder="0" style="border-radius:2rem; box-shadow:0 10px 50px rgba(0,0,0,0.10); overflow: hidden;"></iframe>`;
  
  const widgetCode = `<div id="lookitry-tester-container" data-slug="${brand?.slug}"></div>\n<script src="${baseUrl}/widget.js" async defer></script>`;

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  const sectionStyle = "bg-[var(--bg-card)] rounded-[3rem] border border-[var(--border-color)] p-10 space-y-8 shadow-xl shadow-black/5 relative overflow-hidden group";
  const labelStyle = "text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-secondary)] mb-6 block italic opacity-70";

  return (
    <div className="space-y-10 pb-12">

      {/* ── HEADER ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={sectionStyle}>
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Code2 size={120} />
        </div>
        <div className="flex items-center gap-4 relative z-10 border-b border-[var(--border-color)] pb-6">
           <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-[#FF5C3A]" />
           </div>
           <div>
              <h3 className="text-xl font-black italic uppercase text-[var(--text-primary)] tracking-tighter">Inyección de Código</h3>
              <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-[0.2em] opacity-60">Sincronización con tu tienda</p>
           </div>
        </div>
        
        <p className="text-sm font-bold text-[var(--text-secondary)] leading-relaxed relative z-10 max-w-2xl uppercase tracking-tighter opacity-80 italic">
          El motor de Lookitry se integra sin fricción en cualquier plataforma. Selecciona tu ecosistema y despliega la experiencia premium en menos de 180 segundos.
        </p>

        <div className="flex flex-wrap gap-4 relative z-10">
           <a href={embedUrl} target="_blank" className="px-8 py-4 bg-[#FF5C3A] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-[#FF5C3A]/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
             <ExternalLink size={14} /> Ver Probador Público
           </a>
           <button onClick={() => setShowPreview(!showPreview)} className="px-8 py-4 bg-[var(--bg-input)] text-[var(--text-primary)] border border-[var(--border-color)] rounded-2xl font-black uppercase tracking-widest text-[11px] hover:border-[#FF5C3A]/40 transition-all flex items-center gap-2">
             {showPreview ? <><EyeOff size={14} /> Ocultar Preview</> : <><Eye size={14} /> Vista Previa</>}
           </button>
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
               <div className="rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-2xl mt-8">
                  <div className="h-10 bg-[var(--bg-input)] flex items-center px-6 gap-2 border-b border-[var(--border-color)]">
                     <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" /></div>
                     <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">{embedUrl}</span>
                  </div>
                  <iframe src={embedUrl} className="w-full h-[600px] bg-white" title="Preview" />
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── PLATFORM SELECTOR ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={sectionStyle}>
        <label className={labelStyle}>Ecosistema de Destino (Plataforma)</label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10">
           {PLATFORMS.map((p) => {
             const active = platform === p.id;
             return (
               <button 
                 key={p.id}
                 onClick={() => setPlatform(p.id)}
                 className={`p-6 rounded-[2.5rem] border text-left transition-all relative overflow-hidden group/plat ${active ? 'border-[#FF5C3A] bg-[#FF5C3A]/5 shadow-2xl' : 'border-[var(--border-color)] bg-[var(--bg-input)] hover:border-[#FF5C3A]/30'}`}
               >
                 <div className={`mb-4 transition-transform duration-500 ${active ? 'scale-110' : 'opacity-40 group-hover/plat:opacity-100'}`}>
                    {p.icon}
                 </div>
                 <h4 className={`text-xs font-black uppercase tracking-widest ${active ? 'text-[#FF5C3A]' : 'text-[var(--text-primary)]'}`}>{p.name}</h4>
                 <p className="text-[8px] font-bold uppercase text-[var(--text-muted)] mt-1 opacity-50">{p.desc}</p>
                 {active && <div className="absolute top-4 right-4 text-[#FF5C3A]"><CheckCircle2 size={16} strokeWidth={3} /></div>}
               </button>
             );
           })}
        </div>

        <AnimatePresence mode="wait">
          {platform && (
            <motion.div 
               key={platform}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: 20 }}
               className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-10 border-t border-[var(--border-color)]"
            >
               {PLATFORM_STEPS[platform].map((step, idx) => (
                 <div key={idx} className="relative space-y-3 group/step">
                    <div className="flex items-center gap-3">
                       <span className="w-8 h-8 rounded-xl bg-[var(--text-primary)] text-[var(--bg-card)] flex items-center justify-center font-black text-[10px] group-hover/step:bg-[#FF5C3A] transition-colors">{idx + 1}</span>
                       <h5 className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{step.title}</h5>
                    </div>
                    <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-tighter leading-relaxed line-clamp-3 italic">{step.detail}</p>
                 </div>
               ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* ── CODE SNIPPETS ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={sectionStyle}>
         <label className={labelStyle}>Bloque de Inyección de Interfaz</label>
         
         <div className="flex bg-[var(--bg-input)] p-2 rounded-[2rem] border border-[var(--border-color)] mb-8 shadow-inner relative z-10">
            {[
              { id: 'widget', label: 'Widget Inteligente', icon: <Zap size={14} />, tip: 'Se adapta al botón de compra original.' },
              { id: 'iframe', label: 'iFrame Clásico', icon: <LayoutGrid size={14} />, tip: 'Contenedor fijo independiente.' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#FF5C3A] text-white shadow-xl shadow-[#FF5C3A]/20' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
         </div>

         <div className="relative z-10 group/code">
            <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover/code:opacity-100 transition-opacity">
               <button 
                 onClick={() => copy(activeTab === 'widget' ? widgetCode : iframeCode, activeTab)}
                 className="px-6 py-2.5 bg-black text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
               >
                 {copiedKey === activeTab ? <><Check size={12} strokeWidth={4} className="text-emerald-400" /> Copiado</> : <><Copy size={12} /> Copiar Bloque</>}
               </button>
            </div>
            
            <div className="bg-[#111] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl overflow-hidden min-h-[180px] flex items-center">
               <pre className="text-[11px] font-mono text-emerald-400/80 leading-relaxed font-bold whitespace-pre-wrap break-all w-full">
                  {activeTab === 'widget' ? widgetCode : iframeCode}
               </pre>
            </div>
            
            <div className="mt-6 flex items-start gap-4 p-6 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)] border-dashed">
               <AlertCircle className="w-5 h-5 text-[#FF5C3A] shrink-0" />
               <p className="text-[9px] font-black uppercase text-[var(--text-muted)] leading-relaxed italic">
                 {activeTab === 'widget' 
                   ? 'Nota: El widget inteligente requiere que el contenedor tenga el ID descriptivo. Se ajustará automáticamente al diseño de tu tienda.' 
                   : 'Nota: El iFrame es una ventana aislada. Ideal si usas Elementor o Divi sin acceso a la lógica del carrito de compras.'}
               </p>
            </div>
         </div>
      </motion.section>

      {/* ── SUPPORT ── */}
      <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className={`${sectionStyle} bg-gradient-to-br from-[#FF5C3A]/5 to-indigo-500/5`}>
         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-4 text-center md:text-left">
               <h3 className="text-3xl font-[900] italic uppercase tracking-tighter text-[var(--text-primary)] leading-none">¿Bloqueo en el <br /><span className="text-[#FF5C3A]">Despliegue?</span></h3>
               <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest max-w-sm opacity-60">Nuestro equipo de arquitectura está listo para ayudarte con la integración directa sin costo adicional.</p>
            </div>
            <div className="flex gap-4">
               <a href="https://wa.me/573105436281" className="p-5 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-xl shadow-emerald-500/5 group/wa">
                  <MessageCircle className="w-6 h-6 group-hover/wa:scale-110 transition-transform" />
               </a>
               <a href="mailto:info@lookitry.com" className="p-5 bg-[#FF5C3A]/10 text-[#FF5C3A] rounded-2xl border border-[#FF5C3A]/20 hover:bg-[#FF5C3A] hover:text-white transition-all shadow-xl shadow-[#FF5C3A]/5 group/mail">
                  <Mail className="w-6 h-6 group-hover/mail:scale-110 transition-transform" />
               </a>
            </div>
         </div>
      </motion.section>

    </div>
  );
}
