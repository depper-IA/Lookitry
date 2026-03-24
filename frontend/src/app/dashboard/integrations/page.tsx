'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { 
  Key, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Zap, 
  Layout, 
  Puzzle, 
  HelpCircle,
  Download,
  Terminal,
  Store,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Command,
  Smartphone,
  Cpu,
  Package,
  Globe
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

// ── Animaciones ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.8,
      staggerChildren: 0.12
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 }
};

export default function IntegrationsPage() {
  const { brand } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const apiKey = (brand as any)?.apiKey || (brand as any)?.api_key || '•••••••••••••••••••••••••••••';

  const copyToClipboard = () => {
    if (apiKey.includes('•')) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      id: '01',
      title: 'Instalar Plugin',
      description: 'Descarga el plugin oficial para WooCommerce e instálalo en tu tienda.',
      icon: <Download className="w-5 h-5 text-indigo-400" />,
      action: 'Descargar Plugin (.zip)'
    },
    {
      id: '02',
      title: 'Configurar Credenciales',
      description: 'Navega a WooCommerce > Ajustes > Lookitry y pega tu Clave de API.',
      icon: <Key className="w-5 h-5 text-amber-400" />,
      action: null
    },
    {
      id: '03',
      title: 'Sincronización Automática',
      description: 'Lookitry detectará tus productos automáticamente mediante el ID de WordPress.',
      icon: <Sparkles className="w-5 h-5 text-emerald-400" />,
      action: null
    }
  ];

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-16 pb-32 px-4 relative"
    >
      {/* Orbes de fondo */}
      <div className="absolute top-0 -left-20 w-80 h-80 bg-[#FF5C3A]/5 blur-[120px] rounded-full -z-10" />
      <div className="absolute bottom-40 -right-20 w-[400px] h-[400px] bg-indigo-500/5 blur-[150px] rounded-full -z-10" />

      {/* ══ HEADER ══ */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-[var(--border-color)] pb-12">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 flex items-center justify-center border border-[#FF5C3A]/10 shadow-inner">
                <Puzzle className="w-6 h-6 text-[#FF5C3A]" />
             </div>
             <h1 className="text-5xl font-[950] tracking-tighter text-[var(--text-primary)] italic uppercase leading-none font-jakarta">Integraciones</h1>
          </div>
          <p className="text-[11px] font-black tracking-[0.3em] text-[var(--text-muted)] uppercase opacity-60 italic">Conecta tu tienda con el probador virtual</p>
        </div>

        <div className="flex flex-wrap gap-4">
           <button className="flex items-center gap-3 px-8 py-4 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-[950] uppercase tracking-widest rounded-2xl hover:bg-white/5 transition-all shadow-xl">
              <HelpCircle className="w-4 h-4 text-[#FF5C3A]" />
              Documentación
           </button>
           <button className="flex items-center gap-3 px-8 py-4 bg-[#FF5C3A] text-white text-[10px] font-[950] uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-[0_20px_40px_rgba(255,92,58,0.3)] transition-all">
              <Zap className="w-4 h-4" />
              Ver Estado
           </button>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* ══ PANEL CENTRAL ══ */}
        <div className="lg:col-span-8 space-y-12">
           
           {/* WOOCOMMERCE CARD */}
           <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-color)] p-12 shadow-4xl space-y-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-12 opacity-5 translate-x-10 translate-y-[-10px] group-hover:scale-110 transition-transform duration-1000">
                 <Store size={200} strokeWidth={1} />
              </div>
              
              <div className="flex items-center gap-8 border-b border-[var(--border-color)] pb-10">
                <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                   <Store className="w-10 h-10 text-indigo-500" />
                </div>
                <div>
                   <h2 className="text-3xl font-[950] text-[var(--text-primary)] uppercase tracking-tighter italic leading-none">WooCommerce</h2>
                   <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] mt-2 opacity-80">Integración Nativa</p>
                </div>
              </div>

              {/* API KEY SECTION */}
              <div className="space-y-8">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] ml-2 italic">Clave de API (API KEY)</label>
                    <div className="relative group/key">
                       <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-4 pr-5 border-r border-[var(--border-color)]/50">
                          <Terminal className="w-4.5 h-4.5 text-[#FF5C3A] group-focus-within/key:animate-pulse" />
                       </div>
                       <input 
                          type={showKey ? 'text' : 'password'}
                          readOnly
                          value={apiKey}
                          className="w-full bg-[var(--bg-base)] border border-[var(--border-color)] rounded-[2.5rem] py-7 pl-24 pr-44 text-sm font-mono font-black text-[var(--text-primary)] outline-none focus:border-[#FF5C3A]/40 transition-all shadow-2xl"
                       />
                       <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-3">
                          <button 
                            onMouseDown={() => setShowKey(true)} onMouseUp={() => setShowKey(false)} onMouseLeave={() => setShowKey(false)}
                            className="p-4 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl text-[var(--text-muted)] hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 transition-all shadow-xl"
                          >
                             {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button 
                             onClick={copyToClipboard}
                             className={`px-8 py-4 ${copied ? 'bg-emerald-500' : 'bg-[#FF5C3A]'} text-white rounded-2xl text-[10px] font-[950] uppercase tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-3`}
                          >
                             {copied ? <Check size={16} /> : <Copy size={16} />}
                             {copied ? 'Copiado' : 'Copiar'}
                          </button>
                       </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                       <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                       <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest opacity-80 italic">No compartas esta clave con nadie. Única e intransferible.</p>
                    </div>
                 </div>
              </div>

              {/* PASOS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-10">
                 {steps.map((step) => (
                    <div key={step.id} className="group/step p-10 rounded-[3rem] bg-[var(--bg-hover)] border border-transparent hover:border-[var(--border-color)] transition-all relative overflow-hidden shadow-sm hover:shadow-2xl">
                       <div className="absolute -top-6 -right-6 text-7xl font-[950] text-[var(--text-primary)] opacity-[0.03] italic group-hover/step:scale-125 transition-transform">
                          {step.id}
                       </div>
                       <div className="w-12 h-12 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mb-8 group-hover/step:scale-110 group-hover/step:shadow-2xl transition-all">
                          {step.icon}
                       </div>
                       <h3 className="text-sm font-[950] text-[var(--text-primary)] uppercase tracking-tight mb-3 italic">
                          {step.title}
                       </h3>
                       <p className="text-[11px] font-bold text-[var(--text-muted)]/60 uppercase leading-relaxed tracking-tight group-hover/step:text-[var(--text-muted)] transition-colors">
                          {step.description}
                       </p>
                       
                       {step.action && (
                          <button className="mt-8 flex items-center gap-3 text-[10px] font-black text-[#FF5C3A] uppercase tracking-widest group-hover/step:gap-5 transition-all">
                             {step.action} <ChevronRight size={14} />
                          </button>
                       )}
                    </div>
                 ))}
              </div>
           </motion.div>

           {/* SDK SECTION */}
           <motion.div variants={itemVariants} className="bg-gradient-to-br from-[#FF5C3A]/5 to-indigo-500/5 rounded-[4rem] p-16 relative overflow-hidden group border border-[var(--border-color)] shadow-2xl backdrop-blur-xl">
              <div className="absolute right-0 top-0 p-16 opacity-[0.03] group-hover:rotate-12 group-hover:scale-110 transition-transform duration-1000">
                 <Cpu size={220} strokeWidth={1} className="text-[var(--text-primary)]" />
              </div>
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
                 <div className="space-y-8">
                    <div className="w-fit px-5 py-2 bg-[var(--bg-hover)] rounded-full border border-[var(--border-color)] flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-[#FF5C3A] shadow-[0_0_10px_#FF5C3A]" />
                       <p className="text-[10px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] italic">Lookitry SDK v1.02 — Live</p>
                    </div>
                    <h2 className="text-4xl font-[950] text-[var(--text-primary)] italic uppercase tracking-tighter leading-none">Arquitectura<br/>Headless API</h2>
                    <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-tight leading-relaxed max-w-sm">
                       Para tiendas personalizadas, apps móviles o integraciones directas. Conecta el probador virtual directamente en tu código.
                    </p>
                    <button className="px-10 py-5 bg-[#FF5C3A] text-white text-[10px] font-[950] uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4 shadow-2xl shadow-[#FF5C3A]/20">
                       Integrar via SDK <ExternalLink size={16} />
                    </button>
                 </div>
                 <div className="bg-[var(--bg-base)] rounded-3xl border border-[var(--border-color)] p-10 font-mono text-[11px] text-emerald-400 leading-relaxed shadow-deep ring-1 ring-[var(--border-color)] relative">
                    <div className="absolute top-4 right-6 flex gap-2">
                       <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 shadow-inner"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 shadow-inner"></div>
                       <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 shadow-inner"></div>
                    </div>
                    <pre className="mt-6 opacity-80 overflow-x-auto">
{`// Llamada de integración
const result = await lookitry.tryon({
  product: "SKU-990",
  selfie: userBlob,
  mode: "STANDARD"
});

console.log(result.image_url);`}
                    </pre>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* ══ SIDEBAR ══ */}
        <div className="lg:col-span-4 space-y-12">
           
           {/* PLATAFORMAS */}
           <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-[4rem] border border-[var(--border-color)] p-12 shadow-4xl space-y-10">
              <div className="space-y-2">
                 <h3 className="text-sm font-[950] text-[var(--text-primary)] uppercase tracking-widest italic leading-none">Ecosistemas</h3>
                 <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-40">Plataformas compatibles</p>
              </div>
              <div className="space-y-6">
                 {[
                   { name: 'WooCommerce', icon: 'WC', color: '#7f54b3', status: 'Certificado', iconClass: <Store size={14} /> },
                   { name: 'Shopify', icon: 'SH', color: '#95bf47', status: 'Beta', iconClass: <Package size={14} /> },
                   { name: 'Wix Global', icon: 'WX', color: '#000000', status: 'Q4 2026', iconClass: <Globe size={14} /> },
                   { name: 'Direct SDK', icon: 'JS', color: '#f7df1e', status: 'Disponible', iconClass: <Command size={14} /> }
                 ].map((plat) => (
                    <div key={plat.name} className="flex items-center justify-between p-6 bg-[var(--bg-hover)] rounded-3xl border border-transparent hover:border-[var(--border-color)] group/plat transition-all shadow-sm hover:shadow-xl">
                       <div className="flex items-center gap-5">
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xl group-hover/plat:scale-110 transition-all font-[950] text-[10px]" style={{backgroundColor: plat.color}}>
                             {plat.icon}
                          </div>
                          <div>
                             <p className="text-[11px] font-[950] text-[var(--text-primary)] uppercase tracking-tight italic">{plat.name}</p>
                             <p className={`text-[8px] font-black uppercase tracking-widest mt-1 ${plat.status === 'Certificado' ? 'text-emerald-500' : 'text-[var(--text-muted)] opacity-60'}`}>{plat.status}</p>
                          </div>
                       </div>
                       <ChevronRight size={14} className="text-[var(--text-muted)] opacity-20 group-hover/plat:opacity-100 group-hover/plat:translate-x-1 transition-all" />
                    </div>
                 ))}
              </div>
           </motion.div>

           {/* SOPORTE */}
           <motion.div 
             variants={itemVariants} 
             className="bg-gradient-to-br from-[#FF5C3A] to-[#D13C1C] rounded-[4.5rem] p-12 space-y-6 shadow-3xl shadow-[#FF5C3A]/20 relative overflow-hidden group"
           >
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-6">
                 <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center shadow-2xl">
                    <HelpCircle className="w-7 h-7 text-[#FF5C3A]" />
                 </div>
                 <div className="space-y-4">
                    <h3 className="text-3xl font-[950] text-white uppercase tracking-tighter italic leading-none">Asistencia Directa</h3>
                    <p className="text-[11px] font-bold text-white/80 uppercase tracking-tight leading-relaxed italic">
                       Nuestro equipo puede ayudarte a configurar la integración sin costo adicional.
                    </p>
                 </div>
                 <button className="w-full py-5 bg-white text-black rounded-[2rem] text-[10px] font-[950] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-4xl">
                    Contactar Soporte
                 </button>
              </div>
           </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
