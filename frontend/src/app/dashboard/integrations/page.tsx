'use client';

import { useState, useEffect } from 'react';
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
  const { brand, refreshBrand } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Refrescar datos al montar para obtener la API Key
  useEffect(() => {
    refreshBrand();
  }, []);

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
      className="max-w-[1400px] mx-auto space-y-8 md:space-y-16 pb-20 px-4 xl:px-0 relative"
    >
      {/* 🔮 Background Decorator - Removed for Flat Aesthetics */}

      {/* ══ HEADER LUXURY EDITORIAL ══ */}
      <motion.header variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 md:gap-10 border-b border-[var(--border-color)] pb-10 md:pb-16 pt-4 md:pt-8 w-full overflow-hidden">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-4 md:gap-5">
             <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-2.5">
                <img src="/logo.svg" alt="Lookitry" className="w-full h-full object-contain" />
             </div>
             <div>
                <h1 className="text-[1.75rem] sm:text-3xl md:text-5xl lg:text-6xl font-[1000] tracking-tighter text-zinc-900 italic uppercase leading-[0.95] md:leading-[0.85] break-words">
                   Integraciones <br />
                   <span className="text-zinc-400">Ecosistema Pro</span>
                </h1>
                <p className="text-[8px] md:text-[10px] font-black tracking-[0.2em] md:tracking-[0.4em] text-zinc-400 uppercase mt-2 md:mt-4 italic">Conexión Global • Tiempo Real</p>
             </div>
          </div>
        </div>

        <div className="flex flex-row overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 gap-3 md:gap-4 lg:self-end no-scrollbar scroll-smooth">
           <Link href="/dashboard/integrations/docs" className="flex-none flex items-center justify-center gap-2 md:gap-3 px-5 md:px-10 py-4 md:py-5 bg-white border border-zinc-200 text-zinc-900 text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-2xl md:rounded-[2rem] hover:bg-zinc-50 transition-all shadow-sm group whitespace-nowrap">
              <HelpCircle className="w-4 h-4 text-[#FF5C3A] group-hover:rotate-12 transition-transform" />
              Documentación
           </Link>
           <Link href="/dashboard/integrations/status" className="flex-none flex items-center justify-center gap-2 md:gap-3 px-5 md:px-10 py-4 md:py-5 bg-zinc-900 text-white text-[9px] md:text-[10px] font-black uppercase tracking-[0.15em] md:tracking-[0.2em] rounded-2xl md:rounded-[2rem] hover:bg-[#FF5C3A] transition-all shadow-xl group whitespace-nowrap">
              <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              Ver Estado
           </Link>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        
        {/* ══ PANEL CENTRAL ══ */}
        <div className="lg:col-span-8 space-y-12 md:space-y-16">
           
           {/* WOOCOMMERCE CARD - NEW LUXURY DESIGN */}
           <motion.div variants={itemVariants} className="bg-white rounded-3xl md:rounded-[4.5rem] border border-zinc-100 p-6 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] space-y-10 md:space-y-16 relative overflow-hidden group">
              
              <div className="flex flex-col md:flex-row items-center md:items-center gap-6 md:gap-10 border-b border-zinc-50 pb-10 md:pb-16 text-center md:text-left">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2.5rem] md:rounded-[3rem] bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner group-hover:rotate-6 transition-transform shrink-0 overflow-hidden p-4">
                   <img src="/integrations/Woo_logo_color.png" alt="WooCommerce" className="w-full h-full object-contain" />
                </div>
                <div>
                   <h2 className="text-2xl md:text-4xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none">WooCommerce</h2>
                   <p className="text-[9px] md:text-[11px] font-black text-[#FF5C3A] uppercase tracking-[0.2em] md:tracking-[0.3em] mt-3 md:mt-4 flex items-center justify-center md:justify-start gap-2 md:gap-3 italic">
                      <Check className="w-3 md:w-3.5 h-3 md:h-3.5" strokeWidth={4} /> Integración Certificada
                   </p>
                </div>
              </div>

              {/* API KEY SECTION - REFINED */}
              <div className="space-y-8 md:space-y-10">
                 <div className="space-y-4 md:space-y-6">
                    <div className="flex justify-between items-center px-2 md:px-4">
                       <label className="text-[9px] md:text-[11px] font-[950] uppercase tracking-[0.15em] md:tracking-[0.25em] text-zinc-400 italic">Clave de API de Producción</label>
                       <div className="flex items-center gap-2 px-2 md:px-3 py-0.5 md:py-1 bg-emerald-50 rounded-full border border-emerald-100 shrink-0">
                          <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[7px] md:text-[8px] font-black text-emerald-600 uppercase">Activa</span>
                       </div>
                    </div>
                    
                    <div className="relative group/key flex flex-col gap-3 md:block">
                       <div className="absolute left-6 md:left-8 top-8 md:top-1/2 -translate-y-0 md:-translate-y-1/2 flex items-center gap-3 md:gap-5 md:pr-6 md:border-r md:border-zinc-100 hidden md:flex">
                          <Terminal className="w-4 h-4 md:w-5 md:h-5 text-zinc-400" />
                       </div>
                       <input 
                          type={showKey ? 'text' : 'password'}
                          readOnly
                          value={apiKey}
                          className="w-full bg-zinc-50 border border-zinc-100 rounded-2xl md:rounded-[3rem] py-5 md:py-8 px-6 md:pl-20 md:pr-44 text-[12px] md:text-base font-mono font-black text-zinc-900 outline-none focus:border-zinc-200 transition-all shadow-inner truncate"
                       />
                       <div className="relative md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2 flex flex-row gap-2 md:gap-4 p-1.5 md:p-2 bg-white rounded-xl md:rounded-[2.5rem] md:shadow-xl md:border md:border-zinc-50">
                          <button 
                            onMouseDown={() => setShowKey(true)} onTouchStart={() => setShowKey(true)} onMouseUp={() => setShowKey(false)} onTouchEnd={() => setShowKey(false)} onMouseLeave={() => setShowKey(false)}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-zinc-50 rounded-lg md:rounded-2xl text-zinc-400 hover:text-[#FF5C3A] hover:bg-[#FF5C3A]/5 transition-all shrink-0"
                          >
                             {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button 
                             onClick={copyToClipboard}
                             className={`flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 ${copied ? 'bg-emerald-500' : 'bg-zinc-900'} text-white rounded-lg md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] md:tracking-[0.15em] transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2 md:gap-3`}
                          >
                             {copied ? <Check size={14} /> : <Copy size={14} />}
                             {copied ? 'Listo' : 'Copiar Clave'}
                          </button>
                       </div>
                    </div>
                    
                    <div className="flex items-start gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-zinc-50 rounded-2xl md:rounded-3xl border border-zinc-100">
                       <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4 text-zinc-400 mt-0.5 shrink-0" />
                       <p className="text-[8px] md:text-[10px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed italic">Seguridad Crítica: No expongas esta clave en el cliente de tu tienda.</p>
                    </div>
                 </div>
              </div>

              {/* PASOS - CLEAN CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 pt-4 md:pt-6">
                 {steps.map((step) => (
                    <div key={step.id} className="group/step p-6 md:p-10 rounded-2xl md:rounded-[3.5rem] bg-zinc-50/50 border border-zinc-100 hover:bg-white hover:border-zinc-200 transition-all relative overflow-hidden">
                       <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-white border border-zinc-100 flex items-center justify-center mb-6 md:mb-8 shadow-sm group-hover:scale-110 transition-transform">
                          {step.icon}
                       </div>
                       <h3 className="text-[10px] md:text-[11px] font-black text-zinc-900 uppercase tracking-widest mb-3 md:mb-4">
                          {step.title}
                       </h3>
                       <p className="text-[9px] md:text-[10px] font-bold text-zinc-400 uppercase leading-[1.6] md:leading-[1.6] tracking-tight group-hover:text-zinc-500 transition-colors">
                          {step.description}
                       </p>
                       
                       {step.action && (
                           <button className="mt-6 md:mt-8 flex items-center gap-3 text-[8px] md:text-[9px] font-black text-[#FF5C3A] uppercase tracking-[0.2em] group-hover:gap-5 transition-all">
                              {step.action} <ChevronRight className="w-3 h-3 md:w-3.5 md:h-3.5" />
                           </button>
                       )}
                    </div>
                 ))}
              </div>
           </motion.div>

           {/* SDK SECTION - MODERN TECH */}
           <motion.div variants={itemVariants} className="bg-zinc-900 rounded-3xl md:rounded-[4.5rem] p-8 md:p-20 relative overflow-hidden group shadow-4xl border border-white/5">
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
                 <div className="space-y-6 md:space-y-10">
                    <div className="w-fit px-4 md:px-6 py-1.5 md:py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
                       <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-[#FF5C3A]" />
                       <p className="text-[8px] md:text-[10px] font-black text-zinc-300 uppercase tracking-[0.2em] md:tracking-[0.35em] italic">Lookitry SDK v1.50</p>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-[1000] text-white italic uppercase tracking-tighter leading-none">
                       Engine <br />
                       <span className="text-zinc-400">Headless</span>
                    </h2>
                    <p className="text-xs md:text-sm font-medium text-zinc-400 uppercase tracking-widest leading-relaxed italic opacity-80">
                       Construye experiencias personalizadas sobre nuestra infraestructura de IA.
                    </p>
                     <button className="w-full md:w-auto px-8 md:px-12 py-4 md:py-6 bg-white text-zinc-900 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] rounded-xl md:rounded-[2rem] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-5">
                       SDK Documentation <ExternalLink className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                    </button>
                 </div>
                 <div className="bg-zinc-800/50 backdrop-blur-3xl rounded-[3rem] border border-white/5 p-8 md:p-12 font-mono text-[11px] md:text-[12px] text-zinc-400 leading-relaxed shadow-deep ring-1 ring-white/10 relative group/code overflow-hidden">
                    <div className="absolute top-4 right-6 flex gap-2.5">
                       <X className="w-3 h-3 text-zinc-600" />
                    </div>
                    <pre className="mt-4 opacity-90 overflow-x-auto no-scrollbar whitespace-pre">
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

            {/* PAYMENTS SECTION */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl md:rounded-[4.5rem] border border-zinc-100 p-8 md:p-16 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.04)] space-y-8">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white">
                     <Cpu size={20} />
                  </div>
                  <div>
                     <h3 className="text-xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none">Pagos & Gateways</h3>
                     <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mt-1">Soporte nativo para pasarelas</p>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6">
                  {[
                    { name: 'Bancolombia', img: '/integrations/bancolombia.svg' },
                    { name: 'Nequi', img: '/integrations/logo-nequi.svg' },
                    { name: 'PSE', img: '/integrations/logo-pse.svg' },
                    { name: 'Visa', img: '/integrations/visa.svg' }
                  ].map(p => (
                    <div key={p.name} className="p-6 md:p-8 rounded-[2rem] bg-zinc-50/50 border border-zinc-50 flex items-center justify-center grayscale hover:grayscale-0 hover:bg-white hover:border-zinc-200 transition-all group">
                       <img src={p.img} alt={p.name} className="h-6 md:h-8 w-auto object-contain group-hover:scale-110 transition-transform" />
                    </div>
                  ))}
               </div>
            </motion.div>
         </div>

        {/* ══ SIDEBAR ══ */}
         <div className="lg:col-span-4 space-y-8 md:space-y-12">
            
            {/* PLATAFORMAS */}
            <motion.div variants={itemVariants} className="bg-white rounded-3xl md:rounded-[4rem] border border-zinc-100 p-8 md:p-12 shadow-[0_30px_80px_rgba(0,0,0,0.02)] space-y-8 md:space-y-12">
               <div className="space-y-2 md:space-y-3">
                  <h3 className="text-[10px] md:text-[11px] font-black text-zinc-900 uppercase tracking-[0.2em] md:tracking-[0.3em] italic leading-none">Connectors</h3>
                  <p className="text-[8px] md:text-[9px] font-black text-zinc-300 uppercase tracking-[0.15em] md:tracking-[0.2em]">Framework Availability</p>
               </div>
               <div className="space-y-4 md:space-y-6">
                  {[
                    { name: 'WooCommerce', icon: '/integrations/Woo_logo_color.png', color: '#f5f5f5', status: 'Live' },
                    { name: 'Shopify Core', icon: '/integrations/shopify.svg', color: '#f5f5f5', status: 'Beta' },
                    { name: 'Wix Global', icon: '/integrations/Wix.svg', color: '#f5f5f5', status: 'Q4 2026' },
                    { name: 'Cloud SDK', icon: '/logo.svg', color: '#f5f5f5', status: 'Available' }
                  ].map((plat) => (
                     <div key={plat.name} className="flex items-center justify-between p-5 md:p-7 bg-zinc-50 border border-zinc-50 rounded-2xl md:rounded-[2.5rem] hover:bg-white hover:border-zinc-200 group/plat transition-all shadow-sm">
                        <div className="flex items-center gap-4 md:gap-6">
                           <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all bg-white border border-zinc-100 shrink-0 overflow-hidden p-2.5">
                              <img src={plat.icon} alt={plat.name} className="w-full h-full object-contain" />
                           </div>
                           <div>
                              <p className="text-[11px] md:text-[12px] font-black text-zinc-900 uppercase tracking-tight italic">{plat.name}</p>
                              <p className={`text-[7px] md:text-[8px] font-black uppercase tracking-widest mt-1 ${plat.status === 'Live' ? 'text-emerald-500' : 'text-zinc-400 opacity-60'}`}>{plat.status}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </motion.div>
             {/* SOPORTE REFINED */}
            <motion.div 
              variants={itemVariants} 
              className="bg-zinc-900 rounded-3xl md:rounded-[4.5rem] p-8 md:p-12 space-y-6 md:space-y-8 relative overflow-hidden group shadow-4xl"
            >
               <div className="relative z-10 space-y-8 md:space-y-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-xl md:rounded-[2rem] flex items-center justify-center shadow-xl">
                     <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-zinc-900" />
                  </div>
                  <div className="space-y-4 md:space-y-6">
                     <h3 className="text-2xl md:text-4xl font-[1000] text-white uppercase tracking-tighter italic leading-[0.95] md:leading-[0.9]">Concierge <br />Technic</h3>
                     <p className="text-[10px] md:text-[11px] font-bold text-zinc-400 uppercase tracking-widest leading-relaxed italic">
                        Configuración personalizada sin costo para miembros Pro.
                     </p>
                  </div>
                  <button className="w-full py-4 md:py-6 bg-white text-zinc-900 rounded-xl md:rounded-[2rem] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] hover:bg-[#FF5C3A] hover:text-white transition-all shadow-4xl">
                     Solicitar Asistencia
                  </button>
               </div>
            </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
