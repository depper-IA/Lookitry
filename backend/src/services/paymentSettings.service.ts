import { supabaseAdmin } from '../config/supabase';

export interface PaymentSettings {
  id?: string;
  // Wompi
  wompi_enabled: boolean;
  wompi_public_key: string;
  wompi_private_key: string;
  wompi_events_secret: string;
  wompi_integrity_secret: string;
  wompi_test_mode: boolean;
  // PayPal
  paypal_enabled: boolean;
  paypal_email: string;
  paypal_client_id: string;
  paypal_client_secret: string;
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
  updated_at?: string;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  wompi_enabled: false,
  wompi_public_key: '',
  wompi_private_key: '',
  wompi_events_secret: '',
  wompi_integrity_secret: '',
  wompi_test_mode: true,
  paypal_enabled: false,
  paypal_email: '',
  paypal_client_id: '',
  paypal_client_secret: '',
  paypal_sandbox: true,
  manual_enabled: true,
  manual_instructions: 'Realiza el pago y envía el comprobante por WhatsApp o email.',
  manual_bank_name: '',
  manual_account_number: '',
  manual_account_holder: '',
  manual_whatsapp: '',
  manual_email: '',
  transfer_enabled: false,
  transfer_bank_name: '',
  transfer_account_number: '',
  transfer_account_type: 'Ahorros',
  transfer_account_holder: '',
  transfer_nit: '',
  currency: 'COP',
};

export class PaymentSettingsService {
  private readonly TABLE = 'payment_settings';
  private readonly SINGLETON_ID = 1; // Solo hay una fila de configuración

  async getSettings(): Promise<PaymentSettings> {
    const { data, error } = await supabaseAdmin
      .from(this.TABLE)
      .select('*')
      .eq('id', this.SINGLETON_ID)
      .single();

    if (error || !data) {
      return DEFAULT_SETTINGS;
    }

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

      if (error) throw new Error('Error al actualizar configuración: ' + error.message);
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

    return result as PaymentSettings;
  }

  /**
   * Retorna solo los campos públicos seguros (sin claves privadas)
   * para exponer al frontend de la marca
   */
  async getPublicSettings(): Promise<{
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
    transferEnabled: boolean;
    transferBankName: string;
    transferAccountNumber: string;
    transferAccountType: string;
    transferAccountHolder: string;
    currency: string;
  }> {
    const s = await this.getSettings();
    return {
      wompiEnabled: s.wompi_enabled,
      wompiPublicKey: s.wompi_public_key,
      wompiTestMode: s.wompi_test_mode,
      paypalEnabled: s.paypal_enabled,
      paypalEmail: s.paypal_email,
      paypalSandbox: s.paypal_sandbox,
      manualEnabled: s.manual_enabled,
      manualInstructions: s.manual_instructions,
      manualWhatsapp: s.manual_whatsapp,
      manualEmail: s.manual_email,
      transferEnabled: s.transfer_enabled,
      transferBankName: s.transfer_bank_name,
      transferAccountNumber: s.transfer_account_number,
      transferAccountType: s.transfer_account_type,
      transferAccountHolder: s.transfer_account_holder,
      currency: s.currency,
    };
  }
}
