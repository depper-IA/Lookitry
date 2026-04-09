import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import { AdminAuthRequest } from '../middleware/adminAuth';
import type {
  Brand,
  BrandReview,
  CreateReviewDto,
  PublicReview,
  ReviewStatus,
  UpdateReviewModerationDto,
} from '../types';

const REVIEWS_PER_PAGE = 10;

function isTrialBrand(brand: Pick<Brand, 'plan' | 'subscription_status'>): boolean {
  return brand.plan === 'TRIAL';
}

function parseRating(value: unknown): number | null {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 1 || parsed > 5 || parsed % 0.5 !== 0) return null;
  return parsed;
}

function normalizeComment(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const comment = value.trim();
  if (comment.length < 10 || comment.length > 500) return null;
  return comment;
}

function parseStatus(value: unknown): ReviewStatus | 'all' | null {
  if (value === undefined || value === null || value === '') return 'all';
  if (value === 'all' || value === 'pending' || value === 'approved' || value === 'rejected') return value;
  return null;
}

function parseSort(value: unknown): 'created_at_desc' | 'created_at_asc' | 'rating_desc' | 'rating_asc' {
  if (
    value === 'created_at_asc' ||
    value === 'rating_desc' ||
    value === 'rating_asc'
  ) {
    return value;
  }
  return 'created_at_desc';
}

async function getAuthenticatedBrand(brandId: string): Promise<Brand | null> {
  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('id, name, plan, logo, subscription_status, review_prompt_shown_at, subscription_start_date, trial_end_date')
    .eq('id', brandId)
    .single();

  if (error || !data) return null;
  return data as Brand;
}

export class ReviewsController {
  async createReview(req: AuthRequest, res: Response) {
    try {
      if (!req.brand?.id) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const payload = (req.body || {}) as CreateReviewDto;
      const rating = parseRating(payload.rating);
      const comment = normalizeComment(payload.comment);

      if (!rating) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El rating debe estar entre 1 y 5 estrellas.' });
      }

      if (!comment) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El comentario debe tener entre 10 y 500 caracteres.' });
      }

      const brand = await getAuthenticatedBrand(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada.' });
      }

      if (isTrialBrand(brand)) {
        return res.status(403).json({
          error: 'FORBIDDEN',
          message: 'Las reviews están disponibles a partir del plan BASIC. Actualiza tu plan para compartir tu opinión.',
        });
      }

      const { data, error } = await supabaseAdmin
        .from('brand_reviews')
        .insert({
          brand_id: brand.id,
          rating,
          comment,
          reviewer_name: brand.name,
          reviewer_plan: brand.plan,
          status: rating >= 4.5 ? 'approved' : 'pending',
          avatar_url: brand.logo || null,
        })
        .select('*')
        .single();

      if (error) {
        if ((error as any).code === '23505') {
          return res.status(409).json({
            error: 'CONFLICT',
            message: 'Ya enviaste una review. Solo se permite una por marca.',
          });
        }

        throw error;
      }

      await supabaseAdmin
        .from('brands')
        .update({ review_prompt_shown_at: new Date().toISOString() })
        .eq('id', brand.id);

      return res.status(201).json(data as BrandReview);
    } catch (error: any) {
      console.error('Error creando review:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al crear la review.' });
    }
  }

  async getMyReview(req: AuthRequest, res: Response) {
    try {
      if (!req.brand?.id) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const brand = await getAuthenticatedBrand(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada.' });
      }

      if (isTrialBrand(brand)) {
        return res.status(200).json(null);
      }

      const { data, error } = await supabaseAdmin
        .from('brand_reviews')
        .select('*')
        .eq('brand_id', brand.id)
        .maybeSingle();

      if (error) throw error;

      return res.status(200).json((data as BrandReview | null) ?? null);
    } catch (error: any) {
      console.error('Error obteniendo mi review:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener tu review.' });
    }
  }

  async markPrompted(req: AuthRequest, res: Response) {
    try {
      if (!req.brand?.id) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const brand = await getAuthenticatedBrand(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada.' });
      }

      if (isTrialBrand(brand)) {
        return res.status(200).json({ success: true });
      }

      await supabaseAdmin
        .from('brands')
        .update({ review_prompt_shown_at: new Date().toISOString() })
        .eq('id', brand.id);

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error marcando prompt review:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al marcar el prompt de review.' });
    }
  }

  async getPublicReviews(_req: AuthRequest, res: Response) {
    try {
      const countQuery = await supabaseAdmin
        .from('brand_reviews')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'approved');

      if (countQuery.error) throw countQuery.error;

      const { data, error } = await supabaseAdmin
        .from('brand_reviews')
        .select('id, rating, comment, reviewer_name, reviewer_plan, is_featured, created_at, avatar_url')
        .eq('status', 'approved')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return res.status(200).json({
        reviews: (data ?? []) as PublicReview[],
        total_approved: countQuery.count ?? 0,
      });
    } catch (error: any) {
      console.error('Error obteniendo reviews públicas:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener las reviews públicas.' });
    }
  }

  async listAdminReviews(req: AdminAuthRequest, res: Response) {
    try {
      const page = Math.max(1, Number(req.query.page) || 1);
      const limit = REVIEWS_PER_PAGE;
      const status = parseStatus(req.query.status);
      const ratingQuery = req.query.rating;
      const sort = parseSort(req.query.sort);
      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';

      if (!status) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Filtro de estado inválido.' });
      }

      const rating = ratingQuery === undefined || ratingQuery === 'all' || ratingQuery === ''
        ? null
        : parseRating(ratingQuery);

      if (ratingQuery !== undefined && ratingQuery !== 'all' && ratingQuery !== '' && rating === null) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Filtro de rating inválido.' });
      }

      let countBuilder = supabaseAdmin
        .from('brand_reviews')
        .select('id', { count: 'exact', head: true });

      let dataBuilder = supabaseAdmin
        .from('brand_reviews')
        .select('*');

      if (status !== 'all') {
        countBuilder = countBuilder.eq('status', status);
        dataBuilder = dataBuilder.eq('status', status);
      }

      if (rating !== null) {
        countBuilder = countBuilder.eq('rating', rating);
        dataBuilder = dataBuilder.eq('rating', rating);
      }

      if (search) {
        const pattern = `%${search}%`;
        countBuilder = countBuilder.or(`reviewer_name.ilike.${pattern},comment.ilike.${pattern}`);
        dataBuilder = dataBuilder.or(`reviewer_name.ilike.${pattern},comment.ilike.${pattern}`);
      }

      if (sort === 'created_at_asc') {
        dataBuilder = dataBuilder.order('created_at', { ascending: true });
      } else if (sort === 'rating_desc') {
        dataBuilder = dataBuilder.order('rating', { ascending: false }).order('created_at', { ascending: false });
      } else if (sort === 'rating_asc') {
        dataBuilder = dataBuilder.order('rating', { ascending: true }).order('created_at', { ascending: false });
      } else {
        dataBuilder = dataBuilder.order('created_at', { ascending: false });
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const [countResult, dataResult] = await Promise.all([
        countBuilder,
        dataBuilder.range(from, to),
      ]);

      if (countResult.error) throw countResult.error;
      if (dataResult.error) throw dataResult.error;

      const total = countResult.count ?? 0;
      const totalPages = Math.max(1, Math.ceil(total / limit));

      return res.status(200).json({
        reviews: (dataResult.data ?? []) as BrandReview[],
        total,
        page,
        totalPages,
      });
    } catch (error: any) {
      console.error('Error listando reviews admin:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al listar las reviews.' });
    }
  }

  async moderateReview(req: AdminAuthRequest, res: Response) {
    try {
      const reviewId = req.params.id;
      const body = (req.body || {}) as UpdateReviewModerationDto;
      const updates: Record<string, unknown> = {};

      if (body.status !== undefined) {
        if (body.status !== 'approved' && body.status !== 'rejected') {
          return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'El estado debe ser approved o rejected.' });
        }
        updates.status = body.status;
      }

      if (body.is_featured !== undefined) {
        if (typeof body.is_featured !== 'boolean') {
          return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'is_featured debe ser booleano.' });
        }
        updates.is_featured = body.is_featured;
      }

      if (body.admin_note !== undefined) {
        if (body.admin_note !== null && typeof body.admin_note !== 'string') {
          return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'admin_note debe ser texto.' });
        }
        updates.admin_note = body.admin_note?.trim() ? body.admin_note.trim() : null;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'No hay cambios para aplicar.' });
      }

      const { data: existing, error: existingError } = await supabaseAdmin
        .from('brand_reviews')
        .select('*')
        .eq('id', reviewId)
        .single();

      if (existingError || !existing) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Review no encontrada.' });
      }

      const finalStatus = (updates.status as ReviewStatus | undefined) ?? (existing as BrandReview).status;
      const finalFeatured = (updates.is_featured as boolean | undefined) ?? (existing as BrandReview).is_featured;

      if (finalFeatured && finalStatus !== 'approved') {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'Solo las reviews aprobadas pueden marcarse como destacadas.',
        });
      }

      updates.updated_at = new Date().toISOString();

      const { data, error } = await supabaseAdmin
        .from('brand_reviews')
        .update(updates)
        .eq('id', reviewId)
        .select('*')
        .single();

      if (error) throw error;

      return res.status(200).json(data as BrandReview);
    } catch (error: any) {
      console.error('Error moderando review:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al moderar la review.' });
    }
  }

  async deleteReview(req: AdminAuthRequest, res: Response) {
    try {
      const reviewId = req.params.id;

      const { data: existing, error: existingError } = await supabaseAdmin
        .from('brand_reviews')
        .select('id')
        .eq('id', reviewId)
        .single();

      if (existingError || !existing) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Review no encontrada.' });
      }

      const { error } = await supabaseAdmin
        .from('brand_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      return res.status(200).json({ success: true });
    } catch (error: any) {
      console.error('Error eliminando review:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al eliminar la review.' });
    }
  }
}

export const reviewsController = new ReviewsController();
