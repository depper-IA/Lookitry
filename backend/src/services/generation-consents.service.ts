import { supabaseAdmin } from '../config/supabase';

export type ConsentType = 'TERMS' | 'BIOMETRIC';

export interface CreateBiometricConsentDto {
  generation_id: string;
  consent_type: ConsentType;
  user_ip?: string;
  user_agent?: string;
  client_fingerprint?: string;
  product_id?: string;
  brand_id?: string;
  terms_version?: string;
  biometric_purpose?: string;
}

export interface BiometricConsent {
  id: string;
  generation_id: string;
  consent_type: ConsentType;
  accepted: boolean;
  accepted_at: string;
  user_ip?: string;
  user_agent?: string;
  client_fingerprint?: string;
  product_id?: string;
  brand_id?: string;
  terms_version: string;
  biometric_purpose: string;
  created_at: string;
}

// Propósito biométrico conforme Art. 10-C Ley 1581 de 2012
const BIOMETRIC_PURPOSE_DEFAULT = 'Procesamiento de imagen facial (selfie) para generación de resultado de probador virtual Lookitry. La imagen sera eliminada automaticamente tras la generación del resultado.';

/**
 * Servicio de consentimiento diferenciado para cumplimiento Ley 1581.
 *
 * Registra consentimiento de dos tipos:
 * - TERMS: aceptación de Términos y Condiciones generales
 * - BIOMETRIC: consentimiento expreso para procesamiento de datos biométricos (Art. 10-C)
 *
 * Cada generación puede tener hasta 2 registros (uno de cada tipo).
 * El consentimiento biométrico es independiente del consentimiento de términos.
 */
export class GenerationConsentsService {
  /**
   * Crea un registro de consentimiento.
   * Si ya existe un registro del mismo tipo para la generación, lo actualiza.
   */
  async createConsent(data: CreateBiometricConsentDto): Promise<BiometricConsent> {
    const payload = {
      generation_id: data.generation_id,
      consent_type: data.consent_type,
      accepted: true,
      user_ip: data.user_ip ?? null,
      user_agent: data.user_agent ?? null,
      client_fingerprint: data.client_fingerprint ?? null,
      product_id: data.product_id ?? null,
      brand_id: data.brand_id ?? null,
      terms_version: data.terms_version ?? '1.0',
      biometric_purpose: data.consent_type === 'BIOMETRIC'
        ? (data.biometric_purpose ?? BIOMETRIC_PURPOSE_DEFAULT)
        : null,
    };

    const { data: consent, error } = await supabaseAdmin
      .from('biometric_consents')
      .upsert(payload, { onConflict: 'generation_id,consent_type' })
      .select()
      .single();

    if (error || !consent) {
      throw new Error('Error al guardar consentimiento: ' + error?.message);
    }

    return consent as BiometricConsent;
  }

  /**
   * Crea consentimiento de TÉRMINOS para una generación.
   */
  async createTermsConsent(data: {
    generation_id: string;
    user_ip?: string;
    user_agent?: string;
    client_fingerprint?: string;
    product_id?: string;
    brand_id?: string;
    terms_version?: string;
  }): Promise<BiometricConsent> {
    return this.createConsent({ ...data, consent_type: 'TERMS' });
  }

  /**
   * Crea consentimiento BIOMÉTRICO para una generación.
   * Este es el requerido por Art. 10-C de la Ley 1581 de 2012.
   */
  async createBiometricConsent(data: {
    generation_id: string;
    user_ip?: string;
    user_agent?: string;
    client_fingerprint?: string;
    product_id?: string;
    brand_id?: string;
    purpose?: string;
  }): Promise<BiometricConsent> {
    return this.createConsent({ ...data, consent_type: 'BIOMETRIC' });
  }

  /**
   * Obtiene todos los consents para una generación.
   */
  async getConsentsByGenerationId(generationId: string): Promise<BiometricConsent[]> {
    const { data, error } = await supabaseAdmin
      .from('biometric_consents')
      .select('*')
      .eq('generation_id', generationId)
      .order('consent_type');

    if (error) {
      throw new Error('Error al obtener consentimientos: ' + error.message);
    }

    return (data || []) as BiometricConsent[];
  }

  /**
   * Obtiene el consentimiento biométrico para una generación.
   */
  async getBiometricConsent(generationId: string): Promise<BiometricConsent | null> {
    const { data, error } = await supabaseAdmin
      .from('biometric_consents')
      .select('*')
      .eq('generation_id', generationId)
      .eq('consent_type', 'BIOMETRIC')
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error('Error al obtener consentimiento biométrico: ' + error.message);
    }

    return data as BiometricConsent;
  }

  /**
   * Verifica si existe consentimiento biométrico para una generación.
   * Retorna true si existe, false si no.
   * Soft validation: no lanza error, solo retorna.
   */
  async hasBiometricConsent(generationId: string): Promise<boolean> {
    const consent = await this.getBiometricConsent(generationId);
    return consent !== null && consent.accepted === true;
  }

  /**
   * Obtiene estadísticas de consentimientos por marca (para auditoría).
   */
  async getConsentStatsByBrand(
    brandId: string,
    fromDate?: string,
    toDate?: string
  ): Promise<{ terms_count: number; biometric_count: number; total_generations: number }> {
    let query = supabaseAdmin
      .from('biometric_consents')
      .select('consent_type', { count: 'exact', head: true });

    if (brandId) query = query.eq('brand_id', brandId);
    if (fromDate) query = query.gte('accepted_at', fromDate);
    if (toDate) query = query.lte('accepted_at', toDate);

    const { data, error } = await query;

    if (error) {
      throw new Error('Error al obtener estadísticas de consentimientos: ' + error.message);
    }

    const termsCount = (data || []).filter(c => c.consent_type === 'TERMS').length;
    const biometricCount = (data || []).filter(c => c.consent_type === 'BIOMETRIC').length;

    return {
      terms_count: termsCount,
      biometric_count: biometricCount,
      total_generations: Math.max(termsCount, biometricCount),
    };
  }
}

export const generationConsentsService = new GenerationConsentsService();
