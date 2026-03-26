'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Activity, 
  ShieldCheck, 
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Wifi,
  Database,
  Cpu,
  Globe,
  RefreshCw,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: { opacity: 1, scale: 1 }
};

export default function StatusPage() {
  const [uptime, setUptime] = useState(99.98);
  const [latency, setLatency] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const res = await fetch(`${apiUrl}/health`);
      if (res.ok) {
        const data = await res.json();
        setHealthData(data);
        
        // Calcular latencia promedio de los servicios
        if (data.services) {
          const latencies = Object.values(data.services).map((s: any) => s.latency);
          const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
          setLatency(Math.round(avg));
        }

        // Simular uptime basado en el timestamp (esto es visual)
        setUptime(99.98);
      }
    } catch (error) {
      console.error('Error fetching health status:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Actualizar cada 30s
    return () => clearInterval(interval);
  }, []);

  const refreshStatus = () => {
    setIsRefreshing(true);
    fetchHealth();
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ok': return 'Operational';
      case 'degraded': return 'Degraded';
      case 'down': return 'Outage';
      default: return 'Unknown';
    }
  };

  const services = [
    { 
      name: 'Base de Datos (Supabase)', 
      status: getStatusLabel(healthData?.services?.supabase?.status), 
      latency: `${healthData?.services?.supabase?.latency || 0}ms`, 
      load: '4%', 
      icon: <Database className="w-5 h-5" /> 
    },
    { 
      name: 'Automatizaciones (n8n Engine)', 
      status: getStatusLabel(healthData?.services?.n8n?.status), 
      latency: `${healthData?.services?.n8n?.latency || 0}ms`, 
      load: '12%', 
      icon: <Cpu className="w-5 h-5" /> 
    },
    { 
      name: 'Almacenamiento (MinIO Clusters)', 
      status: getStatusLabel(healthData?.services?.minio?.status), 
      latency: `${healthData?.services?.minio?.latency || 0}ms`, 
      load: '65%', 
      icon: <Globe className="w-5 h-5" /> 
    },
    { 
      name: 'Servicio de Email (SMTP)', 
      status: getStatusLabel(healthData?.services?.email?.status), 
      latency: `${healthData?.services?.email?.latency || 0}ms`, 
      load: '2%', 
      icon: <Zap className="w-5 h-5" /> 
    },
    { 
      name: 'Infraestructura de API', 
      status: 'Operational', 
      latency: '45ms', 
      load: '1%', 
      icon: <ShieldCheck className="w-5 h-5" /> 
    }
  ];

  const incidents = [
    { date: '24 Mar 2026', title: 'Mantenimiento Programado - Cluster Sudamérica', status: 'Resolved', type: 'maintenance' },
    { date: '18 Mar 2026', title: 'Latencia Elevada en Procesamiento de Imágenes', status: 'Resolved', type: 'incident' },
    { date: '02 Mar 2026', title: 'Actualización Core v1.4.2', status: 'Resolved', type: 'update' }
  ];

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-6xl mx-auto space-y-16 pb-32 px-4 relative"
    >
      {/* 🔮 Background Decorator - Removed for Flat Aesthetics */}
      
      {/* 🔙 Navigation */}
      <motion.div variants={itemVariants} className="pt-8 flex justify-between items-center">
         <Link href="/dashboard/integrations" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-[#FF5C3A] transition-all italic">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver a Ecosistema
         </Link>
         <button 
           onClick={refreshStatus}
           className={`flex items-center gap-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#FF5C3A] transition-all ${isRefreshing ? 'animate-pulse' : ''}`}
         >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            Actualizar Sistema
         </button>
      </motion.div>

      {/* ══ HEADER ══ */}
      <motion.header variants={itemVariants} className="flex flex-col md:flex-row justify-between items-end gap-10 border-b border-zinc-100 pb-12">
        <div className="space-y-6">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-xl">
                 <Activity className="w-6 h-6" />
              </div>
              <h1 className="text-5xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none">Salud del <br/>Sistema</h1>
           </div>
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.1em]">Todos los servicios operativos</span>
              </div>
              <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest italic">Tiempo de actividad: {uptime}%</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-8 w-full md:w-auto">
           <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] space-y-2">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Latencia Media</p>
              <p className="text-3xl font-[1000] text-zinc-900 tracking-tighter">{latency}ms</p>
           </div>
           <div className="p-8 bg-zinc-50 border border-zinc-100 rounded-[2.5rem] space-y-2">
              <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Incidentes (Mes)</p>
              <p className="text-3xl font-[1000] text-zinc-900 tracking-tighter">0</p>
           </div>
        </div>
      </motion.header>

      {/* ══ SERVICES GRID ══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
         {services.map((service, i) => (
            <motion.div 
               key={service.name} 
               variants={itemVariants}
               className="p-10 bg-white rounded-[3.5rem] border border-zinc-100 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.03)] hover:shadow-4xl transition-all group"
            >
               <div className="flex justify-between items-start mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-50 flex items-center justify-center border border-zinc-100 text-zinc-900 group-hover:bg-zinc-900 group-hover:text-white transition-all">
                     {service.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                     <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">OK</span>
                     <div className="flex gap-1">
                        {[1,2,3,4,5].map(dot => <div key={dot} className="w-1 h-3 rounded-full bg-emerald-500" />)}
                     </div>
                  </div>
               </div>
               <div className="space-y-6">
                  <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight leading-tight">{service.name}</h3>
                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-50 pt-6">
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Latencia</p>
                        <p className="text-[11px] font-black text-zinc-600">{service.latency}</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[8px] font-black text-zinc-300 uppercase tracking-widest">Carga</p>
                        <p className="text-[11px] font-black text-zinc-600">{service.load}</p>
                     </div>
                  </div>
               </div>
            </motion.div>
         ))}

         {/* Uptime Insight */}
         <motion.div variants={itemVariants} className="lg:col-span-1 p-10 bg-[#FF5C3A] rounded-[3.5rem] text-white space-y-10 shadow-4xl relative overflow-hidden group">
            <div className="space-y-4">
               <h3 className="text-xl font-black uppercase tracking-tighter italic leading-none">Disponibilidad <br/>Garantizada</h3>
               <p className="text-[10px] font-bold text-white/70 uppercase leading-relaxed tracking-wider">
                  SLA del 99.9% respaldado por nuestra arquitectura multi-cluster.
               </p>
            </div>
            <button className="w-full py-5 bg-white text-zinc-900 rounded-[2rem] text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
               Ver Reporte SLA
            </button>
         </motion.div>
      </div>

      {/* ══ INCIDENT LOG ══ */}
      <motion.section variants={itemVariants} className="space-y-10">
         <div className="flex items-center gap-4 px-4">
            <h2 className="text-2xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none">Log de <br/>Actividad</h2>
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em]">Últimos 30 días</span>
         </div>

         <div className="space-y-4">
            {incidents.map((incident, i) => (
               <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 bg-zinc-50/50 border border-zinc-100 rounded-[2.5rem] hover:bg-white hover:shadow-2xl transition-all group">
                  <div className="flex items-center gap-6">
                     <div className={`p-4 rounded-2xl border ${incident.type === 'maintenance' ? 'bg-zinc-100 border-zinc-200 text-zinc-600' : incident.type === 'incident' ? 'bg-amber-50 border-amber-100 text-amber-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'}`}>
                        {incident.type === 'maintenance' ? <Clock size={18} /> : incident.type === 'incident' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                     </div>
                     <div>
                        <h4 className="text-[11px] font-black text-zinc-900 uppercase tracking-widest group-hover:text-[#FF5C3A] transition-colors">{incident.title}</h4>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-[0.2em] mt-1.5">{incident.date}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[9px] font-[950] text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">Resuelto</span>
                     <ChevronRight size={16} className="text-zinc-200 group-hover:text-[#FF5C3A] transition-colors" />
                  </div>
               </div>
            ))}
         </div>
      </motion.section>

      {/* 🌍 Infrastructure Banner */}
      <motion.section variants={itemVariants} className="p-16 rounded-[4.5rem] bg-zinc-900 text-white relative overflow-hidden shadow-4xl border border-white/5 group">
         <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-16">
            <div className="space-y-8 max-w-lg">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10"><BarChart3 size={24} className="text-[#FF5C3A]" /></div>
                  <h3 className="text-4xl font-[1000] uppercase tracking-tighter italic leading-none">Monitoreo <br/>Predictivo</h3>
               </div>
               <p className="text-[11px] font-medium text-zinc-400 uppercase leading-relaxed tracking-widest italic">
                  Utilizamos algoritmos de IA para predecir picos de tráfico y escalar nuestra infraestructura dinámicamente.
               </p>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full lg:w-auto">
               {[
                 { label: 'Uptime Anual', val: '99.98%' },
                 { label: 'Seguridad', val: 'EAL6+' },
                 { label: 'Escalado', val: 'Auto' },
                 { label: 'Response', val: '<250ms' }
               ].map((stat) => (
                  <div key={stat.label} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] text-center space-y-2 hover:bg-white/10 transition-colors">
                     <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{stat.label}</p>
                     <p className="text-xl font-[1000] text-white tracking-tighter">{stat.val}</p>
                  </div>
               ))}
            </div>
         </div>
      </motion.section>

    </motion.div>
  );
}
