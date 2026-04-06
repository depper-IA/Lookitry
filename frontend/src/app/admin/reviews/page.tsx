'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Search, Star, Trash2, X, MessageSquare } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import type { AdminReview } from '@/types';
import { motion } from 'framer-motion';

type StatusFilter = 'all' | 'pending' | 'approved' | 'rejected';
type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5';
type SortFilter = 'created_at_desc' | 'created_at_asc' | 'rating_desc' | 'rating_asc';
type ToastState = { message: string; type: 'success' | 'error' } | null;

interface ModerateModalState {
  review: AdminReview;
  action: 'approved' | 'rejected';
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

function buildQuery(searchParams: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(searchParams.toString());
  if (!params.get('page')) params.set('page', '1');
  if (!params.get('status')) params.set('status', 'all');
  if (!params.get('rating')) params.set('rating', 'all');
  if (!params.get('sort')) params.set('sort', 'created_at_desc');
  if (!params.get('limit')) params.set('limit', '10');
  return params;
}

function StatusBadge({ status }: { status: AdminReview['status'] }) {
  const config = {
    pending: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
    approved: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
    rejected: 'border-red-500/20 bg-red-500/10 text-red-300',
  } as const;

  const label = {
    pending: 'Pendiente',
    approved: 'Aprobada',
    rejected: 'Rechazada',
  } as const;

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${config[status]}`}>{label[status]}</span>;
}

function Toast({ toast, onClose }: { toast: Exclude<ToastState, null>; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3200);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 rounded-2xl border px-4 py-3 text-sm text-white shadow-2xl backdrop-blur-sm ${toast.type === 'success' ? 'border-emerald-500/20 bg-emerald-600/90' : 'border-red-500/20 bg-red-600/90'}`}>
      {toast.message}
    </div>
  );
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useMemo(() => buildQuery(new URLSearchParams(searchParams.toString())), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState<ToastState>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminReview | null>(null);
  const [moderateTarget, setModerateTarget] = useState<ModerateModalState | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '');

  useEffect(() => {
    setSearchDraft(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/reviews?${params.toString()}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No pudimos cargar las reviews.');
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
      setPage(data.page || 1);
      setTotalPages(data.totalPages || 1);
    } catch (error: any) {
      setToast({ message: error.message || 'Error al cargar reviews.', type: 'error' });
      setReviews([]);
      setTotal(0);
      setPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [params.toString()]);

  const updateParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (!value || value === 'all' || (key === 'page' && value === '1')) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    });

    if (!updates.page) {
      next.delete('page');
    }

    router.push(`/admin/reviews${next.toString() ? `?${next.toString()}` : ''}`);
  };

  const hasActiveFilters = Boolean(searchParams.get('search') || searchParams.get('status') || searchParams.get('rating') || searchParams.get('sort') || searchParams.get('page'));
  const currentStatus = (params.get('status') as StatusFilter) || 'all';
  const currentRating = (params.get('rating') as RatingFilter) || 'all';
  const currentSort = (params.get('sort') as SortFilter) || 'created_at_desc';

  const showingFrom = total === 0 ? 0 : (page - 1) * 10 + 1;
  const showingTo = total === 0 ? 0 : Math.min(page * 10, total);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ search: searchDraft.trim() || null, page: '1' });
  };

  const handleModerate = async () => {
    if (!moderateTarget) return;
    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE}/api/admin/reviews/${moderateTarget.review.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: moderateTarget.action,
          admin_note: adminNote.trim() || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No pudimos actualizar la review.');
      setToast({ message: moderateTarget.action === 'approved' ? 'Review aprobada correctamente.' : 'Review rechazada correctamente.', type: 'success' });
      setModerateTarget(null);
      setAdminNote('');
      fetchReviews();
    } catch (error: any) {
      setToast({ message: error.message || 'Error al moderar la review.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleFeatured = async (review: AdminReview) => {
    try {
      const response = await fetch(`${API_BASE}/api/admin/reviews/${review.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !review.is_featured }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No pudimos actualizar la review.');
      setToast({ message: review.is_featured ? 'Review removida de destacadas.' : 'Review marcada como destacada.', type: 'success' });
      fetchReviews();
    } catch (error: any) {
      setToast({ message: error.message || 'Error al actualizar destacada.', type: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/admin/reviews/${deleteTarget.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No pudimos eliminar la review.');
      setToast({ message: 'Review eliminada correctamente.', type: 'success' });
      setDeleteTarget(null);
      fetchReviews();
    } catch (error: any) {
      setToast({ message: error.message || 'Error al eliminar la review.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-6"
    >
      <div>
        <h1 className="font-jakarta text-2xl font-bold tracking-tight text-[var(--text-primary)]">Moderación de Reviews</h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">Gestiona publicaciones, destacadas y limpieza de reseñas del sistema.</p>
      </div>

      <div className="rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Buscar por marca o comentario"
              className="w-full rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] py-3 pl-11 pr-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20"
            />
          </form>

          <select
            value={currentStatus}
            onChange={(event) => updateParams({ status: event.target.value, page: '1' })}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>

          <select
            value={currentRating}
            onChange={(event) => updateParams({ rating: event.target.value, page: '1' })}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="all">Todas las estrellas</option>
            <option value="5">5 ★</option>
            <option value="4">4 ★</option>
            <option value="3">3 ★</option>
            <option value="2">2 ★</option>
            <option value="1">1 ★</option>
          </select>

          <select
            value={currentSort}
            onChange={(event) => updateParams({ sort: event.target.value, page: '1' })}
            className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none"
          >
            <option value="created_at_desc">Más recientes</option>
            <option value="created_at_asc">Más antiguas</option>
            <option value="rating_desc">Mayor rating</option>
            <option value="rating_asc">Menor rating</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft('');
                router.push('/admin/reviews');
              }}
              className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-sm">
            <thead className="border-b border-[var(--border-color)] bg-[var(--bg-base)] text-left">
              <tr>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Marca</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Plan</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Rating</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Comentario</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Estado</th>
                <th className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Fecha</th>
                <th className="px-5 py-4 text-center text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-[var(--text-secondary)]">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[var(--accent)]/20 border-t-[var(--accent)]" />
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/5 text-[var(--accent)]">
                        <MessageSquare className="h-7 w-7" />
                      </div>
                      <p className="text-base font-semibold text-[var(--text-primary)]">No hay reviews que coincidan con los filtros.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="border-t border-[var(--border-color)]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[var(--text-primary)]">{review.reviewer_name}</div>
                    </td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">{review.reviewer_plan}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((__, index) => (
                          <Star key={`${review.id}-star-${index}`} className={`h-4 w-4 ${index < review.rating ? 'fill-[var(--accent)] text-[var(--accent)]' : 'text-white/15'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="max-w-[340px] px-5 py-4 text-[var(--text-secondary)]" title={review.comment}>
                      {review.comment.length > 80 ? `${review.comment.slice(0, 80)}...` : review.comment}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={review.status} />
                    </td>
                    <td className="px-5 py-4 text-[var(--text-secondary)]">
                      {new Date(review.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {review.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminNote(review.admin_note || '');
                              setModerateTarget({ review, action: 'approved' });
                            }}
                            className="rounded-xl bg-emerald-500/10 p-2 text-emerald-400 transition-colors hover:bg-emerald-500/20"
                            title="Aprobar review"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                        {review.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => {
                              setAdminNote(review.admin_note || '');
                              setModerateTarget({ review, action: 'rejected' });
                            }}
                            className="rounded-xl bg-red-500/10 p-2 text-red-400 transition-colors hover:bg-red-500/20"
                            title="Rechazar review"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(review)}
                          disabled={review.status !== 'approved'}
                          className={`rounded-xl p-2 transition-colors ${review.status !== 'approved' ? 'cursor-not-allowed bg-white/5 text-white/20' : review.is_featured ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' : 'bg-white/5 text-amber-300 hover:bg-white/10'}`}
                          title={review.is_featured ? 'Quitar destacada' : 'Marcar destacada'}
                        >
                          <Star className={`h-4 w-4 ${review.is_featured ? 'fill-current' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(review)}
                          className="rounded-xl bg-white/5 p-2 text-[var(--text-secondary)] transition-colors hover:bg-white/10 hover:text-white"
                          title="Eliminar review"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-4 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          Mostrando {showingFrom} - {showingTo} de {total} reviews
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateParams({ page: String(Math.max(1, page - 1)) })}
            disabled={page <= 1}
            className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Anterior
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).slice(Math.max(0, page - 3), Math.max(0, page - 3) + 5).map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              onClick={() => updateParams({ page: String(pageNumber) })}
              className={`rounded-xl px-3 py-2 text-sm transition-colors ${pageNumber === page ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            onClick={() => updateParams({ page: String(Math.min(totalPages, page + 1)) })}
            disabled={page >= totalPages}
            className="rounded-xl border border-[var(--border-color)] px-3 py-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>

      {moderateTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-jakarta text-xl font-bold tracking-tight text-[var(--text-primary)]">
                  {moderateTarget.action === 'approved' ? 'Aprobar review' : 'Rechazar review'}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">{moderateTarget.review.reviewer_name}</p>
              </div>
              <button type="button" onClick={() => setModerateTarget(null)} className="rounded-full p-2 text-[var(--text-muted)] transition-colors hover:bg-white/5 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-white/5 bg-[var(--bg-base)] p-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
                &ldquo;{moderateTarget.review.comment}&rdquo;
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-[var(--text-primary)]">Nota interna opcional</label>
                <textarea
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-[var(--border-color)] bg-[var(--bg-base)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]/50 focus:ring-2 focus:ring-[var(--accent)]/20"
                  placeholder="Añade contexto interno para el equipo admin"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button type="button" onClick={() => setModerateTarget(null)} className="rounded-2xl border border-[var(--border-color)] px-4 py-3 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:text-white">
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleModerate}
                disabled={submitting}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold text-white ${moderateTarget.action === 'approved' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
              >
                {submitting ? 'Guardando...' : moderateTarget.action === 'approved' ? 'Confirmar aprobación' : 'Confirmar rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Eliminar review"
        message={deleteTarget ? `Eliminarás permanentemente la review de ${deleteTarget.reviewer_name}. Esta acción no se puede deshacer.` : ''}
        confirmLabel={submitting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        variant="danger"
        isLoading={submitting}
      />

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </motion.div>
  );
}
