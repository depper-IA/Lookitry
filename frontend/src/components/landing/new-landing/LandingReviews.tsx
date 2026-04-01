'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { PublicReview } from '@/types';

interface LandingReviewsProps {
  reviews: PublicReview[];
}

const SectionTag = ({ text, light = false }: { text: string; light?: boolean }) => (
  <div className={`inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full mb-6 sm:mb-8 font-medium text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] border shadow-sm transition-all ${light
      ? 'bg-white/5 border-white/10 text-white/60'
      : 'bg-[#FF5C3A]/5 border-[#FF5C3A]/20 text-[#FF5C3A]'
    }`}>
    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${light ? 'bg-white/40' : 'bg-[#FF5C3A]'}`} aria-hidden="true" />
    {text}
  </div>
);

export default function LandingReviews({ reviews }: LandingReviewsProps) {
  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="bg-[#0a0a0a] py-20 sm:py-24 md:py-28 lg:py-32 px-4 sm:px-6 border-y border-white/5 relative overflow-hidden" aria-label="Testimonios de clientes">
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/2 left-0 w-72 sm:w-96 h-72 sm:h-96 bg-[#FF5C3A]/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <SectionTag text="Casos de Éxito" light />
          <h2 className="font-jakarta text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 sm:mb-6">Marcas que ya <span className="text-[#FF5C3A]">brillan con IA.</span></h2>
          <p className="font-dm-sans text-white/50 text-base sm:text-lg max-w-2xl mx-auto font-light">
            Únete a la revolución del retail digital con tecnología de vanguardia.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {reviews.slice(0, 6).map((rev, i) => (
            <div key={i} className="bg-[#111] border border-white/5 p-6 sm:p-8 rounded-2xl sm:rounded-[2.5rem] hover:border-[#FF5C3A]/40 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 sm:p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity" aria-hidden="true">
                <Star size={80} fill="white" />
              </div>

              <div className="flex items-center gap-1 mb-4 sm:mb-6 text-[#FF5C3A]" aria-label={`${rev.rating} de 5 estrellas`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star 
                    key={s} 
                    size={14} 
                    fill={s < rev.rating ? "#FF5C3A" : "none"} 
                    className={s < rev.rating ? "text-[#FF5C3A]" : "text-white/10"}
                    aria-hidden="true"
                  />
                ))}
              </div>

              <p className="text-white/80 font-dm-sans leading-relaxed mb-6 sm:mb-8 italic relative z-10 text-sm sm:text-[15px] font-light">
                &quot;{rev.comment}&quot;
              </p>

              <div className="flex items-center gap-3 sm:gap-4 border-t border-white/5 pt-4 sm:pt-6 relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#FF5C3A] flex items-center justify-center font-jakarta font-bold text-base sm:text-lg text-white shadow-lg shadow-[#FF5C3A]/20 transition-transform group-hover:scale-110 shrink-0">
                  {rev.reviewer_name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-jakarta font-bold text-xs sm:text-sm text-white group-hover:text-[#FF5C3A] transition-colors">{rev.reviewer_name}</h4>
                  <p className="text-[9px] sm:text-[10px] text-white/40 uppercase tracking-[0.15em] sm:tracking-[0.2em] font-bold">{rev.reviewer_plan}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
