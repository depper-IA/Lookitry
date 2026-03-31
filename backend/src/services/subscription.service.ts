import { supabaseAdmin } from '../config/supabase';
import { Brand, SubscriptionPayment, CreatePaymentDto } from '../types';
import { PaymentSettingsService } from './paymentSettings.service';
import { getReportingTrm, normalizePaymentRecordToCop } from '../utils/paymentNormalization';
import {
  attachLedgerSnapshotToNotes,
  parseLedgerSnapshotFromNotes,
  type PaymentLedgerSnapshot,
} from '../utils/paymentLedger';
import { hasActivePaidSubscription, isTrialOperationalBrand, recordTrialEvent } from '../utils/brandLifecycle';
import { pricingService } from './pricing.service';

/**
 * SubscriptionService
 *
 * Servicio para gestionar suscripciones de marcas.
 * Maneja verificación de estado, renovaciones, suspensiones y cálculos de fechas.
 */
export class SubscriptionService {
  private async insertPaymentCompat(payload: Record<string, unknown>): Promise<SubscriptionPayment> {
    const { data, error } = await supabaseAdmin
      .from('subscription_payments')
      .insert(payload)
      .select()
      .single();

    if (!error && data) {
      return data as SubscriptionPayment;
    }

    if (error?.message?.toLowerCase().includes('reference') && 'reference' in payload) {
      const fallbackPayload = Object.fromEntries(
        Object.entries(payload as Record<string, unknown>).filter(([key]) => key !== 'reference')
      );
      const retry = await supabaseAdmin
        .from('subscription_payments')
        .insert(fallbackPayload)
        .select()
        .single();

      if (retry.error || !retry.data) {
        throw new Error('Error al registrar el pago: ' + retry.error?.message);
      }

      return retry.data as SubscriptionPayment;
    }

    throw new Error('Error al registrar el pago: ' + error?.message);
  }

  async checkSubscriptionStatus(brandId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('plan, subscription_status, trial_end_date, trial_payment_status')
      .eq('id', brandId)
      .single();

    if (error || !data) return false;
    if (isTrialOperationalBrand(data)) return true;

    if (
      data.subscription_status === 'active' ||
      data.subscription_status === 'expiring_soon' ||
      (data.plan !== 'TRIAL' && data.subscription_status == null)
    ) {
      return true;
    }

    if ((data.plan === 'TRIAL' || data.trial_payment_status === 'active') && data.trial_end_date) {
      const trialEnd = new Date(data.trial_end_date);
      if (trialEnd > new Date()) return true;
    }

    return false;
  }

  async isInTrial(brandId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('plan, trial_end_date, subscription_status, trial_payment_status')
      .eq('id', brandId)
      .single();

    if (error || !data || !data.trial_end_date) return false;
    return isTrialOperationalBrand(data);
  }

  async getTrialDaysRemaining(brandId: string): Promise<number | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('plan, trial_end_date, trial_payment_status, subscription_status')
      .eq('id', brandId)
      .single();

    if (error || !data || !data.trial_end_date || !isTrialOperationalBrand(data)) return null;

    const trialEnd = new Date(data.trial_end_date);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  calculateExpirationDate(startDate: Date, months: number = 1): Date {
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + 30 * months);
    return expirationDate;
  }

  async renewSubscription(
    brandId: string,
    paymentData: CreatePaymentDto,
    months: number = 1,
    plan?: string,
    isUpgrade: boolean = false
  ): Promise<Brand> {
    if (![1, 3, 6, 12].includes(months)) {
      throw new Error('Los períodos permitidos son 1, 3, 6 o 12 meses');
    }

    if (paymentData.reference) {
      try {
        const { data: existingPayment } = await supabaseAdmin
          .from('subscription_payments')
          .select('id')
          .eq('reference', paymentData.reference)
          .limit(1)
          .maybeSingle();

        if (existingPayment) {
          const { data: currentBrand } = await supabaseAdmin
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .single();
          if (currentBrand) return currentBrand as Brand;
        }
      } catch (e) {
        console.warn('[Subscription] Idempotency check failed:', e);
      }
    }

    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) throw new Error('Marca no encontrada');

    const now = new Date();
    const hadActiveTrial = isTrialOperationalBrand(brand);
    const previousPlan = brand.plan ?? 'BASIC';
    
    const newStartDate = isUpgrade
      ? now
      : brand.subscription_end_date && new Date(brand.subscription_end_date) > now
        ? new Date(brand.subscription_end_date)
        : now;

    const newEndDate = this.calculateExpirationDate(newStartDate, months);

    const updateData: Record<string, unknown> = {
      subscription_start_date: newStartDate.toISOString(),
      subscription_end_date: newEndDate.toISOString(),
      subscription_status: 'active',
      last_payment_date: paymentData.payment_date || now.toISOString(),
      next_payment_date: newEndDate.toISOString(),
    };

    if (plan && ['BASIC', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(plan.toUpperCase())) {
      const planUpper = plan.toUpperCase();
      updateData.plan = planUpper;

      if (planUpper === 'TRIAL') {
        const nowIso = new Date().toISOString();
        const { data: campaign } = await supabaseAdmin
          .from('trial_campaigns')
          .select('trial_days')
          .eq('active', true)
          .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const trialDays = campaign?.trial_days ?? 7;
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);

        updateData.trial_end_date = trialEndDate.toISOString();
        updateData.trial_payment_status = 'active';
        updateData.subscription_status = 'active';
        updateData.subscription_start_date = now.toISOString();
        updateData.subscription_end_date = trialEndDate.toISOString();
        updateData.next_payment_date = trialEndDate.toISOString();
      } else {
        updateData.trial_end_date = null;
        updateData.trial_payment_status = null;
      }
    }

    if (brand.landing_suspended_at) {
      const diasSuspendida = (Date.now() - new Date(brand.landing_suspended_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diasSuspendida < 90) {
        updateData.has_landing_page = true;
        updateData.landing_suspended_at = null;
      }
    }

    const { data: updatedBrand, error: updateError } = await supabaseAdmin
      .from('brands')
      .update(updateData)
      .eq('id', brandId)
      .select()
      .single();

    if (updateError || !updatedBrand) throw new Error('Error al renovar: ' + updateError?.message);

    const planPurchased = String((plan || updatedBrand.plan || brand.plan || 'BASIC')).toUpperCase();
    const includesLanding = String(paymentData.notes || '').toUpperCase().includes('LANDING');
    const billingType = (paymentData.payment_method === 'credit_proration' || isUpgrade) ? 'upgrade' : 
                         (includesLanding && Number(paymentData.months_paid || months || 0) === 0) ? 'landing' : 'subscription';

    const ledgerSnapshot: PaymentLedgerSnapshot = {
      version: 1,
      brandId: brand.id,
      brandName: brand.name || null,
      brandEmail: brand.email || null,
      brandSlug: brand.slug || null,
      planPurchased,
      billingType,
      includesLanding,
      brandPlanBefore: previousPlan,
      brandPlanAfter: updatedBrand.plan || previousPlan,
    };

    await this.createPaymentRecord({
      ...paymentData,
      brand_id: brandId,
      payment_date: paymentData.payment_date || now.toISOString(),
      status: paymentData.status || 'completed',
      ledger_snapshot: ledgerSnapshot,
    });

    if (hadActiveTrial && ['BASIC', 'PRO', 'ENTERPRISE'].includes(planPurchased)) {
      await recordTrialEvent(brandId, 'trial_converted', { planPurchased }).catch(() => {});
    }

    return updatedBrand as Brand;
  }

  async calculateUpgradeProration(
    brandId: string,
    newPlan: string,
    newMonths: number,
    newPlanTotal: number,
    currentPlanPriceTotalFallback: number
  ): Promise<any> {
    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .select('subscription_end_date, subscription_start_date, subscription_status, trial_end_date, plan')
      .eq('id', brandId)
      .single();

    if (error || !brand) throw new Error('Marca no encontrada');

    const basePlanTotal = Math.round(newPlanTotal);

    if (!hasActivePaidSubscription(brand)) {
      const newEndDate = this.calculateExpirationDate(new Date(), newMonths);
      return {
        daysRemaining: 0,
        basePlanTotal,
        creditAmount: 0,
        newPlanTotal: basePlanTotal,
        amountToPay: basePlanTotal,
        remainingCredit: 0,
        newEndDate: newEndDate.toISOString(),
        isFree: false,
        creditLabel: 'Sin credito disponible',
      };
    }

    const now = new Date();
    const endDate = brand.subscription_end_date ? new Date(brand.subscription_end_date) : now;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    const { data: lastPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('amount, currency, months_paid, notes')
      .eq('brand_id', brandId)
      .eq('status', 'completed')
      .gt('months_paid', 0)
      .neq('payment_method', 'credit_proration')
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentMonths = lastPayment?.months_paid || Math.max(1, Math.round(Math.max(30, (endDate.getTime() - (brand.subscription_start_date ? new Date(brand.subscription_start_date).getTime() : now.getTime())) / (1000 * 60 * 60 * 24)) / 30));
    const totalDays = Math.max(1, 30 * paymentMonths);
    const effectiveDaysRemaining = Math.min(daysRemaining, totalDays);

    let currentPlanPriceTotal: number;
    const rawAmount = lastPayment?.amount ? (typeof lastPayment.amount === 'string' ? parseFloat(lastPayment.amount) : lastPayment.amount) : 0;

    if (rawAmount > 0 && lastPayment?.months_paid && lastPayment.months_paid > 0) {
      const currency = String(lastPayment.currency || 'COP').toUpperCase();

      if (currency !== 'COP') {
        const { trm } = await pricingService.getEffectiveTrm();
        currentPlanPriceTotal = Math.round(rawAmount * trm);
        console.log(`[Proration] Convertido monto de lastPayment: ${rawAmount} ${currency} -> ${currentPlanPriceTotal} COP (TRM: ${trm})`);
      } else {
        currentPlanPriceTotal = rawAmount;
        console.log(`[Proration] Usando monto de lastPayment en COP: ${currentPlanPriceTotal}`);
      }
    } else {
      // No hay pago real anterior (trial, pago $0, etc) — calcular precio de plan actual desde config
      const currentPlanKey = String(brand.plan || 'BASIC').toUpperCase();
      currentPlanPriceTotal = currentPlanPriceTotalFallback > 0
        ? currentPlanPriceTotalFallback
        : await pricingService.calculateTotal(currentPlanKey, paymentMonths, false);
      console.log(`[Proration] Sin pago anterior valido. Usando precio de config para ${currentPlanKey} x ${paymentMonths} meses: ${currentPlanPriceTotal}`);
    }


    const lastSnapshot = parseLedgerSnapshotFromNotes(lastPayment?.notes);
    if (lastSnapshot?.includesLanding || String(lastPayment?.notes || '').includes('Incluye Landing Page')) {
      try {
        const settings = await new PaymentSettingsService().getSettings();
        const landingPrice = settings.landing_price || 650000;
        currentPlanPriceTotal = Math.max(0, currentPlanPriceTotal - landingPrice);
        console.log(`[Proration] Ajustado monto por landing page: -${landingPrice}`);
      } catch (e) {
        console.error('[Proration] Error al obtener precio de landing para ajuste:', e);
      }
    }

    const pricePerDay = currentPlanPriceTotal / totalDays;
    const creditAmount = Math.max(0, Math.round(pricePerDay * effectiveDaysRemaining));
    const amountToPay = Math.max(0, basePlanTotal - creditAmount);
    const remainingCredit = Math.max(0, creditAmount - basePlanTotal);

    const newEndDate = this.calculateExpirationDate(now, newMonths);
    const label = brand.plan === 'PRO' ? 'Plan Pro' : brand.plan === 'ENTERPRISE' ? 'Plan Enterprise' : 'Plan Básico';

    return {
      daysRemaining,
      basePlanTotal,
      creditAmount,
      newPlanTotal: basePlanTotal,
      amountToPay,
      remainingCredit,
      newEndDate: newEndDate.toISOString(),
      isFree: amountToPay <= 0,
      creditLabel: `Crédito por ${daysRemaining} días restantes del ${label}`,
    };
  }

  async applyFreeUpgrade(
    brandId: string,
    newPlan: string,
    newMonths: number,
    creditAmount: number,
    newPlanTotal: number,
    reference: string,
    forcedEndDate?: string
  ): Promise<Brand> {
    const now = new Date();
    const normalizedPlan = newPlan.toUpperCase();
    const newEndDate = forcedEndDate ? new Date(forcedEndDate) : this.calculateExpirationDate(now, newMonths);

    const { data: updatedBrand, error } = await supabaseAdmin
      .from('brands')
      .update({
        plan: normalizedPlan,
        subscription_start_date: now.toISOString(),
        subscription_end_date: newEndDate.toISOString(),
        subscription_status: 'active',
        trial_end_date: null,
        trial_payment_status: null,
        last_payment_date: now.toISOString(),
        next_payment_date: newEndDate.toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error || !updatedBrand) throw new Error('Error al aplicar cambio de plan: ' + error?.message);

    if (newPlanTotal > creditAmount) {
      await this.createPaymentRecord({
        brand_id: brandId,
        amount: Math.max(0, newPlanTotal - creditAmount),
        currency: 'COP',
        payment_date: now.toISOString(),
        payment_method: 'credit_proration',
        status: 'completed',
        months_paid: newMonths,
        notes: `Cambio de plan por prorrateo. Plan: ${newPlan}. Crédito aplicado: $${creditAmount}. Valor plan: $${newPlanTotal}. Ref: ${reference}`,
        ledger_snapshot: {
          version: 1,
          brandId: brandId,
          brandName: (updatedBrand as any).name || null,
          brandEmail: (updatedBrand as any).email || null,
          brandSlug: (updatedBrand as any).slug || null,
          planPurchased: normalizedPlan,
          billingType: 'upgrade',
          includesLanding: false,
          brandPlanBefore: null,
          brandPlanAfter: normalizedPlan,
        },
      });
    }

    return updatedBrand as Brand;
  }

  async suspendSubscription(brandId: string): Promise<Brand> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'suspended' })
      .eq('id', brandId)
      .select()
      .single();

    if (error || !data) throw new Error('Error al suspender: ' + error?.message);
    return data as Brand;
  }

  async getDaysRemaining(brandId: string): Promise<number | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('subscription_end_date')
      .eq('id', brandId)
      .single();

    if (error || !data || !data.subscription_end_date) return null;
    const diffTime = new Date(data.subscription_end_date).getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async getExpiringSubscriptions(days: number): Promise<Brand[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .in('subscription_status', ['active', 'expiring_soon'])
      .gte('subscription_end_date', now.toISOString())
      .lte('subscription_end_date', futureDate.toISOString())
      .order('subscription_end_date', { ascending: true });

    if (error) throw new Error('Error al obtener suscripciones por vencer: ' + error.message);
    return (data || []) as Brand[];
  }

  async getSubscriptionInfo(brandId: string): Promise<any> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('subscription_status, subscription_start_date, subscription_end_date, last_payment_date, next_payment_date, trial_end_date')
      .eq('id', brandId)
      .single();

    if (error || !data) throw new Error('Error al obtener info');

    const daysRemaining = await this.getDaysRemaining(brandId);
    const inTrial = await this.isInTrial(brandId);
    const trialDaysRemaining = await this.getTrialDaysRemaining(brandId);

    if (inTrial && trialDaysRemaining !== null && trialDaysRemaining <= 3) {
      await recordTrialEvent(brandId, 'trial_expiring', { trialDaysRemaining }).catch(() => {});
    }

    return {
      status: data.subscription_status,
      startDate: data.subscription_start_date,
      endDate: data.subscription_end_date,
      lastPaymentDate: data.last_payment_date,
      nextPaymentDate: data.next_payment_date,
      daysRemaining,
      isInTrial: inTrial,
      trialEndDate: data.trial_end_date,
      trialDaysRemaining,
    };
  }

  async reactivateSubscription(brandId: string): Promise<Brand> {
    const { data: brand, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('id, landing_suspended_at, has_landing_page, trial_end_date, subscription_end_date')
      .eq('id', brandId)
      .single();

    if (fetchError || !brand) throw new Error('Marca no encontrada');

    const now = new Date();
    const trialEndDate = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
    const subscriptionEndDate = brand.subscription_end_date ? new Date(brand.subscription_end_date) : null;
    const hasActiveTrial = trialEndDate !== null && trialEndDate > now;
    const hasActivePaidPeriod = subscriptionEndDate !== null && subscriptionEndDate > now;

    if (!hasActiveTrial && !hasActivePaidPeriod) throw new Error('PAYMENT_REQUIRED_FOR_REACTIVATION');

    let restaurarLanding = false;
    if (brand.landing_suspended_at) {
      const diasSuspendida = (Date.now() - new Date(brand.landing_suspended_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diasSuspendida < 90) restaurarLanding = true;
    }

    const shouldBeExpiringSoon = hasActivePaidPeriod && subscriptionEndDate !== null && subscriptionEndDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000;

    const payload: any = { subscription_status: shouldBeExpiringSoon ? 'expiring_soon' : 'active' };
    if (restaurarLanding) {
      payload.has_landing_page = true;
      payload.landing_suspended_at = null;
    }

    const { data, error } = await supabaseAdmin.from('brands').update(payload).eq('id', brandId).select().single();
    if (error || !data) throw new Error('Error al reactivar');
    return data as Brand;
  }

  async updateSubscriptionStatuses(): Promise<any> {
    const now = new Date().toISOString();
    const sevenDays = new Date();
    sevenDays.setDate(sevenDays.getDate() + 7);

    const { data: expiredTrials } = await supabaseAdmin.from('brands').update({ subscription_status: 'expired' }).eq('plan', 'TRIAL').lte('trial_end_date', now).not('trial_end_date', 'is', null).select('id');
    const { data: expiredBrands } = await supabaseAdmin.from('brands').update({ subscription_status: 'expired' }).neq('plan', 'TRIAL').lte('subscription_end_date', now).not('subscription_end_date', 'is', null).in('subscription_status', ['active', 'expiring_soon']).select('id');
    const { data: expiringSoon } = await supabaseAdmin.from('brands').update({ subscription_status: 'expiring_soon' }).neq('plan', 'TRIAL').gt('subscription_end_date', now).lte('subscription_end_date', sevenDays.toISOString()).eq('subscription_status', 'active').select('id');
    const { data: suspended } = await supabaseAdmin.from('brands').update({ subscription_status: 'suspended' }).eq('subscription_status', 'expired').select('id');

    return {
      expired: (expiredBrands?.length || 0) + (expiredTrials?.length || 0),
      expiringSoon: expiringSoon?.length || 0,
      suspended: suspended?.length || 0,
      trialExpired: expiredTrials?.length || 0,
    };
  }

  private async createPaymentRecord(paymentData: CreatePaymentDto): Promise<SubscriptionPayment> {
    if (paymentData.reference) {
      try {
        const { data: existing } = await supabaseAdmin.from('subscription_payments').select('*').eq('reference', paymentData.reference).limit(1).maybeSingle();
        if (existing) return existing as SubscriptionPayment;
      } catch (e) {}
    }

    const notes = paymentData.ledger_snapshot ? attachLedgerSnapshotToNotes(paymentData.notes || null, paymentData.ledger_snapshot as any) : (paymentData.notes || null);

    return this.insertPaymentCompat({
      brand_id: paymentData.brand_id,
      amount: paymentData.amount,
      currency: paymentData.currency || 'COP',
      payment_date: paymentData.payment_date || new Date().toISOString(),
      payment_method: paymentData.payment_method || null,
      status: paymentData.status || 'completed',
      notes,
      months_paid: paymentData.months_paid || 1,
      reference: paymentData.reference || null,
    });
  }

  async getPaymentHistory(brandId: string): Promise<SubscriptionPayment[]> {
    const { data, error } = await supabaseAdmin.from('subscription_payments').select('*').eq('brand_id', brandId).order('payment_date', { ascending: false });
    if (error) throw new Error('Error historial: ' + error.message);

    const reportingTrm = await getReportingTrm();
    const cache = new Map<string, number | null>();

    const normalized = await Promise.all((data || []).map(async (payment: any) => {
      const norm = await normalizePaymentRecordToCop(payment, reportingTrm, cache);
      return { ...payment, amount: norm.amountCop, amount_original: norm.originalAmount, amount_cop: norm.amountCop, currency: norm.currency };
    }));

    return normalized as SubscriptionPayment[];
  }

  async purgeExpiredSuspendedBrands(): Promise<any> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);

    const { data: brands } = await supabaseAdmin.from('brands').select('id, name').eq('subscription_status', 'suspended').lt('subscription_end_date', cutoff.toISOString());
    if (!brands?.length) return { purged: 0, errors: 0 };

    let purged = 0;
    for (const b of brands) {
      const { error } = await supabaseAdmin.from('brands').update({ name: `[ELIMINADA] ${b.name}`, email: `deleted_${b.id}@purged.local`, logo: null }).eq('id', b.id);
      if (!error) purged++;
    }
    return { purged, errors: brands.length - purged };
  }
}
