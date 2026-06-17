import { supabaseAdmin } from '../config/supabase';

import { Generation } from '../types';



export interface CreateGenerationDto {
  brand_id: string;
  product_id: string;
  selfie_url: string;
  input_fingerprint?: string | null;
  client_fingerprint?: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}


export interface UpdateGenerationDto {
  status?: 'PENDING' | 'SUCCESS' | 'FAILED';
  result_image_url?: string;
  selfie_url?: string;
  input_fingerprint?: string | null;
  error_message?: string;
  processing_time?: number;
  prompt_used?: string;
  engine_used?: 'vertex' | 'n8n';
}


export class GenerationsService {
  async createGeneration(data: CreateGenerationDto): Promise<Generation> {
    const query = supabaseAdmin
      .from('generations')
      .insert({
        brand_id: data.brand_id,
        product_id: data.product_id,
        selfie_url: data.selfie_url,
        input_fingerprint: data.input_fingerprint ?? null,
        client_fingerprint: data.client_fingerprint ?? null,
        status: data.status,
        generated_at: new Date().toISOString()
      })
      .select()
      .single();

    let { data: generation, error } = await query;

    if (error?.message?.includes('input_fingerprint')) {
      const fallback = await supabaseAdmin
        .from('generations')
        .insert({
          brand_id: data.brand_id,
          product_id: data.product_id,
          selfie_url: data.selfie_url,
          client_fingerprint: data.client_fingerprint ?? null,
          status: data.status,
          generated_at: new Date().toISOString()
        })
        .select()
        .single();

      generation = fallback.data;
      error = fallback.error;
    }

    if (error || !generation) {
      throw new Error('Error al crear registro de generación: ' + error?.message);
    }


    return generation as Generation;

  }



  async updateGeneration(generationId: string, updates: UpdateGenerationDto): Promise<Generation> {

    const { data, error } = await supabaseAdmin

      .from('generations')

      .update(updates)

      .eq('id', generationId)

      .select()

      .single();



    if (error || !data) {

      throw new Error('Error al actualizar generación: ' + error?.message);

    }



    return data as Generation;

  }



  async getGenerationById(generationId: string): Promise<Generation | null> {

    const { data, error } = await supabaseAdmin

      .from('generations')

      .select('*')

      .eq('id', generationId)

      .single();



    if (error || !data) return null;

    return data as Generation;

  }



  async getGenerationsByBrand(brandId: string, limit = 50, status?: string): Promise<(Generation & { has_feedback: boolean; feedback_types: string[]; feedback_count: number })[]> {
    let query = supabaseAdmin
      .from('generations')
      .select(`
        *,
        generation_feedback (
          id,
          error_type
        )
      `)
      .eq('brand_id', brandId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error('Error al obtener generaciones: ' + error.message);

    // Process feedback data to compute aggregated fields
    const result = (data || []).map((g: any) => {
      const feedbackList = g.generation_feedback || [];
      const uniqueErrorTypes = [...new Set(feedbackList
        .map((f: any) => f.error_type)
        .filter((t: string | null) => t !== null)
      )];

      return {
        ...g,
        has_feedback: feedbackList.length > 0,
        feedback_types: uniqueErrorTypes,
        feedback_count: feedbackList.length,
      };
    });

    return result;
  }

  async getSuccessfulGenerationByFingerprint(
    brandId: string,
    productId: string,
    inputFingerprint: string
  ): Promise<Generation | null> {
    const { data, error } = await supabaseAdmin
      .from('generations')
      .select('*')
      .eq('brand_id', brandId)
      .eq('product_id', productId)
      .eq('input_fingerprint', inputFingerprint)
      .eq('status', 'SUCCESS')
      .not('result_image_url', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error?.message?.includes('input_fingerprint')) {
      return null;
    }

    if (error || !data) return null;
    return data as Generation;
  }


  async deleteGeneration(generationId: string, brandId: string): Promise<void> {

    const { error } = await supabaseAdmin

      .from('generations')

      .delete()

      .eq('id', generationId)

      .eq('brand_id', brandId);



    if (error) throw new Error('Error al eliminar generación: ' + error.message);

  }



  async deleteGenerations(generationIds: string[], brandId: string): Promise<number> {

    const { data, error } = await supabaseAdmin

      .from('generations')

      .delete()

      .in('id', generationIds)

      .eq('brand_id', brandId)

      .select('id');



    if (error) throw new Error('Error al eliminar generaciones: ' + error.message);

    return data?.length ?? 0;

  }



  async countSuccessfulGenerationsThisMonth(brandId: string): Promise<number> {

    const currentMonth = this.getCurrentMonthRange();



    const { count, error } = await supabaseAdmin

      .from('generations')

      .select('*', { count: 'exact', head: true })

      .eq('brand_id', brandId)

      .eq('status', 'SUCCESS')

      .gte('generated_at', currentMonth.start.toISOString())

      .lte('generated_at', currentMonth.end.toISOString());



    if (error) throw new Error('Error al contar generaciones: ' + error.message);

    return count || 0;

  }



  private getCurrentMonthRange() {

    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    return { start, end };

  }


  /**
   * T-5: Purga imágenes generadas con más de 48h (Art. 10-B términos)
   * Marca result_image_url como '[EXPIRADO]' en la base de datos.
   */
  async purgeExpiredResultImages(limit = 100): Promise<number> {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    // Marca personal de Sam — nunca purgar sus generaciones (excepción manual)
    const EXEMPT_BRAND_ID = 'cf95f272-8de9-45e2-9290-d026312f2c31';
    const { data: expired, error } = await supabaseAdmin
      .from('generations')
      .select('id, result_image_url, brand_id')
      .eq('status', 'SUCCESS')
      .not('result_image_url', 'is', null)
      .not('result_image_url', 'like', '[%')
      .is('result_image_deleted_at', null)
      .lt('generated_at', cutoff)
      .neq('brand_id', EXEMPT_BRAND_ID)
      .limit(limit);

    if (error || !expired?.length) return 0;

    let purged = 0;

    for (const gen of expired) {
      const { error: updateError } = await supabaseAdmin
        .from('generations')
        .update({
          result_image_url: '[EXPIRADO]',
          result_image_deleted_at: new Date().toISOString(),
        })
        .eq('id', gen.id);

      if (!updateError) purged++;
    }

    return purged;
  }

  private _extractPathFromUrl(url: string): string | null {
    try {
      const u = new URL(url);
      const path = u.pathname;
      const segs = path.split('/').filter(Boolean);
      if (segs.length > 1) segs.shift();
      return segs.join('/') || null;
    } catch {
      return null;
    }
  }
}

