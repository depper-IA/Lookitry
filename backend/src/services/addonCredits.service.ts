import { supabaseAdmin } from '../config/supabase';
import { pricingService } from './pricing.service';
import { wompiService } from './wompi.service';
import { paypalService } from './paypal.service';
import { PaymentSettingsService } from './paymentSettings.service';

export type AddonGateway = 'wompi' | 'paypal';

export interface AddonPackage {
  id: string;
  name: string;
  credits_amount: number;
  price_cop: number;
  is_active: boolean;
}

export interface AddonCheckoutResult {
  gateway: AddonGateway;
  reference: string;
  checkoutUrl: string;
}

const paymentSettingsService = new PaymentSettingsService();

export class AddonCreditsService {
  private readonly DEFAULT_PACKAGE_ID = 'credits_500';

  isAddonReference(reference: string | null | undefined): boolean {
    return typeof reference === 'string' && reference.startsWith('ADDON-');
  }

  parseAddonReference(reference: string): { brandId: string; packageId: string } {
    const match = reference.match(/^ADDON-(.+)-PKG-([A-Za-z0-9_]+)-\d+$/);
    if (!match) {
      throw new Error(`Referencia de add-on inválida: ${reference}`);
    }

    return {
      brandId: match[1],
      packageId: match[2],
    };
  }

  buildAddonReference(brandId: string, packageId: string): string {
    return `ADDON-${brandId}-PKG-${packageId}-${Date.now()}`;
  }

  async getPackageById(packageId = this.DEFAULT_PACKAGE_ID): Promise<AddonPackage> {
    const { data, error } = await supabaseAdmin
      .from('addon_packages')
      .select('id, name, credits_amount, price_cop, is_active')
      .eq('id', packageId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      throw new Error('Paquete adicional no encontrado o inactivo');
    }

    return data as AddonPackage;
  }

  private async resolveGateway(preferredGateway?: string): Promise<AddonGateway> {
    if (preferredGateway === 'wompi' || preferredGateway === 'paypal') {
      return preferredGateway;
    }

    const settings = await paymentSettingsService.getSettings();
    if (settings.wompi_enabled) return 'wompi';
    if (settings.paypal_enabled) return 'paypal';

    throw new Error('No hay pasarelas habilitadas para comprar créditos extra');
  }

  async createCheckoutForBrand(
    brandId: string,
    preferredGateway?: string,
    packageId = this.DEFAULT_PACKAGE_ID
  ): Promise<AddonCheckoutResult> {
    const addonPackage = await this.getPackageById(packageId);
    const gateway = await this.resolveGateway(preferredGateway);
    const reference = this.buildAddonReference(brandId, addonPackage.id);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = `${frontendUrl}/dashboard/subscription?addon=success&ref=${reference}`;

    if (gateway === 'wompi') {
      const checkoutUrl = await wompiService.getCheckoutUrl(
        brandId,
        addonPackage.price_cop,
        returnUrl,
        false,
        0,
        'ADDON',
        reference
      );

      return { gateway, reference, checkoutUrl };
    }

    const { trm } = await pricingService.getEffectiveTrm();
    const createdOrder = await paypalService.createOrder(
      addonPackage.price_cop,
      trm,
      reference,
      returnUrl,
      `${frontendUrl}/dashboard/subscription?addon=cancelled`
    );

    await paypalService.recordOrder({
      reference,
      brand_id: brandId,
      email: null,
      plan: `ADDON:${addonPackage.id}`,
      months: 0,
      amount_cop: addonPackage.price_cop,
      trm,
      amount_usd_expected: createdOrder.amountUSD,
      order_id: createdOrder.orderId,
      status: 'created',
    });

    return {
      gateway,
      reference,
      checkoutUrl: createdOrder.checkoutUrl,
    };
  }

  async applyPurchasedCredits(
    reference: string,
    paymentMethod: AddonGateway,
    amount: number,
    transactionId: string
  ): Promise<void> {
    const { brandId, packageId } = this.parseAddonReference(reference);
    const addonPackage = await this.getPackageById(packageId);

    const { data: existingPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('id')
      .eq('reference', reference)
      .limit(1)
      .maybeSingle();

    if (existingPayment) {
      return;
    }

    const { data: brand } = await supabaseAdmin
      .from('brands')
      .select('id, extra_credits_balance')
      .eq('id', brandId)
      .single();

    if (!brand) {
      throw new Error('Marca no encontrada para aplicar créditos extra');
    }

    const newBalance = Number(brand.extra_credits_balance || 0) + Number(addonPackage.credits_amount || 0);

    const { error: brandUpdateError } = await supabaseAdmin
      .from('brands')
      .update({
        extra_credits_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('id', brandId);

    if (brandUpdateError) {
      throw new Error(`No se pudo actualizar extra_credits_balance: ${brandUpdateError.message}`);
    }

    const { error: paymentError } = await supabaseAdmin
      .from('subscription_payments')
      .insert({
        brand_id: brandId,
        amount,
        currency: paymentMethod === 'wompi' ? 'COP' : 'USD',
        payment_date: new Date().toISOString(),
        payment_method: paymentMethod,
        status: 'completed',
        months_paid: 0,
        reference,
        transaction_id: transactionId,
        notes: `Compra add-on ${addonPackage.id}. +${addonPackage.credits_amount} créditos extra.`,
      });

    if (paymentError) {
      throw new Error(`No se pudo registrar el pago del add-on: ${paymentError.message}`);
    }
  }
}

export const addonCreditsService = new AddonCreditsService();
