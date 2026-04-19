import { supabaseAdmin } from '../config/supabase';
import { pricingService } from './pricing.service';

export interface PaymentSettings {
  id?: string;
  // Precios de mini-landing
  landing_price: number;
  landing_original_price: number;
  // URL del footer de mini-landings
  footer_brand_url: string;
  // Wompi — sandbox (pruebas)
  wompi_enabled: boolean;
  wompi_public_key: string;
  wompi_private_key: string;
  wompi_events_secret: string;
  wompi_integrity_secret: string;
  wompi_test_mode: boolean;
  // Wompi — producción
  wompi_prod_public_key: string;
  wompi_prod_private_key: string;
  wompi_prod_events_secret: string;
  wompi_prod_integrity_secret: string;
  // PayPal
  paypal_enabled: boolean;
  paypal_email: string;
  paypal_client_id: string;
  paypal_client_secret: string;
  paypal_prod_client_id: string;
  paypal_prod_client_secret: string;
  paypal_sandbox: boolean;
  // Pago manual
  manual_enabled: boolean;
  manual_instructions: string;
  manual_bank_name: string;
  manual_account_number: string;
  manual_account_holder: string;
  manual_whatsapp: string;
  manual_email: string;
  // Transferencia bancaria
  transfer_enabled: boolean;
  transfer_bank_name: string;
  transfer_account_number: string;
  transfer_account_type: string;
  transfer_account_holder: string;
  transfer_nit: string;
  // General
  currency: string;
  // IA Prompting
  ai_prompt_master: string;
  ai_prompt_negative: string;
  // Modal Promocional Global
  modal_promo_config: any;
  modal_title: string;
  modal_description: string;
  modal_image_url: string;
  mini_landing_preview_seconds: number;
  // Pruebas y desarrollo
  bypass_ip_protection: boolean;
  ip_whitelist: string; // IPs separadas por coma que siempre pasan el check
  maintenance_mode: boolean;
  maintenance_message: string;
  // Analytics
  ga_measurement_id: string;
  updated_at?: string;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  landing_price: 650000,
  landing_original_price: 900000,
  footer_brand_url: 'https://lookitry.com',
  wompi_enabled: false,
  wompi_public_key: '',
  wompi_private_key: '',
  wompi_events_secret: '',
  wompi_integrity_secret: '',
  wompi_test_mode: true,
  wompi_prod_public_key: '',
  wompi_prod_private_key: '',
  wompi_prod_events_secret: '',
  wompi_prod_integrity_secret: '',
  paypal_enabled: false,
  paypal_email: '',
  paypal_client_id: '',
  paypal_client_secret: '',
  paypal_prod_client_id: '',
  paypal_prod_client_secret: '',
  paypal_sandbox: true,
  manual_enabled: true,
  manual_instructions: 'Realiza el pago y envía el comprobante por WhatsApp o email.',
  manual_bank_name: '',
  manual_account_number: '',
  manual_account_holder: '',
  manual_whatsapp: '',
  manual_email: 'info@lookitry.com',
  transfer_enabled: false,
  transfer_bank_name: '',
  transfer_account_number: '',
  transfer_account_type: 'Ahorros',
  transfer_account_holder: '',
  transfer_nit: '',
  currency: 'COP',
  ai_prompt_master: '',
  ai_prompt_negative: '',
  modal_promo_config: {},
  modal_title: '¡Oferta Especial!',
  modal_description: 'Obtén un descuento exclusivo registrándote hoy.',
  modal_image_url: '',
  mini_landing_preview_seconds: 15,
  bypass_ip_protection: false,
  ip_whitelist: '',
  maintenance_mode: false,
  maintenance_message: 'Estamos realizando mejoras en nuestra plataforma. Volveremos pronto.',
  ga_measurement_id: '',
};

export class PaymentSettingsService {
  private readonly TABLE = 'payment_settings';
  private readonly SINGLETON_ID = 1; // Solo hay una fila de configuración
  
  // Cache simple para evitar múltiples lecturas a la BD
  private cache: { data: PaymentSettings | null; timestamp: number } = {
    data: null,
    timestamp: 0
  };
  private readonly CACHE_TTL_MS = 10000; // 10 segundos

  async getSettings(): Promise<PaymentSettings> {
    // Verificar cache primero
    if (this.cache.data && (Date.now() - this.cache.timestamp) < this.CACHE_TTL_MS) {
      return this.cache.data;
    }
    
    const { data, error } = await supabaseAdmin
      .from(this.TABLE)
      .select('*')
      .eq('id', this.SINGLETON_ID)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

    this.cache = { data: data as PaymentSettings, timestamp: Date.now() };
    return data as PaymentSettings;
  }

  async updateSettings(settings: Partial<PaymentSettings>): Promise<PaymentSettings> {
    // Intentar actualizar primero
    const { data: existing } = await supabaseAdmin
      .from(this.TABLE)
      .select('id')
      .eq('id', this.SINGLETON_ID)
      .single();

    let result;

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from(this.TABLE)
        .update({ ...settings, updated_at: new Date().toISOString() })
        .eq('id', this.SINGLETON_ID)
        .select()
        .single();

      if (error) {
        console.error('[PaymentSettingsService] Error al actualizar Supabase:', error);
        throw new Error('Error al actualizar configuración: ' + error.message);
      }
      result = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from(this.TABLE)
        .insert({ id: this.SINGLETON_ID, ...DEFAULT_SETTINGS, ...settings, updated_at: new Date().toISOString() })
        .select()
        .single();

      if (error) throw new Error('Error al crear configuración: ' + error.message);
      result = data;
    }

    // Invalidar cache al actualizar
    this.cache.data = null;
    return result as PaymentSettings;
  }

  /**
   * Retorna solo los campos públicos seguros (sin claves privadas)
   * para exponer al frontend de la marca.
   * Si wompi_test_mode=false, expone la llave pública de producción.
   */
  async getPublicSettings(): Promise<{
    landingPrice: number;
    landingOriginalPrice: number;
    wompiEnabled: boolean;
    wompiPublicKey: string;
    wompiTestMode: boolean;
    paypalEnabled: boolean;
    paypalEmail: string;
    paypalSandbox: boolean;
    manualEnabled: boolean;
    manualInstructions: string;
    manualWhatsapp: string;
    manualEmail: string;
    socialInstagram: string;
    socialTiktok: string;
    socialFacebook: string;
    socialYoutube: string;
    transferEnabled: boolean;
    transferBankName: string;
    transferAccountNumber: string;
    transferAccountType: string;
    transferAccountHolder: string;
    currency: string;
    modalPromoConfig: any;
    modalTitle: string;
    modalDescription: string;
    modalImageUrl: string;
    miniLandingPreviewSeconds: number;
    maintenanceMode: boolean;
    maintenanceMessage: string;
    trm: number;
    gaMeasurementId: string;
  }> {
    const s = await this.getSettings();
    // En modo producción usar la llave pública de producción
    const wompiPublicKey = s.wompi_test_mode
      ? s.wompi_public_key
      : (s.wompi_prod_public_key || s.wompi_public_key);

    const { trm } = await pricingService.getEffectiveTrm();

    const { data: metaRow } = await supabaseAdmin
      .from('pricing_config')
      .select('data')
      .eq('id', 'meta')
      .maybeSingle();

    const meta = (metaRow?.data ?? {}) as Record<string, unknown>;

    return {
      landingPrice: s.landing_price ?? 650000,
      landingOriginalPrice: s.landing_original_price ?? 900000,
      wompiEnabled: s.wompi_enabled,
      wompiPublicKey,
      wompiTestMode: s.wompi_test_mode,
      paypalEnabled: s.paypal_enabled,
      paypalEmail: s.paypal_email,
      paypalSandbox: s.paypal_sandbox,
      manualEnabled: s.manual_enabled,
      manualInstructions: s.manual_instructions,
      manualWhatsapp: s.manual_whatsapp || '573105436281',
      manualEmail: s.manual_email || 'info@lookitry.com',
      socialInstagram: String(meta.social_instagram ?? 'https://instagram.com/looki.try'),
      socialTiktok: String(meta.social_tiktok ?? 'https://www.tiktok.com/@lookitry'),
      socialFacebook: String(meta.social_facebook ?? ''),
      socialYoutube: String(meta.social_youtube ?? ''),
      transferEnabled: s.transfer_enabled,
      transferBankName: s.transfer_bank_name,
      transferAccountNumber: s.transfer_account_number,
      transferAccountType: s.transfer_account_type,
      transferAccountHolder: s.transfer_account_holder,
      currency: s.currency,
      modalPromoConfig: s.modal_promo_config,
      modalTitle: s.modal_title,
      modalDescription: s.modal_description,
      modalImageUrl: s.modal_image_url,
      miniLandingPreviewSeconds: s.mini_landing_preview_seconds,
      maintenanceMode: s.maintenance_mode,
      maintenanceMessage: s.maintenance_message,
      trm,
      gaMeasurementId: s.ga_measurement_id || '',
    };
  }
}

