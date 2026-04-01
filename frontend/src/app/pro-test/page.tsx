'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Cpu, 
  Layers, 
  ArrowRight, 
  PlusCircle, 
  Clock, 
  CheckCircle, 
  LayoutDashboard,
  Box,
  CreditCard,
  Settings,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';

// ——————————————————————————————————————————————————————————————————————————————————————
// COMPONENTS
// ——————————————————————————————————————————————————————————————————————————————————————

const GlassCard = ({ children, className = '', hover = true }: { children: React.ReactNode, className?: string, hover?: boolean }) => (
  <motion.div 
    whileHover={hover ? { y: -5, scale: 1.01 } : {}}
    className={`bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 shadow-2xl transition-all duration-500 overflow-hidden relative group ${className}`}
  >
    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FF5C3A]/5 blur-3xl rounded-full group-hover:bg-[#FF5C3A]/10 transition-all duration-700" />
    {children}
  </motion.div>
);

const SectionHeader = ({ title, subtitle, icon: Icon }: { title: string, subtitle: string, icon: any }) => (
  <div className="flex items-center gap-5 mb-10">
    <div className="w-12 h-12 rounded-2xl bg-[#FF5C3A]/10 border border-[#FF5C3A]/20 flex items-center justify-center text-[#FF5C3A] shadow-[0_0_20px_rgba(255,92,58,0.1)]">
      <Icon size={24} />
    </div>
    <div>
      <h2 className="text-2xl font-black tracking-tight text-white uppercase">{title}</h2>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-0.5">{subtitle}</p>
    </div>
  </div>
);

// ——————————————————————————————————————————————————————————————————————————————————————
// PAGE COMPONENT
// ——————————————————————————————————————————————————————————————————————————————————————

export default function ProTestPage() {
  const [activeTab, setActiveTab] = React.useState('dashboard');

  return (
    <div className="min-h-screen bg-[#050505] text-[#FAFAFA] font-sans selection:bg-[#FF5C3A]/30 overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-[#FF5C3A]/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] bg-[#FF5C3A]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-[1700px] mx-auto px-6 py-10 lg:pl-[280px] relative z-10">
        
        {/* ———— SIDEBAR (MOCK) ———— */}
        <aside className="fixed left-8 top-10 bottom-10 w-[220px] bg-black/50 backdrop-blur-2xl border border-white/5 rounded-[3rem] p-8 hidden lg:flex flex-col gap-10 shadow-2xl">
          <div className="mb-4">
            <img src="/logo.svg" alt="Lookitry" className="h-10 w-auto brightness-110" />
          </div>

          <nav className="flex-1 space-y-3">
             {[
               { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
               { id: 'products', label: 'Catálogo', icon: Box },
               { id: 'generations', label: 'Historial', icon: ImageIcon },
               { id: 'credits', label: 'Suscripción', icon: CreditCard },
               { id: 'settings', label: 'Ajustes', icon: Settings },
             ].map(item => (
               <button
                 key={item.id}
                 onClick={() => setActiveTab(item.id)}
                 className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold text-[11px] uppercase tracking-widest ${activeTab === item.id ? 'bg-[#FF5C3A] text-white shadow-[0_10px_20px_rgba(255,92,58,0.2)]' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
               >
                 <item.icon size={18} />
                 {item.label}
               </button>
             ))}
          </nav>

          <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
             <p className="text-[10px] font-black uppercase text-gray-500 mb-4 tracking-tighter">Tu marca</p>
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FF5C3A] to-orange-400" />
               <span className="text-xs font-bold text-white tracking-tight truncate">Que bacano</span>
             </div>
          </div>
        </aside>

        {/* ———— HEADER ———— */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16 px-4">
           <div>
              <h1 className="text-5xl font-black tracking-tighter md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-500">
                Dashboard <span className="text-[#FF5C3A]">PRO</span>
              </h1>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mt-4 flex items-center gap-3">
                <Clock size={14} className="text-[#FF5C3A]" /> Última sincronización: Hace 2 minutos
              </p>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-[#FF5C3A] hover:text-white transition-all shadow-xl active:scale-95">
                 Generar Probar
              </button>
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-[#FF5C3A] hover:border-[#FF5C3A]/30 cursor-pointer transition-all">
                <Settings size={22} />
              </div>
           </div>
        </header>

        {/* ———— CRÉDITOS DUALES ———— */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-16">
          <GlassCard className="xl:col-span-2 p-10" hover={false}>
            <SectionHeader title="Consumo Inteligente" subtitle="Resumen de capacidad activa" icon={Cpu} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Bolsa del Plan */}
               <div className="p-8 rounded-[2rem] bg-white/5 border border-white/10 relative group">
                  <div className="absolute top-6 right-8 text-[#FF5C3A]/20 group-hover:text-[#FF5C3A]/40 transition-all font-black text-4xl">PRO</div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-6">Plan Suscripción (Mes)</p>
                  
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-black tracking-tighter">1.000</span>
                    <span className="text-xs font-bold text-gray-500 mb-2 uppercase tracking-widest">/ por mes</span>
                  </div>
                  
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '40%' }} // Mock 400 generations used
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-[#FF5C3A] to-orange-400" 
                    />
                  </div>
                  <div className="flex justify-between mt-3">
                    <p className="text-[9px] font-black uppercase text-gray-500">Restan: 600 créditos</p>
                    <p className="text-[9px] font-black uppercase text-[#FF5C3A]">40% consumido</p>
                  </div>
               </div>

               {/* Bolsa Extra */}
               <div className="p-8 rounded-[2rem] bg-[#FF5C3A]/5 border border-[#FF5C3A]/20 relative group shadow-[0_15px_30px_rgba(255,92,58,0.05)]">
                  <div className="absolute top-6 right-8 text-[#FF5C3A]/10 group-hover:text-[#FF5C3A]/20 transition-all"><Zap size={48} /></div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#FF5C3A] mb-6">Bolsa Credits Extra</p>
                  
                  <div className="flex items-end gap-3 mb-4">
                    <span className="text-5xl font-black tracking-tighter text-[#FF5C3A]">1.500</span>
                    <span className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-widest">Inmemoriales</span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full bg-[#FF5C3A]/20 text-[#FF5C3A] text-[8px] font-bold uppercase tracking-tighter">Sin vencimiento</div>
                    <p className="text-[9px] font-black uppercase text-gray-500 opacity-60">Reserva de emergencia</p>
                  </div>

                  <button className="mt-8 w-full py-4 border border-[#FF5C3A]/30 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FF5C3A] hover:text-white transition-all">
                    Comprar +500 Créditos
                  </button>
               </div>
            </div>

            <div className="mt-10 px-4 py-4 rounded-2xl bg-white/5 flex items-center justify-between">
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total disponible para usar ahora:</p>
               <p className="text-3xl font-black text-white tracking-widest italic">2.100</p>
            </div>
          </GlassCard>

          {/* ———— STATS CARD ———— */}
          <GlassCard className="flex flex-col justify-center">
             <SectionHeader title="Velocidad" subtitle="Métricas de rendimiento" icon={TrendingUp} />
             <div className="text-center py-6">
                <span className="text-7xl font-black text-[#FF5C3A] leading-none">4.2<span className="text-2xl text-white">s</span></span>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mt-6 block">Tiempo medio de generación</p>
                <div className="mt-10 flex items-center justify-center gap-4">
                  <div className="h-1 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[85%]" />
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest">Óptimo</span>
                </div>
             </div>
             <button className="mt-10 w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all text-[9px] font-black uppercase tracking-widest">
               Ver Reporte Completo
             </button>
          </GlassCard>
        </div>

        {/* ———— GENERACIONES (MOCK) ———— */}
        <motion.div variants={{hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } }}} initial="hidden" animate="show" className="space-y-10">
           <SectionHeader title="Generaciones Recientes" subtitle="Tu historial de moda IA" icon={ImageIcon} />
           
           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {[1,2,3,4,5].map(i => (
                <motion.div 
                  key={i} 
                  variants={{ hidden: { opacity: 0, y: 30 }, show: { opacity: 1, y: 0 } }}
                  className="aspect-[3/4] bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden group/img cursor-pointer relative"
                >
                   <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 z-10">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Producto #00{i}</p>
                      <p className="text-[8px] font-bold text-gray-400 uppercase">Hace {i} horas</p>
                   </div>
                   <div className="absolute top-4 right-4 z-20">
                     <div className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-[#FF5C3A] hover:border-[#FF5C3A] transition-all">
                       <ChevronRight size={16} />
                     </div>
                   </div>
                   <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800')] bg-cover bg-center grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700 opacity-60 group-hover:opacity-100" />
                </motion.div>
              ))}
           </div>
        </motion.div>

        {/* ———— FOOTER ———— */}
        <footer className="mt-32 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 pb-10">
           <div className="flex items-center gap-6">
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-600"><Layers size={14} /></div>
              <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.3em]">Built with Lookitry StitchMCP v3.1</p>
           </div>
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase text-gray-600">Sistema</span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-black uppercase text-emerald-500">Operativo</span>
           </div>
        </footer>

      </div>
    </div>
  );
}
