'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import type { PublicReview } from '@/types';
import { SkeletonCard } from '@/components/ui/Skeleton';

interface ReviewsSliderProps {
  reviews: PublicReview[];
  realReviewsCount: number;
  usingMockReviews: boolean;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.trim().charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function ReviewsSlider({ reviews, realReviewsCount, usingMockReviews }: ReviewsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const slides = useMemo(() => reviews, [reviews]);

  // Set loading to false when reviews are provided (even if empty, that's a valid "loaded" state)
  useEffect(() => {
    // reviews is defined as an array, even if empty it means data has loaded
    if (reviews !== undefined) {
      setIsLoading(false);
    }
  }, [reviews]);

  useEffect(() => {
    if (slides.length <= 1 || paused) return;

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4000);

    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [slides.length, paused]);

  if (isLoading) {
    return (
      <section className="bg-white dark:bg-[#0d0d0d] px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20" aria-label="Loading reviews">
        <div className="mx-auto max-w-5xl sm:max-w-[1180px]">
          <div className="mb-8 sm:mb-10 text-center">
            <p className="mb-2 sm:mb-3 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-[#FF5C3A]">Reviews</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] dark:text-white md:text-4xl">Lo que dicen nuestras marcas</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} avatar lines={3} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!slides.length) return null;

  const goTo = (index: number) => {
    if (index < 0) {
      setActiveIndex(slides.length - 1);
      return;
    }
    setActiveIndex(index % slides.length);
  };

  return (
    <section className="bg-white dark:bg-[#0d0d0d] px-4 sm:px-6 md:px-8 py-12 sm:py-16 md:py-20" aria-label="Reviews de clientes">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-5xl sm:max-w-[1180px]"
      >
        <div className="mb-8 sm:mb-10 text-center">
          <p className="mb-2 sm:mb-3 text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.12em] text-[#FF5C3A]">Reviews</p>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0a0a0a] dark:text-white md:text-4xl">Lo que dicen nuestras marcas</h2>
          <p className="mx-auto mt-2 sm:mt-3 max-w-2xl text-sm leading-relaxed text-[#666] dark:text-white/60 md:text-base">
            Opiniones reales de marcas que ya usan Lookitry
          </p>
        </div>

        <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <button
            type="button"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-0 sm:-left-2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d7d0c7] dark:border-white/10 bg-white/95 dark:bg-[#1a1a1a] p-2.5 sm:p-3 text-[#0a0a0a] dark:text-white shadow-lg transition-all hover:scale-105 md:flex"
            aria-label="Ver review anterior"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </button>

          <div className="overflow-hidden">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${activeIndex * 100}%)` }}>
              {slides.map((_, slideIndex) => (
                <div key={`slide-${slides[slideIndex].id}`} className="min-w-full">
                  <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
                    {[0, 1, 2].map((offset) => {
                      const review = slides[(slideIndex + offset) % slides.length];
                      return (
                        <article
                          key={`${review.id}-${offset}`}
                          className={`${offset > 0 ? 'hidden md:flex' : 'flex'} h-full flex-col rounded-2xl sm:rounded-[28px] border border-[#e0dcd7] dark:border-white/5 bg-white dark:bg-[#141414] p-5 sm:p-6 shadow-[0_20px_60px_rgba(15,15,15,0.06)] dark:shadow-none`}
                        >
                          <div className="mb-4 sm:mb-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2 sm:gap-1.5" aria-label={`${review.rating} de 5 estrellas`}>
                              {Array.from({ length: 5 }).map((__, starIndex) => {
                                const filled = review.rating >= starIndex + 1;
                                const halfFilled = !filled && review.rating >= starIndex + 0.5;

                                return (
                                  <div key={`${review.id}-${starIndex}`} className="relative h-4 w-4 sm:h-5 sm:w-5 shrink-0">
                                    <Star className="absolute inset-0 text-[#e7dfd6] dark:text-white/10" aria-hidden="true" />
                                    {filled && (
                                      <Star className="absolute inset-0 fill-[#FF5C3A] text-[#FF5C3A]" aria-hidden="true" />
                                    )}
                                    {!filled && halfFilled && (
                                      <div className="absolute inset-y-0 left-0 overflow-hidden w-1/2">
                                        <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-[#FF5C3A] text-[#FF5C3A] max-w-none" aria-hidden="true" />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                              <span className="ml-1.5 text-sm font-semibold tracking-wide text-[#FF5C3A]">{Number.isInteger(review.rating) ? `${review.rating}/5` : `${review.rating.toFixed(1)}/5`}</span>
                            </div>
                            <span className="rounded-full border border-[#f1d5cd] dark:border-[#FF5C3A]/20 bg-[#fff4f1] dark:bg-[#FF5C3A]/10 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.16em] text-[#FF5C3A]">
                              {review.reviewer_plan}
                            </span>
                          </div>

                          <p className="flex-1 text-sm sm:text-[15px] leading-6 sm:leading-7 text-[#3f3a35] dark:text-white/80">&ldquo;{review.comment}&rdquo;</p>

                          <div className="mt-4 sm:mt-6 flex items-center gap-2.5 sm:gap-3 border-t border-[#f0ebe5] dark:border-white/5 pt-4 sm:pt-5">
                            {review.avatar_url ? (
                              review.avatar_url.toLowerCase().endsWith('.svg') ? (
                                <img
                                  src={review.avatar_url}
                                  alt={review.reviewer_name}
                                  className={
                                    review.reviewer_name?.trim() === 'Wilkie Devs' || 
                                    review.avatar_url?.includes('wilkiedevs.com')
                                      ? 'h-8 sm:h-9 w-auto object-contain shrink-0 bg-transparent rounded-md p-1.5 shadow-sm'
                                      : 'h-9 w-9 sm:h-10 sm:w-10 rounded-full object-contain shrink-0 bg-white'
                                  }
                                  loading="lazy"
                                />
                              ) : (
                                <Image
                                  src={review.avatar_url}
                                  alt={review.reviewer_name}
                                  width={40}
                                  height={40}
                                  className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover shrink-0"
                                />
                              )
                            ) : (
                              <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#FF5C3A] text-xs sm:text-sm font-bold text-white shrink-0">
                                {getInitials(review.reviewer_name)}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-sm text-[#0a0a0a] dark:text-white">{review.reviewer_name}</p>
                              <p className="text-[10px] sm:text-xs uppercase tracking-[0.12em] sm:tracking-[0.16em] text-[#8a8178] dark:text-white/40">{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-0 sm:-right-2 top-1/2 z-10 hidden translate-x-1/2 -translate-y-1/2 rounded-full border border-[#d7d0c7] dark:border-white/10 bg-white/95 dark:bg-[#1a1a1a] p-2.5 sm:p-3 text-[#0a0a0a] dark:text-white shadow-lg transition-all hover:scale-105 md:flex"
            aria-label="Ver siguiente review"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-6 sm:mt-8 flex items-center justify-center gap-1.5 sm:gap-2">
          {slides.map((review, index) => (
            <button
              key={`dot-${review.id}`}
              type="button"
              onClick={() => goTo(index)}
              className={`h-2 sm:h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-6 sm:w-8 bg-[#FF5C3A]' : 'w-2 sm:w-2.5 bg-[#d1c8be] dark:bg-white/20'}`}
              aria-label={`Ir a la review ${index + 1}`}
            />
          ))}
        </div>

        {process.env.NODE_ENV === 'development' && usingMockReviews && (
          <p className="mt-4 text-center text-xs text-yellow-600 dark:text-yellow-400">
            [DEV] Mostrando mock reviews — faltan {Math.max(0, 5 - realReviewsCount)} reviews reales aprobadas
          </p>
        )}
      </motion.div>
    </section>
  );
}
