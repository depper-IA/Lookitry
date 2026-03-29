'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock, MessageSquare, ShieldAlert, Star } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { reviewsService } from '@/services/reviews.service';
import { ReviewPromptModal } from '@/components/dashboard/ReviewPromptModal';
import type { MyReview } from '@/types';

function ReviewStatusBadge({ status }: { status: MyReview['status'] }) {
  const config = {
    pending: {
      label: 'Pendiente de moderación',
      className: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    },
    approved: {
      label: 'Aprobada',
      className: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    },
    rejected: {
      label: 'Rechazada',
      className: 'border-red-500/20 bg-red-500/10 text-red-300',
    },
  } as const;

  const item = config[status];
  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

export default function DashboardReviewPage() {
  const { brand, refreshBrand } = useAuth();
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<MyReview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadReview = async () => {
      try {
        const data = await reviewsService.getMyReview();
        if (mounted) setReview(data);
      } catch (err: any) {
        if (mounted) {
          setError(err.response?.data?.message || 'No pudimos cargar tu opinión.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadReview();
    return () => {
      mounted = false;
    };
  }, []);

  if (brand?.plan === 'TRIAL') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-xl rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-[#FF5C3A]">
            <Lock className="h-8 w-8" />
          </div>
          <h1 className="font-jakarta text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Función disponible desde el plan BASIC
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--text-secondary)]">
            Las reviews están habilitadas para marcas con plan activo. Actualiza tu plan para compartir tu experiencia.
          </p>
          <Link
            href="/dashboard/subscription"
            className="mt-6 inline-flex min-h-[46px] items-center justify-center rounded-2xl bg-[#FF5C3A] px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-white transition-all hover:brightness-110"
          >
            Ver planes
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF5C3A]/20 border-t-[#FF5C3A]" />
      </div>
    );
  }

  if (error) {
    return <div className="rounded-[2rem] border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-300">{error}</div>;
  }

  if (!review) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF5C3A]">Mi opinión</p>
          <h1 className="mt-2 font-jakarta text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Cuéntanos cómo te ha ido con Lookitry
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Comparte tu experiencia. Tu review será revisada antes de publicarse.
          </p>
        </div>
        <ReviewPromptModal
          variant="page"
          onSubmitted={(createdReview) => {
            setReview(createdReview);
            refreshBrand();
          }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-[#FF5C3A]">Mi opinión</p>
          <h1 className="mt-2 font-jakarta text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            Tu review enviada
          </h1>
        </div>
        <ReviewStatusBadge status={review.status} />
      </div>

      <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 md:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center gap-4 border-b border-[var(--border-color)] pb-5">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <Star key={value} className={`h-5 w-5 ${value <= review.rating ? 'fill-[#FF5C3A] text-[#FF5C3A]' : 'text-white/15'}`} />
            ))}
          </div>
          <div className="text-sm text-[var(--text-secondary)]">
            Enviada el {new Date(review.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <blockquote className="mt-5 text-base leading-relaxed text-[var(--text-primary)]">
          “{review.comment}”
        </blockquote>

        <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-white/5 bg-[var(--bg-base)] p-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-[#FF5C3A]" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{review.reviewer_name}</p>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">{review.reviewer_plan}</p>
            </div>
          </div>

          {review.status === 'rejected' && (
            <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Tu review fue rechazada por moderación. Si deseas publicar una versión nueva, contáctanos y te ayudamos a revisarla.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
