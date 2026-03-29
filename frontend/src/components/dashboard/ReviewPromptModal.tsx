'use client';

import { useEffect, useMemo, useState } from 'react';
import { Heart, Loader2, MessageSquare, Star, X } from 'lucide-react';
import { reviewsService } from '@/services/reviews.service';
import type { CreateReviewDto, MyReview } from '@/types';

interface ReviewPromptModalProps {
  isOpen?: boolean;
  variant?: 'modal' | 'page';
  onClose?: () => void;
  onSubmitted?: (review: MyReview) => void;
}

export function ReviewPromptModal({
  isOpen = true,
  variant = 'modal',
  onClose,
  onSubmitted,
}: ReviewPromptModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isModal = variant === 'modal';
  const activeRating = hoverRating || rating;
  const trimmedLength = comment.trim().length;
  const canSubmit = rating >= 1 && trimmedLength >= 10 && trimmedLength <= 500 && !loading;

  useEffect(() => {
    if (!success || !isModal || !onClose) return;
    const timer = window.setTimeout(() => onClose(), 3000);
    return () => window.clearTimeout(timer);
  }, [success, isModal, onClose]);

  const containerClass = useMemo(() => {
    return isModal
      ? 'w-full max-w-md rounded-2xl border border-white/10 bg-[var(--bg-card)] shadow-2xl'
      : 'w-full rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] shadow-2xl';
  }, [isModal]);

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setError(null);

    try {
      const payload: CreateReviewDto = {
        rating,
        comment: comment.trim(),
      };

      const createdReview = await reviewsService.createReview(payload);
      setSuccess(true);
      onSubmitted?.(createdReview);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'No pudimos enviar tu opinión.');
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div className={containerClass}>
      <div className={`relative ${isModal ? 'p-6 sm:p-7' : 'p-6 md:p-8 lg:p-10'}`}>
        {isModal && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Cerrar modal de opinión"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FF5C3A]/10 text-[#FF5C3A]">
              <Heart className="h-8 w-8" />
            </div>
            <h2 className="font-jakarta text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              Gracias por compartir tu opinión
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--text-secondary)]">
              ¡Gracias! Tu review está en revisión. La publicaremos pronto.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[#FF5C3A]/20 bg-[#FF5C3A]/10 text-[#FF5C3A]">
                <Heart className="h-8 w-8" />
              </div>
              <h2 className="font-jakarta text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                ¿Cómo ha sido tu experiencia con Lookitry?
              </h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
                Llevas ya 3 días usando la plataforma. Tu opinión nos ayuda a mejorar y también ayuda a otras marcas a conocernos. Solo toma 1 minuto.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-center text-[11px] font-black uppercase tracking-[0.25em] text-[var(--text-muted)]">
                Tu calificación
              </p>
              <div className="flex items-center justify-center gap-2">
                {[1, 2, 3, 4, 5].map((value) => {
                  const filled = value <= activeRating;
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className="transition-transform hover:scale-110"
                      aria-label={`${value} estrellas`}
                    >
                      <Star className={`h-8 w-8 ${filled ? 'fill-[#FF5C3A] text-[#FF5C3A]' : 'text-white/25'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm font-semibold text-[var(--text-primary)]">
                  Cuéntanos tu experiencia
                </label>
                <span className={`text-xs ${trimmedLength > 500 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                  {trimmedLength}/500
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value.slice(0, 500))}
                rows={isModal ? 5 : 7}
                placeholder="Ej: El try-on virtual me ayudó a reducir las devoluciones..."
                className="w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[#FF5C3A]/50 focus:ring-2 focus:ring-[#FF5C3A]/20"
              />
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[#FF5C3A] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                Enviar mi opinión
              </button>
              {isModal && onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex min-h-[46px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white"
                >
                  Quizás más tarde
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isModal) return content;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm">
      {content}
    </div>
  );
}
