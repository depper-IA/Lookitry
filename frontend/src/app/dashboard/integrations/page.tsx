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
import { api } from '@/services/api';

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

const PLATFORM_CONNECTORS = [
  {
    name: 'WooCommerce',
    icon: '/integrations/Woo_logo_color.svg',
    status: 'Live',
    tileClass: 'bg-white',
    imageClass: 'object-contain',
  },
  {
    name: 'Shopify Core',
    icon: '/integrations/shopify.svg',
    status: 'Beta',
    tileClass: 'bg-white',
    imageClass: 'object-contain scale-[0.9]',
  },
  {
    name: 'Wix Global',
    icon: '/integrations/Wix.svg',
    status: 'Q4 2026',
    tileClass: 'bg-[#f5f2ee]',
    imageClass: 'object-contain scale-[0.9]',
  },
  {
    name: 'Cloud SDK',
    icon: '/Lookitry-logo-dark.svg',
    status: 'Available',
    tileClass: 'bg-[#fff3ef] border-[#ffd3c8]',
    imageClass: 'object-contain scale-[0.92]',
  },
] as const;

type WooMetrics = {
  products: {
    totalMappedProducts: number;
    activeMappedProducts: number;
  };
  telemetry: {
    totalRequests: number;
    failedRequests: number;
    avgLatencyMs: number;
    lastSyncAt: string | null;
  };
};

export default function IntegrationsPage() {
  const { brand, refreshBrand } = useAuth();
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [wooMetrics, setWooMetrics] = useState<null | WooMetrics>(null);
  
  // Refrescar datos al montar para obtener la API Key
  useEffect(() => {
    refreshBrand();
    api.get<WooMetrics>('/brands/me/woocommerce-metrics')
      .then((res) => setWooMetrics(res.data))
      .catch((error) => console.error('Error loading WooCommerce metrics:', error))
      .finally(() => setMetricsLoading(false));
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
      title: 'Instalar plugin',
      description: 'Descarga el plugin oficial para WooCommerce e instálalo en tu tienda.',
      icon: <Download className="w-5 h-5 text-indigo-500" />,
      action: 'Descargar plugin (.zip)'
    },
    {
      id: '02',
      title: 'Configurar credenciales',
      description: 'Navega a WooCommerce > Ajustes > Lookitry y pega tu clave de api.',
      icon: <Key className="w-5 h-5 text-amber-500" />,
      action: null
    },
    {
      id: '03',
      title: 'Sincronización automática',
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
      {/* ══ HEADER ══ */}
      <motion.header variants={itemVariants} className="flex flex-col xl:flex-row xl:items-center justify-between gap-8 md:gap-10 border-b border-[var(--border-color)] pb-8 md:pb-12 pt-4 md:pt-6 w-full overflow-hidden">
        <div className="space-y-4 md:space-y-6">
          <div className="flex items-center gap-4 md:gap-5">
             <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl md:rounded-3xl bg-[#fff3ef] border border-[#ffd7cd] flex items-center justify-center shadow-sm shrink-0 overflow-hidden p-2.5">
                <img src="/Lookitry-logo-dark.svg" alt="Lookitry" className="w-full h-full object-contain scale-[0.92]" />
             </div>
             <div>
                 <h1 className="text-2xl md:text-4xl xl:text-[2.7rem] font-bold tracking-tight text-[var(--text-primary)] leading-[0.95] font-jakarta">
                    Integraciones de <br />
                    <span className="text-[#FF5C3A]">Ecosistema Pro</span>
                 </h1>
                 <p className="text-[10px] md:text-[11px] font-bold tracking-wider text-[var(--text-muted)] uppercase mt-2 md:mt-3 mb-1">Conexión global • Tiempo real</p>
             </div>
          </div>
        </div>

        <div className="flex flex-row overflow-x-auto xl:overflow-visible pb-2 xl:pb-0 gap-3 md:gap-4 xl:self-end no-scrollbar scroll-smooth">
           <Link href="/dashboard/integrations/docs" className="flex-none flex items-center justify-center gap-2 md:gap-3 px-5 md:px-10 py-4 md:py-5 bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-[10px] font-bold uppercase tracking-wider rounded-2xl md:rounded-3xl hover:bg-[var(--bg-hover)] transition-all shadow-sm group whitespace-nowrap">
              <HelpCircle className="w-4 h-4 text-[#FF5C3A] group-hover:rotate-12 transition-transform" />
              Documentación
           </Link>
           <Link href="/dashboard/integrations/status" className="flex-none flex items-center justify-center gap-2 md:gap-3 px-5 md:px-10 py-4 md:py-5 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-2xl md:rounded-3xl hover:bg-[#FF5C3A] transition-all shadow-xl group whitespace-nowrap">
              <Activity className="w-4 h-4 text-emerald-400 group-hover:scale-125 transition-transform" />
              Estado del sistema
           </Link>
        </div>
      </motion.header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-12">
        
        {/* ══ PANEL CENTRAL ══ */}
        <div className="xl:col-span-8 space-y-10 md:space-y-14">
           
           {/* WOOCOMMERCE CARD */}
           <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-3xl md:rounded-[3rem] border border-[var(--border-color)] p-6 md:p-10 xl:p-14 shadow-xl shadow-black/5 space-y-8 md:space-y-12 relative overflow-hidden group">
              
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 border-b border-[var(--border-color)] pb-10 md:pb-16 text-center md:text-left">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[var(--bg-input)] flex items-center justify-center border border-[var(--border-color)] shadow-inner group-hover:rotate-6 transition-transform shrink-0 overflow-hidden p-4">
                   <img src="/integrations/Woo_logo_color.svg" alt="WooCommerce" className="w-full h-full object-contain" />
                </div>
                <div>
                   <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 md:gap-4 mb-3">
                      <h2 className="text-2xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight leading-none">WooCommerce</h2>
                      <div className="px-3 py-1 bg-emerald-500 rounded-full border border-emerald-400/20 shadow-lg shadow-emerald-500/20 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                         <span className="text-[9px] font-bold text-white uppercase tracking-widest">Plugin activo</span>
                      </div>
                   </div>
                   <p className="text-[10px] md:text-[12px] font-bold text-[#FF5C3A] uppercase tracking-wider flex items-center justify-center md:justify-start gap-2 md:gap-3 opacity-80">
                      <Check className="w-3.5 h-3.5 text-emerald-500" strokeWidth={4} /> Conectado correctamente
                   </p>
                </div>
              </div>

              {/* API KEY SECTION */}
              <div className="space-y-8 md:space-y-10">
                 <div className="space-y-4 md:space-y-6">
                    <div className="flex justify-between items-center px-2 md:px-4">
                       <label className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Clave de api de producción</label>
                       <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 rounded-full border border-emerald-100 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[8px] font-bold text-emerald-600 uppercase">Activa</span>
                       </div>
                    </div>
                    
                    <div className="relative group/key flex flex-col gap-3 md:block">
                       <div className="absolute left-6 md:left-8 top-8 md:top-1/2 -translate-y-0 md:-translate-y-1/2 flex items-center gap-3 md:gap-5 md:pr-6 md:border-r md:border-[var(--border-color)] hidden md:flex">
                          <Terminal className="w-4 h-4 md:w-5 md:h-5 text-[var(--text-muted)]" />
                       </div>
                       <input 
                          type={showKey ? 'text' : 'password'}
                          readOnly
                          value={apiKey}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl md:rounded-[2rem] py-5 md:py-8 px-6 md:pl-20 md:pr-44 text-[12px] md:text-base font-mono font-bold text-[var(--text-primary)] outline-none focus:border-[#FF5C3A]/30 transition-all shadow-inner truncate"
                       />
                       <div className="relative md:absolute md:right-3 md:top-1/2 md:-translate-y-1/2 flex flex-row gap-2 md:gap-4 p-1.5 md:p-2 bg-[var(--bg-card)] rounded-xl md:rounded-[1.5rem] md:shadow-xl md:border md:border-[var(--border-color)]">
                          <button 
                            onMouseDown={() => setShowKey(true)} onTouchStart={() => setShowKey(true)} onMouseUp={() => setShowKey(false)} onTouchEnd={() => setShowKey(false)} onMouseLeave={() => setShowKey(false)}
                            className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[var(--bg-input)] rounded-lg md:rounded-xl text-[var(--text-muted)] hover:text-[#FF5C3A] hover:bg-[#FF5C3A]/5 transition-all shrink-0"
                          >
                             {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button 
                             onClick={copyToClipboard}
                             className={`flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 ${copied ? 'bg-emerald-500' : 'bg-[#0a0a0a]'} text-white rounded-lg md:rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-2 md:gap-3`}
                          >
                             {copied ? <Check size={14} /> : <Copy size={14} />}
                             {copied ? 'Listo' : 'Copiar clave'}
                          </button>
                       </div>
                    </div>
                    
                    <div className="flex items-start gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-color)]">
                       <ShieldAlert className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                       <p className="text-[10px] font-medium text-[var(--text-muted)] tracking-tight leading-relaxed uppercase">Seguridad crítica: No expongas esta clave en el cliente de tu tienda.</p>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
                 {metricsLoading ? (
                    <div className="col-span-2 xl:col-span-4 flex items-center justify-center py-10">
                       <Spinner />
                    </div>
                 ) : (
                    <>
                       <div className="p-5 md:p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Productos activos</p>
                          <p className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">{wooMetrics?.products.activeMappedProducts || 0}</p>
                       </div>
                       <div className="p-5 md:p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Mapeados</p>
                          <p className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">{wooMetrics?.products.totalMappedProducts || 0}</p>
                       </div>
                       <div className="p-5 md:p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Errores plugin (30d)</p>
                          <p className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">{wooMetrics?.telemetry.failedRequests || 0}</p>
                       </div>
                       <div className="p-5 md:p-6 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-color)]">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Latencia promedio</p>
                          <p className="text-2xl md:text-3xl font-black tracking-tight text-[var(--text-primary)]">{wooMetrics?.telemetry.avgLatencyMs || 0}ms</p>
                       </div>
                    </>
                 )}
              </div>

              {!metricsLoading && (
                 <div className="rounded-3xl border border-[var(--border-color)] bg-[var(--bg-input)] px-6 py-5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                      Ultima sincronizacion exitosa
                    </p>
                    <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">
                      {wooMetrics?.telemetry.lastSyncAt
                        ? new Date(wooMetrics.telemetry.lastSyncAt).toLocaleString('es-CO')
                        : 'Aun no registrada'}
                    </p>
                 </div>
              )}

              {/* PASOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6 pt-2 md:pt-4">
                 {steps.map((step) => (
                    <div key={step.id} className="group/step p-6 md:p-8 xl:p-9 rounded-3xl bg-[var(--bg-input)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] hover:border-[#FF5C3A]/20 transition-all relative overflow-hidden min-h-[320px] flex flex-col">
                       <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center mb-6 md:mb-8 shadow-sm group-hover:scale-110 transition-transform">
                          {step.icon}
                       </div>
                       <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-wider mb-3 md:mb-4">
                          {step.title}
                        </h3>
                        <p className="text-[10px] font-medium text-[var(--text-muted)] leading-relaxed tracking-tight group-hover:text-[var(--text-secondary)] transition-colors flex-1">
                           {step.description}
                        </p>
                       
                       {step.action && (
                           <button className="mt-6 md:mt-8 flex items-center gap-3 text-[10px] font-bold text-[#FF5C3A] uppercase tracking-wider group-hover:gap-5 transition-all">
                              {step.action} <ChevronRight className="w-3.5 h-3.5" />
                           </button>
                       )}
                    </div>
                 ))}
              </div>
           </motion.div>

           {/* SDK SECTION */}
           <motion.div variants={itemVariants} className="bg-zinc-900 rounded-3xl md:rounded-[3rem] p-8 md:p-20 relative overflow-hidden group shadow-2xl border border-white/5">
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-20 items-center">
                 <div className="space-y-6 md:space-y-10">
                    <div className="w-fit px-4 md:px-6 py-1.5 md:py-2 bg-white/5 rounded-full border border-white/10 flex items-center gap-3">
                       <div className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-[#FF5C3A]" />
                       <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Lookitry SDK v1.50</p>
                    </div>
                    <h2 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-tighter leading-none font-jakarta">
                       Engine <br />
                       <span className="text-zinc-400">Headless</span>
                    </h2>
                    <p className="text-sm font-medium text-zinc-400 leading-relaxed opacity-80">
                       Construye experiencias personalizadas sobre nuestra infraestructura de inteligencia artificial.
                    </p>
                     <button className="w-full lg:w-auto px-8 md:px-12 py-4 md:py-6 bg-[#FF5C3A] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl md:rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 md:gap-5 shadow-lg shadow-[#FF5C3A]/20">
                       Documentación SDK <ExternalLink className="w-[18px] h-[18px]" />
                    </button>
                 </div>
                 <div className="bg-zinc-800/50 backdrop-blur-3xl rounded-3xl border border-white/5 p-8 md:p-12 font-mono text-[12px] text-zinc-400 leading-relaxed shadow-deep ring-1 ring-white/10 relative group/code overflow-hidden">
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
         </div>

        {/* ══ SIDEBAR ══ */}
         <div className="xl:col-span-4 space-y-8 md:space-y-10">
            
            {/* PLATAFORMAS */}
            <motion.div variants={itemVariants} className="bg-[var(--bg-card)] rounded-3xl md:rounded-[3rem] border border-[var(--border-color)] p-8 md:p-12 shadow-xl shadow-black/5 space-y-8 md:space-y-12">
               <div className="space-y-2 md:space-y-3">
                  <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-widest leading-none">Connectors</h3>
                  <p className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Framework availability</p>
               </div>
               <div className="space-y-4 md:space-y-6">
                  {PLATFORM_CONNECTORS.map((plat) => (
                     <div key={plat.name} className="flex items-center justify-between p-5 md:p-7 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-2xl md:rounded-3xl hover:bg-[var(--bg-card)] hover:border-[#FF5C3A]/20 group/plat transition-all shadow-sm">
                        <div className="flex items-center gap-4 md:gap-6">
                           <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all border border-[var(--border-color)] shrink-0 overflow-hidden p-2.5 ${plat.tileClass}`}>
                              <img src={plat.icon} alt={plat.name} className={`w-full h-full ${plat.imageClass}`} />
                           </div>
                           <div>
                              <p className="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-tight">{plat.name}</p>
                              <p className={`text-[8px] font-bold uppercase tracking-widest mt-1 ${plat.status === 'Live' ? 'text-emerald-500' : 'text-[var(--text-muted)] opacity-60'}`}>{plat.status}</p>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </motion.div>
             {/* SOPORTE */}
            <motion.div 
              variants={itemVariants} 
              className="bg-zinc-900 rounded-3xl md:rounded-[3rem] p-8 md:p-12 space-y-6 md:space-y-8 relative overflow-hidden group shadow-2xl"
            >
               <div className="relative z-10 space-y-8 md:space-y-10">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                     <HelpCircle className="w-6 h-6 md:w-8 md:h-8 text-zinc-900" />
                  </div>
                  <div className="space-y-4 md:space-y-6">
                     <h3 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-tighter leading-none font-jakarta">Asistencia <br />técnica</h3>
                     <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider leading-relaxed">
                        Configuración personalizada sin costo para miembros pro.
                     </p>
                  </div>
                  <button className="w-full py-4 md:py-6 bg-white text-zinc-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#FF5C3A] hover:text-white transition-all shadow-4xl">
                     Solicitar asistencia
                  </button>
               </div>
            </motion.div>

        </div>
      </div>
    </motion.div>
  );
}
