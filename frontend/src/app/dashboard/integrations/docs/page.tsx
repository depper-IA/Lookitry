'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Book, 
  Code2, 
  Cpu, 
  Terminal, 
  Check, 
  Copy, 
  Server,
  Zap,
  Download,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Layers
} from 'lucide-react';
import { useState } from 'react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1, 
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function DocsPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const sections = [
    {
      id: 'woo',
      title: 'WooCommerce Plugin',
      subtitle: 'Integración No-Code en 2 minutos',
      icon: <Download className="w-5 h-5 text-[#FF5C3A]" />,
      content: 'La forma más rápida de integrar Lookitry en tu e-commerce. Nuestro plugin oficial se encarga de inyectar el probador virtual automáticamente en la ficha de producto de WordPress.',
      steps: [
        'Descarga el archivo .zip desde el panel de integraciones.',
        'Súbelo a tu WordPress en Plugins > Añadir Nuevo.',
        'Activa el plugin y navega a Ajustes > Lookitry.',
        'Pega tu API Key y guarda los cambios.'
      ]
    },
    {
      id: 'iframe',
      title: 'Script Incrustado (Universal)',
      subtitle: 'Funciona en cualquier sitio web',
      icon: <Code2 className="w-5 h-5 text-[#FF5C3A]" />,
      content: 'Copia y pega nuestro script en cualquier página HTML. Funciona en WordPress, Wix, Shopify, Squarespace, Webflow, o cualquier CMS que permita insertar código personalizado.',
      code: `<!-- Lookitry Try-On Widget -->
<script src="https://lookitry.com/widget/v1/embed.js" 
  data-brand="tu-marca" 
  data-position="bottom-right"
  data-trigger="button">
</script>

<!-- O usa el botón personalizado -->
<button onclick="Lookitry.open()">Probarme Virtual</button>`,
      language: 'html'
    },
    {
      id: 'embed',
      title: 'Iframe (Para Blogs y Artículos)',
      subtitle: 'Incrustado en cualquier CMS',
      icon: <Layers className="w-5 h-5 text-[#FF5C3A]" />,
      content: 'Si tu plataforma no permite JavaScript, puedes usar un iframe. Ideal para blogs, artículos de contenido, y plataformas que solo soportan HTML básico.',
      code: `<iframe 
  src="https://lookitry.com/tu-marca/embed" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border-radius: 16px;">
</iframe>

<!-- Para un producto específico -->
<iframe 
  src="https://lookitry.com/tu-marca/embed?product=SKU123" 
  width="100%" 
  height="600" 
  frameborder="0">
</iframe>`,
      language: 'html'
    },
    {
      id: 'api',
      title: 'Direct API (REST)',
      subtitle: 'Control total de la arquitectura',
      icon: <Server className="w-5 h-5 text-indigo-500" />,
      content: 'Nuestra API REST permite realizar peticiones de generación de try-on directamente desde tu backend. Ideal para integraciones personalizadas o apps propietarias.',
      code: `// POST /api/pruebalo/:slug/generate
{
  "selfie_url": "https://tu-sitio.com/id.jpg",
  "product_id": "98b50e2ddc9943ef",
  "callback_url": "https://api.tu-tienda.com/webhook"
}`,
      language: 'json'
    },
    {
      id: 'sdk',
      title: 'Lookitry SDK (JS/TS)',
      subtitle: 'Experiencias interactivas de alta fidelidad',
      icon: <Terminal className="w-5 h-5 text-emerald-500" />,
      content: 'El SDK de Lookitry permite renderizar el probador como un componente nativo en tu web, con manejo de estados, caché y pre-carga de modelos de IA.',
      code: `import { Lookitry } from '@lookitry/sdk';

const engine = new Lookitry({ apiKey: 'TU_CLAVE' });

await engine.render({
  sku: 'PROD-2024',
  container: '#v-tryon'
});`,
      language: 'typescript'
    }
  ];

  return (
    <motion.div 
      initial="hidden" animate="visible" variants={containerVariants}
      className="max-w-5xl mx-auto space-y-16 pb-32 px-4 relative"
    >
      {/* 🔮 Background Decorator - Removed for Flat Aesthetics */}
      
      {/* 🔙 Navigation */}
      <motion.div variants={itemVariants} className="pt-8">
         <Link href="/dashboard/integrations" className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 hover:text-[#FF5C3A] transition-colors italic">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Volver a Integraciones
         </Link>
      </motion.div>

      {/* ══ HEADER ══ */}
      <motion.header variants={itemVariants} className="space-y-6 text-left">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center text-white shadow-xl">
              <Book className="w-5 h-5" />
           </div>
           <h1 className="text-5xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none underline decoration-[#FF5C3A]/20 decoration-8 underline-offset-8">Documentación <br/>Técnica</h1>
        </div>
        <p className="max-w-2xl text-sm font-medium text-zinc-400 uppercase tracking-widest leading-relaxed italic">
          Guía exhaustiva para la implementación de la infraestructura de IA de Lookitry.
        </p>
      </motion.header>

      {/* ══ SECTIONS ══ */}
      <div className="space-y-24">
         {sections.map((section) => (
            <motion.section key={section.id} variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
               {/* Left Info */}
               <div className="lg:col-span-5 space-y-8">
                  <div className="space-y-4">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 shadow-sm">{section.icon}</div>
                        <h2 className="text-2xl font-[1000] text-zinc-900 uppercase tracking-tight italic">{section.title}</h2>
                     </div>
                     <p className="text-[10px] font-black text-[#FF5C3A] uppercase tracking-[0.3em] italic">{section.subtitle}</p>
                  </div>
                  <p className="text-sm font-medium text-zinc-500 leading-relaxed uppercase tracking-wide italic">
                     {section.content}
                  </p>
                  
                  {section.steps && (
                     <ul className="space-y-4 pt-4">
                        {section.steps.map((step, i) => (
                           <li key={i} className="flex items-center gap-4 text-[10px] font-black text-zinc-400 uppercase tracking-tight group">
                              <div className="w-6 h-6 rounded-lg bg-zinc-50 flex items-center justify-center border border-zinc-100 text-[8px] group-hover:bg-[#FF5C3A] group-hover:text-white transition-all">{i+1}</div>
                              {step}
                           </li>
                        ))}
                     </ul>
                  )}

                  {!section.steps && (
                     <div className="flex flex-wrap gap-4 pt-6">
                        <button className="flex items-center gap-3 px-8 py-4 bg-zinc-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FF5C3A] transition-all">
                           Tutorial Video <Zap className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button className="flex items-center gap-3 px-8 py-4 bg-white border border-zinc-200 text-zinc-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-50 transition-all">
                           GitHub <ExternalLink size={14} className="opacity-40" />
                        </button>
                     </div>
                  )}
               </div>

               {/* Right Visual/Code */}
               <div className="lg:col-span-7">
                  {section.code ? (
                     <div className="bg-zinc-900 rounded-[3rem] p-10 shadow-4xl relative overflow-hidden group/code border border-white/5">
                        <div className="flex justify-between items-center mb-8 px-2">
                           <div className="flex gap-2">
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                              <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                           </div>
                           <button 
                             onClick={() => copyCode(section.code!, section.id)}
                             className="flex items-center gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-widest hover:text-[#FF5C3A] transition-colors"
                           >
                              {copiedSection === section.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                              {copiedSection === section.id ? 'COPIADO' : 'COPIAR CÓDIGO'}
                           </button>
                        </div>
                        <pre className="text-zinc-300 font-mono text-[13px] leading-relaxed overflow-x-auto selection:bg-[#FF5C3A]/30">
                           <code>{section.code}</code>
                        </pre>
                        <div className="absolute bottom-6 right-10 text-[8px] font-black text-zinc-700 uppercase tracking-[0.4em]">{section.language}</div>
                     </div>
                  ) : (
                     <div className="bg-white rounded-[3rem] border border-zinc-100 p-12 shadow-2xl space-y-8 relative overflow-hidden group">
                        <div className="relative z-10 flex flex-col items-center justify-center py-12 gap-8 text-center">
                           <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-50 flex items-center justify-center border border-zinc-100 shadow-inner group-hover:scale-110 transition-transform">
                              <Layers className="w-16 h-16 text-zinc-300" />
                           </div>
                           <div className="space-y-4">
                              <h4 className="text-xl font-black text-zinc-900 uppercase tracking-tighter italic">Esquema de Instalación</h4>
                              <p className="max-w-[280px] text-[10px] font-bold text-zinc-400 lg:mx-auto uppercase leading-relaxed tracking-widest">
                                El plugin sincroniza SKUs automáticamente y habilita el botón &quot;Prueba Virtual&quot; en tiempo real.
                              </p>
                           </div>
                           <button className="px-10 py-5 bg-zinc-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-[#FF5C3A] transition-all">
                              Descargar Asset Pack
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </motion.section>
         ))}
      </div>

      {/* 🔮 Security Section */}
      <motion.section variants={itemVariants} className="p-16 rounded-[4rem] bg-zinc-50 border border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
         <div className="space-y-6 text-left">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center border border-zinc-100 shadow-xl">
               <ShieldCheck className="w-7 h-7 text-[#FF5C3A]" />
            </div>
            <h3 className="text-3xl font-[1000] text-zinc-900 uppercase tracking-tighter italic leading-none">Seguridad & <br/>Cumplimiento</h3>
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-relaxed italic">
               Nuestra API utiliza cifrado AES-256 de extremo a extremo y cumple con los estándares GDPR.
            </p>
         </div>
         <div className="flex flex-col gap-4">
            {['Inyección de Sandbox', 'Validación de Headers', 'Rate Limiting Activo'].map((item) => (
               <div key={item} className="flex items-center gap-5 p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                  <div className="w-2 h-2 rounded-full bg-zinc-900/10" />
                  <span className="text-[9px] font-black text-zinc-900 uppercase tracking-[0.2em]">{item}</span>
               </div>
            ))}
         </div>
      </motion.section>

      {/* 💬 Footer Docs */}
      <motion.footer variants={itemVariants} className="text-center space-y-6 pt-12 border-t border-zinc-100">
         <p className="text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em] italic leading-none">¿Necesitas ayuda con la implementación?</p>
         <div className="flex justify-center gap-10">
            <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest cursor-default">API Reference</span>
            <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest cursor-default">Stack Overflow</span>
            <span className="text-[11px] font-black text-zinc-300 uppercase tracking-widest cursor-default">Discord Devs</span>
         </div>
      </motion.footer>

    </motion.div>
  );
}
