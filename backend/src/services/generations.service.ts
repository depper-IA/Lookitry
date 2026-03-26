import { supabaseAdmin } from '../config/supabase';
import { Generation } from '../types';

export interface CreateGenerationDto {
  brand_id: string;
  product_id: string;
  selfie_url: string;
  input_fingerprint?: string | null;
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
}

export class GenerationsService {
  async createGeneration(data: CreateGenerationDto): Promise<Generation> {
    let query = supabaseAdmin
      .from('generations')
      .insert({
        brand_id: data.brand_id,
        product_id: data.product_id,
        selfie_url: data.selfie_url,
        input_fingerprint: data.input_fingerprint ?? null,
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

  async getGenerationsByBrand(brandId: string, limit = 50, status?: string): Promise<Generation[]> {
    let query = supabaseAdmin
      .from('generations')
      .select('*')
      .eq('brand_id', brandId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error('Error al obtener generaciones: ' + error.message);
    return (data || []) as Generation[];
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
}
