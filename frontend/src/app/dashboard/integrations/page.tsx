'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
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
  Globe,
  Activity,
  X
} from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

// ── Animaciones ──────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { 
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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
      icon: <Download className="w-5 h-5 text-indigo-500" />,
      action: 'Descargar Plugin (.zip)'
    },
    {
      id: '02',
      title: 'Configurar Credenciales',
      description: 'Navega a WooCommerce > Ajustes > Lookitry y pega tu Clave de API.',
      icon: <Key className="w-5 h-5 text-amber-500" />,
      action: null
    },
    {
      id: '03',
      title: 'Sincronización Automática',
      description: 'Lookitry detectará tus productos automáticamente mediante el ID de WordPress.',
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />,
      action: null
    }
  ];

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-7xl mx-auto space-y-16 pb-32 px-4 relative"
    >
      {/* 🔮 Background Decorator - Removed for Flat Aesthetics */}

      {/* ══ HEADER LUXURY EDITORIAL ══ */}
      <motion.header variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 border-b border-[var(--border-color)] pb-16 pt-8">
        <div className="space-y-6">
          <div className="flex items-center gap-5">
             <div className="w-14 h-14 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm">
                <Puzzle className="w-7 h-7 text-[#FF5C3A]" />
             </div>
             <div>
                <h1 className="text-6xl font-[1000] tracking-tighter text-zinc-900 italic uppercase leading-[0.85]">
                   Integraciones <br />
                   <span className="text-zinc-400">Ecosistema Pro</span>
                </h1>
                <p className="text-[10px] font-black tracking-[0.4em] text-zinc-400 uppercase mt-4 italic">Conexión Global • Procesamiento en Tiempo Real</p>
             </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 lg:self-end">
           <Link href="/dashboard/integrations/docs" className="flex items-center gap-3 px-10 py-5 bg-white border border-zinc-200 text-zinc-900 text-[10px] font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-zinc-50 transition-all shadow-sm group">
              <HelpCircle className="w-4 h-4 text-[#FF5C3A] group-hover:rotate-12 transition-transform" />
              Documentación
           </Link>
           <Link href="/dashboard/integrations/status" className="flex items-center gap-3 px-10 py-5 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-[2rem] hover:bg-[#FF5C3A] transition-all shadow-xl group">
              <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              Ver Estado
           </Link>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* ══ PANEL CENTRAL ══ */}
        <div className="lg:col-span-8 space-y-16">
           
           {/* WOOCOMMERCE CARD - NEW LUXURY DESIGN */}
           <motion.div variants={itemVariants} className="bg-white rounded-[4.5rem] border border-zinc-100 p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] space-y-16 relative overflow-hidden group">
              
              <div className="flex flex-col md:flex-row items-start md:items-center gap-10 border-b border-zinc-50 pb-16">
                <div className="w-24 h-24 rounded-[3rem] bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner group-hover:rotate-6 transition-transform">
                   <Store className="w-12 h-12 text-zinc-900" />
                </div>
                <div>
                   <h2 className="text-4xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none">WooCommerce</h2>
                   <p className="text-[11px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] mt-4 flex items-center gap-3 italic">
                      <Check className="w-3.5 h-3.5" strokeWidth={4} /> Integración Certificada
                   </p>
                </div>
              </div>

              {/* API KEY SECTION - REFINED */}
              <div className="space-y-10">
                 <div className="space-y-6">
                    <div className="flex justify-between items-center px-4">
                       <label className="text-[11px] font-[950] uppercase tracking-[0.25em] text-zinc-400 italic">Clave de API de Producción</label>
                       <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[8px] font-black text-emerald-600 uppercase">Activa</span>
                       </div>
                    </div>
                    
                    <div className="relative group/key">
                       <div className="absolute left-8 top-1/2 -translate-y-1/2 flex items-center gap-5 pr-6 border-r border-zinc-100">
                          <Terminal className="w-5 h-5 text-zinc-400" />
                       </div>
                       <input 
                          type={showKey ? 'text' : 'password'}
                          readOnly
                          value={apiKey}
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-[3rem] py-8 pl-28 pr-48 text-base font-mono font-black text-zinc-900 outline-none focus:border-zinc-200 transition-all shadow-inner"
                       />
                       <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-4 p-2 bg-white rounded-[2.5rem] shadow-xl border border-zinc-50">
                          <button 
                            onMouseDown={() => setShowKey(true)} onMouseUp={() => setShowKey(false)} onMouseLeave={() => setShowKey(false)}
                            className="w-12 h-12 flex items-center justify-center bg-zinc-50 rounded-2xl text-zinc-400 hover:text-[#FF5C3A] hover:bg-[#FF5C3A]/5 transition-all"
                          >
                             {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                          <button 
                             onClick={copyToClipboard}
                             className={`px-10 py-4 ${copied ? 'bg-emerald-500' : 'bg-zinc-900'} text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-2xl active:scale-95 flex items-center gap-3`}
                          >
                             {copied ? <Check size={16} /> : <Copy size={16} />}
                             {copied ? 'Listo' : 'Copiar Clave'}
                          </button>
                       </div>
                    </div>
                    
                    <div className="flex items-start gap-4 px-6 py-4 bg-zinc-50 rounded-3xl border border-zinc-100">
                       <ShieldAlert className="w-4 h-4 text-zinc-400 mt-0.5 shrink-0" />
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed italic">Seguridad Crítica: Esta clave otorga acceso completo a tu catálogo. No debe exponerse en el cliente de tu tienda.</p>
                    </div>
                 </div>
              </div>

              {/* PASOS - CLEAN CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
                 {steps.map((step) => (
                    <div key={step.id} className="group/step p-10 rounded-[3.5rem] bg-zinc-50/50 border border-zinc-100 hover:bg-white hover:border-zinc-200 transition-all relative overflow-hidden">
                       <div className="w-14 h-14 rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                          {step.icon}
                       </div>
                       <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest mb-4">
                          {step.title}
                       </h3>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase leading-[1.6] tracking-tight group-hover:text-zinc-500 transition-colors">
                          {step.description}
                       </p>
                       
                       {step.action && (
                          <button className="mt-8 flex items-center gap-3 text-[9px] font-black text-[#FF5C3A] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                             {step.action} <ChevronRight size={14} />
                          </button>
                       )}
                    </div>
                 ))}
              </div>
           </motion.div>

           {/* SDK SECTION - MODERN TECH */}
           <motion.div variants={itemVariants} className="bg-zinc-900 rounded-[4.5rem] p-20 relative overflow-hidden group shadow-4xl border border-white/5">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                 <div className="space-y-10">
                    <div className="w-fit px-6 py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
                       <div className="w-2 h-2 rounded-full bg-[#FF5C3A]" />
                       <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.35em] italic">Lookitry SDK v1.50</p>
                    </div>
                    <h2 className="text-5xl font-[1000] text-white italic uppercase tracking-tighter leading-none">
                       Engine <br />
                       <span className="text-zinc-400">Headless</span>
                    </h2>
                    <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest leading-relaxed italic opacity-80">
                       Construye experiencias personalizadas sobre nuestra infraestructura de IA.
                    </p>
                    <button className="px-12 py-6 bg-white text-zinc-900 text-[10px] font-black uppercase tracking-[0.25em] rounded-[2rem] hover:scale-105 active:scale-95 transition-all flex items-center gap-5">
                       SDK Documentation <ExternalLink size={18} />
                    </button>
                 </div>
                 <div className="bg-zinc-800/50 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-12 font-mono text-[12px] text-zinc-400 leading-relaxed shadow-deep ring-1 ring-white/10 relative group/code">
                    <div className="absolute top-6 right-8 flex gap-2.5">
                       <X className="w-4 h-4 text-zinc-600" />
                    </div>
                    <pre className="mt-4 opacity-90 overflow-x-auto">
{`// Engine Try-On
await lookitry.init("${apiKey.substring(0,8)}");

const { image } = await lookitry.render({
  sku: "LK-PREMIUM-01",
  source: user_media_stream,
  enhancement: 0.95
});`}
                    </pre>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* ══ SIDEBAR ══ */}
        <div className="lg:col-span-4 space-y-12">
           
           {/* PLATAFORMAS */}
           <motion.div variants={itemVariants} className="bg-white rounded-[4rem] border border-zinc-100 p-12 shadow-[0_30px_80px_rgba(0,0,0,0.02)] space-y-12">
              <div className="space-y-3">
                 <h3 className="text-[11px] font-black text-zinc-900 uppercase tracking-[0.3em] italic leading-none">Connectors</h3>
                 <p className="text-[9px] font-black text-zinc-300 uppercase tracking-[0.2em]">Universal Framework Availability</p>
              </div>
              <div className="space-y-6">
                 {[
                   { name: 'WooCommerce', icon: 'WC', color: '#f5f5f5', textColor: '#000', status: 'Live', iconClass: <Store size={14} /> },
                   { name: 'Shopify Core', icon: 'SH', color: '#f5f5f5', textColor: '#000', status: 'Beta', iconClass: <Package size={14} /> },
                   { name: 'Wix Global', icon: 'WX', color: '#f5f5f5', textColor: '#000', status: 'Q4 2026', iconClass: <Globe size={14} /> },
                   { name: 'Cloud SDK', icon: 'TS', color: '#f5f5f5', textColor: '#000', status: 'Available', iconClass: <Command size={14} /> }
                 ].map((plat) => (
                    <div key={plat.name} className="flex items-center justify-between p-7 bg-zinc-50 border border-zinc-50 rounded-[2.5rem] hover:bg-white hover:border-zinc-200 group/plat transition-all shadow-sm">
                       <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all font-black text-[11px] bg-zinc-900 text-white">
                             {plat.icon}
                          </div>
                          <div>
                             <p className="text-[12px] font-black text-zinc-900 uppercase tracking-tight italic">{plat.name}</p>
                             <p className={`text-[8px] font-black uppercase tracking-widest mt-1.5 ${plat.status === 'Live' ? 'text-emerald-500' : 'text-zinc-400 opacity-60'}`}>{plat.status}</p>
                          </div>
                       </div>
                    </div>
                 ))}
              </div>
           </motion.div>

           {/* SOPORTE REFINED */}
           <motion.div 
             variants={itemVariants} 
             className="bg-zinc-900 rounded-[4.5rem] p-12 space-y-8 relative overflow-hidden group shadow-4xl"
           >
              <div className="relative z-10 space-y-10">
                 <div className="w-16 h-16 bg-white rounded-[2rem] flex items-center justify-center shadow-xl">
                    <HelpCircle className="w-8 h-8 text-zinc-900" />
                 </div>
                 <div className="space-y-6">
                    <h3 className="text-4xl font-[1000] text-white uppercase tracking-tighter italic leading-[0.9]">Concierge <br />Technic</h3>
                    <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed italic">
                       Configuración personalizada sin costo para miembros Pro.
                    </p>
                 </div>
                 <button className="w-full py-6 bg-white text-zinc-900 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.25em] hover:bg-[#FF5C3A] hover:text-white transition-all shadow-4xl">
                    Solicitar Asistencia
                 </button>
              </div>
           </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
