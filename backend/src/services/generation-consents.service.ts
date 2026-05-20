import { supabaseAdmin } from '../config/supabase';

export interface CreateGenerationConsentDto {
  generation_id: string;
  terms_accepted: boolean;
  user_ip?: string;
  user_agent?: string;
  terms_version?: string;
}

export interface GenerationConsent {
  id: string;
  generation_id: string;
  terms_accepted: boolean;
  accepted_at: string;
  user_ip?: string;
  user_agent?: string;
  terms_version: string;
  created_at: string;
}

export class GenerationConsentsService {
  async createConsent(data: CreateGenerationConsentDto): Promise<GenerationConsent> {
    const { data: consent, error } = await supabaseAdmin
      .from('generation_consents')
      .insert({
        generation_id: data.generation_id,
        terms_accepted: data.terms_accepted,
        user_ip: data.user_ip ?? null,
        user_agent: data.user_agent ?? null,
        terms_version: data.terms_version ?? '1.0',
      })
      .select()
      .single();

    if (error || !consent) {
      throw new Error('Error al guardar consentimiento: ' + error?.message);
    }

    return consent as GenerationConsent;
  }

  async getConsentByGenerationId(generationId: string): Promise<GenerationConsent | null> {
    const { data, error } = await supabaseAdmin
      .from('generation_consents')
      .select('*')
      .eq('generation_id', generationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw new Error('Error al obtener consentimiento: ' + error.message);
    }

    return data as GenerationConsent;
  }
}

export const generationConsentsService = new GenerationConsentsService();
