'use client';

import { useState, useEffect } from 'react';
import { TemplateClassic } from './TemplateClassic';
import { TemplateEditorial } from './TemplateEditorial';
import { TemplateModerno } from './TemplateModerno';
import type { BrandData, ProductData, MiniLandingProps } from './shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.pruebalo.wilkiedevs.com';

export function MiniLanding({ brandSlug, initialData, footerUrl }: MiniLandingProps) {
  const [data, setData] = useState<{ brand: BrandData; products: ProductData[] } | null>(initialData);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  
  // Lógica de Timer de Bloqueo Dinámico
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const processData = (result: any) => {
      setData(result);
      
      // 1. Bloqueo definitivo si el servidor dice que expiró
      if (result.brand.is_preview_expired) {
        setIsBlocked(true);
        setTimeLeft(0);
        return;
      }

      // 2. Si no ha expirado y no ha pagado, manejar timer local sincronizado con creación
      if (!result.brand.has_landing_page) {
        const timerDuration = result.brand.preview_timer_seconds || 60;
        
        // Usar localStorage solo para mantener la referencia del "inicio de sesión" si se desea, 
        // pero el servidor es la fuente de verdad final.
        const savedEnd = localStorage.getItem(`landing_preview_end_${brandSlug}`);
        const now = Date.now();
        
        if (savedEnd) {
          const remaining = Math.max(0, Math.ceil((parseInt(savedEnd) - now) / 1000));
          setTimeLeft(remaining);
          if (remaining === 0) setIsBlocked(true);
        } else {
          localStorage.setItem(`landing_preview_end_${brandSlug}`, (now + timerDuration * 1000).toString());
          setTimeLeft(timerDuration);
        }
      }
    };

    if (!initialData) {
      const fetchData = async () => {
        try {
          const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}`);
          if (!res.ok) throw new Error('No se pudo cargar la información de la marca');
          const result = await res.json();
          processData(result);
        } catch (err: any) {
          console.error('[MiniLanding] Error fetching data:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      processData(initialData);
      setLoading(false);
    }
  }, [brandSlug, initialData]);

  // Intervalo del timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isBlocked) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          setIsBlocked(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isBlocked]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#FF5C3A] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#FF5C3A] font-bold tracking-widest uppercase text-xs animate-pulse">Cargando experiencia...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2 italic uppercase">Oops! Página no encontrada</h2>
        <p className="text-gray-500 max-w-xs mx-auto mb-8">La marca "{brandSlug}" no existe o no tiene una página activa actualmente.</p>
        <a href={typeof window !== 'undefined' ? window.location.origin : '#'} className="px-8 py-3 bg-[#FF5C3A] text-white rounded-full font-bold uppercase tracking-widest text-xs">Volver al inicio</a>
      </div>
    );
  }

  const { brand, products } = data;
  const template = brand.landing_template || 'classic';

  return (
    <div className="relative">
      {/* Timer flotante discreto (Datos dinámicos) */}
      {!brand.has_landing_page && timeLeft !== null && timeLeft > 0 && !isBlocked && (
        <div className="fixed bottom-6 right-6 z-[100] bg-black/80 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-tight">Vista Previa</span>
            <span className="text-white font-mono font-bold text-lg leading-tight">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <a href="/dashboard/checkout-landing" className="px-4 py-2 bg-[#FF5C3A] text-white text-[11px] font-bold rounded-xl hover:scale-105 transition-transform active:scale-95">Activar ahora</a>
        </div>
      )}

      {/* Modal de Bloqueo Infranqueable (Datos Dinámicos del Admin) */}
      {isBlocked && (
        <div className="fixed inset-0 z-[200] bg-[#0a0a0a]/95 backdrop-blur-2xl flex items-center justify-center p-6 text-center animate-in fade-in duration-700">
          <div className="max-w-md w-full space-y-8">
            <div className="w-24 h-24 bg-[#FF5C3A]/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
              <div className="absolute inset-0 rounded-full border-4 border-[#FF5C3A] border-t-transparent animate-spin opacity-20" />
              <svg className="w-10 h-10 text-[#FF5C3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            
            <div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tight mb-4">{brand.modal_title}</h2>
              <p className="text-gray-400 leading-relaxed">{brand.modal_description}</p>
            </div>

            {brand.modal_features && brand.modal_features.length > 0 && (
              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-4">
                {brand.modal_features.map((f: string, i: number) => (
                  <div key={i} className="flex items-center gap-3 text-left">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0"><svg className="w-3 h-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg></div>
                    <span className="text-sm text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <a 
                href="/dashboard/checkout-landing" 
                className="w-full py-5 bg-[#FF5C3A] text-white font-black rounded-2xl shadow-xl shadow-[#FF5C3A]/20 hover:scale-[1.02] transition-transform active:scale-95 uppercase tracking-widest text-sm"
              >
                Activar Mini-landing y Plan
              </a>
              <a href={typeof window !== 'undefined' ? window.location.origin : '#'} className="text-gray-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">Volver al inicio</a>
            </div>
          </div>
        </div>
      )}

      {/* Renderizar el template correspondiente */}
      {template === 'editorial' && <TemplateEditorial brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />}
      {(template === 'moderno' || template === 'probador') && <TemplateModerno brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />}
      {template === 'classic' && <TemplateClassic brand={brand} products={products} brandSlug={brandSlug} footerUrl={footerUrl} />}
    </div>
  );
}

