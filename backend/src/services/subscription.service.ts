import { supabaseAdmin } from '../config/supabase';
import { Brand, SubscriptionPayment, CreatePaymentDto } from '../types';
import { PaymentSettingsService } from './paymentSettings.service';
import { getReportingTrm, normalizePaymentRecordToCop } from '../utils/paymentNormalization';
import { attachLedgerSnapshotToNotes, type PaymentLedgerSnapshot } from '../utils/paymentLedger';
import { hasActivePaidSubscription, isTrialOperationalBrand, recordTrialEvent } from '../utils/brandLifecycle';

/**
 * SubscriptionService
 *
 * Servicio para gestionar suscripciones de marcas.
 * Maneja verificación de estado, renovaciones, suspensiones y cálculos de fechas.
 *
 * Requirements: 11.1, 11.2, 11.3, 11.5, 11.6, 11.10
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

  /**
   * Verifica si la suscripción de una marca está activa.
   * También permite acceso si la marca está en período de prueba activo.
   *
   * @param brandId - ID de la marca
   * @returns true si la suscripción está activa o el trial no ha vencido
   *
   * Requirements: 11.1, 11 (Opción C)
   */
  async checkSubscriptionStatus(brandId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('subscription_status, trial_end_date')
      .eq('id', brandId)
      .single();

    if (error || !data) {
      return false;
    }

    // Suscripción activa o por vencer
    if (
      data.subscription_status === 'active' ||
      data.subscription_status === 'expiring_soon' ||
      data.subscription_status == null
    ) {
      return true;
    }

    // Verificar período de prueba activo
    if (data.trial_end_date) {
      const trialEnd = new Date(data.trial_end_date);
      if (trialEnd > new Date()) {
        return true;
      }
    }

    return false;
  }

  /**
   * Verifica si una marca está en período de prueba activo
   *
   * @param brandId - ID de la marca
   * @returns true si el trial está activo y no ha vencido
   */
  async isInTrial(brandId: string): Promise<boolean> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('trial_end_date, subscription_status')
      .eq('id', brandId)
      .single();

    if (error || !data || !data.trial_end_date) {
      return false;
    }

    if (data.subscription_status === 'suspended') {
      return false;
    }

    return new Date(data.trial_end_date) > new Date();
  }

  /**
   * Obtiene los días restantes del período de prueba
   *
   * @param brandId - ID de la marca
   * @returns días restantes del trial, o null si no aplica
   */
  async getTrialDaysRemaining(brandId: string): Promise<number | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('trial_end_date')
      .eq('id', brandId)
      .single();

    if (error || !data || !data.trial_end_date) {
      return null;
    }

    const trialEnd = new Date(data.trial_end_date);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Calcula la fecha de vencimiento de una suscripción
   *
   * @param startDate - Fecha de inicio de la suscripción
   * @returns Fecha de vencimiento (+30 días desde la fecha de inicio)
   *
   * Requirement 11.2: Calcular fecha de vencimiento
   */
  calculateExpirationDate(startDate: Date, months: number = 1): Date {
    const expirationDate = new Date(startDate);
    expirationDate.setDate(expirationDate.getDate() + 30 * months);
    return expirationDate;
  }

  /**
   * Renueva la suscripción de una marca por N meses
   *
   * @param brandId - ID de la marca
   * @param paymentData - Datos del pago realizado
   * @param months - Meses a activar (1, 3, 6 o 12)
   * @param plan - Plan a activar ('BASIC' | 'PRO'). Si se omite, mantiene el plan actual.
   * @returns Marca actualizada con nueva fecha de vencimiento
   *
   * Requirements: 11.6, 11.14
   */
  async renewSubscription(
    brandId: string,
    paymentData: CreatePaymentDto,
    months: number = 1,
    plan?: string,
    isUpgrade: boolean = false
  ): Promise<Brand> {
    // Validar meses permitidos
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
          const { data: currentBrand, error: currentBrandError } = await supabaseAdmin
            .from('brands')
            .select('*')
            .eq('id', brandId)
            .single();

          if (currentBrandError || !currentBrand) {
            throw new Error('Marca no encontrada');
          }

          return currentBrand as Brand;
        }
      } catch (refCheckError) {
        // En entornos legacy sin columna reference, seguimos sin esta protección.
        // Se loguea para visibilidad en caso de error inesperado.
        console.warn('[Subscription] Guard de idempotencia por reference no disponible:', (refCheckError as Error)?.message);
      }
    }

    // Obtener marca actual
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      throw new Error('Marca no encontrada');
    }

    // Calcular nueva fecha de inicio y vencimiento
    const now = new Date();
    const hadActiveTrial = isTrialOperationalBrand(brand);
    const previousPlan = brand.plan ?? 'BASIC';
    // En upgrade: siempre desde hoy (el crédito ya fue descontado del precio)
    // En renovación normal: extender desde la fecha de fin actual si no venció
    const newStartDate = isUpgrade
      ? now
      : brand.subscription_end_date
        ? new Date(brand.subscription_end_date) > now
          ? new Date(brand.subscription_end_date)
          : now
        : now;

    const newEndDate = this.calculateExpirationDate(newStartDate, months);

    // Actualizar marca con nueva suscripción
    const updateData: Record<string, unknown> = {
      subscription_start_date: newStartDate.toISOString(),
      subscription_end_date: newEndDate.toISOString(),
      subscription_status: 'active',
      last_payment_date: paymentData.payment_date || now.toISOString(),
      next_payment_date: newEndDate.toISOString(),
    };

    // Actualizar plan si se especificó uno válido
    if (plan && ['BASIC', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(plan.toUpperCase())) {
      const planUpper = plan.toUpperCase();
      updateData.plan = planUpper === 'TRIAL' ? 'BASIC' : planUpper;

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
        updateData.subscription_end_date = trialEndDate.toISOString();
      } else {
        updateData.trial_end_date = null;
        updateData.trial_payment_status = null;
      }
    }

    // Si la marca tenía mini-landing suspendida hace menos de 90 días, restaurarla
    if (brand.landing_suspended_at) {
      const diasSuspendida =
        (now.getTime() - new Date(brand.landing_suspended_at).getTime()) / (1000 * 60 * 60 * 24);
      if (diasSuspendida < 90) {
        updateData.has_landing_page = true;
        updateData.landing_suspended_at = null;
        console.log(`[Subscription] Restaurando mini-landing al renovar marca ${brandId}`);
      }
    }

    // Actualizar marca con nueva suscripción
    const { data: updatedBrand, error: updateError } = await supabaseAdmin
      .from('brands')
      .update(updateData)
      .eq('id', brandId)
      .select()
      .single();

    if (updateError || !updatedBrand) {
      throw new Error('Error al renovar la suscripción: ' + updateError?.message);
    }

    const planPurchased = String((plan || updatedBrand.plan || brand.plan || 'BASIC')).toUpperCase();
    const includesLanding = String(paymentData.notes || '').toUpperCase().includes('LANDING');
    const billingType =
      paymentData.payment_method === 'credit_proration' || isUpgrade
        ? 'upgrade'
        : includesLanding && Number(paymentData.months_paid || months || 0) === 0
          ? 'landing'
          : hadActiveTrial && ['BASIC', 'PRO', 'ENTERPRISE'].includes(planPurchased)
            ? 'subscription'
            : 'subscription';

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

    // Registrar pago en historial
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

  /**
   * Calcula el prorrateo para un cambio de plan (Upgrade o Downgrade).
   * El crédito se basa en el precio diario del plan actual × días restantes.
   * El monto a cobrar = precio del nuevo plan - crédito (mínimo 0).
   * La nueva fecha de fin = now() + meses nuevos (siempre desde hoy, no acumula).
   *
   * @param brandId - ID de la marca
   * @param newPlan - Plan destino ('BASIC' | 'PRO')
   * @param newMonths - Meses a contratar del nuevo plan
   * @param newPlanTotal - Precio total final del nuevo plan en COP
   * @param currentPlanPriceTotalFallback - Precio total pagado por el plan actual (fallback si no hay registro)
   */
  async calculateUpgradeProration(
    brandId: string,
    newPlan: string,
    newMonths: number,
    newPlanTotal: number,
    currentPlanPriceTotalFallback: number
  ): Promise<{
    daysRemaining: number;
    basePlanTotal: number;
    creditAmount: number;
    newPlanTotal: number;
    amountToPay: number;
    remainingCredit: number;
    newEndDate: string;
    isFree: boolean;
    creditLabel: string;
  }> {
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
    const daysRemaining = Math.max(
      0,
      Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    );

    const { data: lastPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('amount, months_paid, notes')
      .eq('brand_id', brandId)
      .eq('status', 'completed')
      .gt('months_paid', 0)
      .neq('payment_method', 'credit_proration')
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastPayment) {
      const newEndDate = this.calculateExpirationDate(now, newMonths);
      return {
        daysRemaining,
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

    const paymentMonths = lastPayment?.months_paid || 1;
    const totalDays = Math.max(1, 30 * paymentMonths);
    const effectiveDaysRemaining = Math.min(daysRemaining, totalDays);

    // BUG #2 FIX: El fallback debe ser el TOTAL del período, no el precio mensual.
    // Si no hay lastPayment con amount > 0, estimamos el total multiplicando el precio
    // mensual (currentPlanPriceTotalFallback) por la duración real del período actual.
    let currentPlanPriceTotal: number;
    if (lastPayment?.amount && lastPayment.amount > 0) {
      currentPlanPriceTotal = lastPayment.amount;
    } else {
      // Obtener duración real del período desde las fechas de BD
      const startDate = brand.subscription_start_date ? new Date(brand.subscription_start_date) : now;
      const endDt = brand.subscription_end_date ? new Date(brand.subscription_end_date) : now;
      const periodDays = Math.max(30, Math.round((endDt.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      const estimatedMonths = Math.max(1, Math.round(periodDays / 30));
      // currentPlanPriceTotalFallback es el precio MENSUAL → multiplicar por meses estimados
      currentPlanPriceTotal = currentPlanPriceTotalFallback * estimatedMonths;
      console.log(
        `[Proration] Sin lastPayment: estimando total. periodDays=${periodDays} meses=${estimatedMonths} precioMensual=${currentPlanPriceTotalFallback} totalEstimado=${currentPlanPriceTotal}`
      );
    }

    if (lastPayment?.notes?.includes('Incluye Landing Page')) {
      try {
        const settingsService = new PaymentSettingsService();
        const settings = await settingsService.getSettings();
        const landingPrice = settings.landing_price || 650000;

        const previousAmount = currentPlanPriceTotal;
        currentPlanPriceTotal = Math.max(0, currentPlanPriceTotal - landingPrice);
        console.log(
          `[Proration] Ajustando monto por landing page: ${previousAmount} -> ${currentPlanPriceTotal} (Restado: ${landingPrice})`
        );
      } catch (err) {
        console.error('[Proration] Error al obtener precio de landing para ajuste:', err);
      }
    }

    console.log(
      `[Proration] brandId=${brandId} lastPayment=${lastPayment?.amount} fallbackMensual=${currentPlanPriceTotalFallback} totalUsado=${currentPlanPriceTotal} totalDays=${totalDays} daysRemaining=${daysRemaining} effectiveDaysRemaining=${effectiveDaysRemaining}`
    );

    const pricePerDay = currentPlanPriceTotal / totalDays;
    const remainingPlanValue = Math.max(
      0,
      Math.min(currentPlanPriceTotal, Math.round(pricePerDay * effectiveDaysRemaining))
    );
    const creditAmount = remainingPlanValue;

    const amountToPay = Math.max(0, basePlanTotal - creditAmount);
    const remainingCredit = Math.max(0, creditAmount - basePlanTotal);

    const newEndDate = this.calculateExpirationDate(now, newMonths);
    const currentPlanLabel = brand.plan === 'PRO' ? 'Plan Pro' : brand.plan === 'ENTERPRISE' ? 'Plan Enterprise' : 'Plan Básico';

    return {
      daysRemaining,
      basePlanTotal,
      creditAmount,
      newPlanTotal: basePlanTotal,
      amountToPay,
      remainingCredit,
      newEndDate: newEndDate.toISOString(),
      isFree: amountToPay === 0,
      creditLabel: `Crédito por ${effectiveDaysRemaining} días restantes de ${currentPlanLabel}`,
    };
  }

  /**
   * Aplica un upgrade/downgrade gratuito (cuando el crédito cubre el costo del nuevo plan).
   * Cambia el plan y usa la fecha de fin calculada con los días de regalo.
   */
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

    let newEndDate: Date;
    if (forcedEndDate) {
      newEndDate = new Date(forcedEndDate);
    } else {
      newEndDate = this.calculateExpirationDate(now, newMonths);
    }

    const { data: updatedBrand, error } = await supabaseAdmin
      .from('brands')
      .update({
        plan: newPlan.toUpperCase(),
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

    if (error || !updatedBrand) {
      throw new Error('Error al aplicar cambio de plan: ' + error?.message);
    }

    await this.createPaymentRecord({
      brand_id: brandId,
      amount: 0,
      currency: 'COP',
      payment_date: now.toISOString(),
      payment_method: 'credit_proration',
      status: 'completed',
      months_paid: newMonths,
      notes: `Cambio de plan gratuito por prorrateo. Plan: ${newPlan}. Crédito aplicado: $${creditAmount}. Valor plan: $${newPlanTotal}. Ref: ${reference}`,
      ledger_snapshot: {
        version: 1,
        brandId: brandId,
        brandName: (updatedBrand as any).name || null,
        brandEmail: (updatedBrand as any).email || null,
        brandSlug: (updatedBrand as any).slug || null,
        planPurchased: newPlan.toUpperCase(),
        billingType: 'upgrade',
        includesLanding: false,
        brandPlanBefore: null,
        brandPlanAfter: newPlan.toUpperCase(),
      },
    });

    return updatedBrand as Brand;
  }

  /**
   * Suspende la suscripción de una marca
   *
   * @param brandId - ID de la marca
   * @returns Marca actualizada con estado suspended
   *
   * Requirement 11.3: Suspender marca por falta de pago
   */
  async suspendSubscription(brandId: string): Promise<Brand> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update({
        subscription_status: 'suspended',
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al suspender la suscripción: ' + error?.message);
    }

    return data as Brand;
  }

  /**
   * Calcula los días restantes de suscripción de una marca
   *
   * @param brandId - ID de la marca
   * @returns Número de días restantes (puede ser negativo si ya venció)
   *
   * Requirement 11.10: Mostrar días restantes en dashboard
   */
  async getDaysRemaining(brandId: string): Promise<number | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('subscription_end_date')
      .eq('id', brandId)
      .single();

    if (error || !data || !data.subscription_end_date) {
      return null;
    }

    const endDate = new Date(data.subscription_end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  /**
   * Obtiene las suscripciones que vencen en los próximos X días
   *
   * @param days - Número de días para filtrar (ej: 7 para suscripciones que vencen en 7 días)
   * @returns Lista de marcas cuyas suscripciones vencen en el período especificado
   *
   * Requirement 11.5: Identificar suscripciones por vencer para enviar recordatorios
   */
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

    if (error) {
      throw new Error('Error al obtener suscripciones por vencer: ' + error.message);
    }

    return (data || []) as Brand[];
  }

  /**
   * Obtiene información completa de la suscripción de una marca,
   * incluyendo datos del período de prueba si aplica.
   *
   * @param brandId - ID de la marca
   * @returns Información de suscripción incluyendo fechas, días restantes y estado de trial
   */
  async getSubscriptionInfo(brandId: string): Promise<{
    status: string;
    startDate: string | null;
    endDate: string | null;
    lastPaymentDate: string | null;
    nextPaymentDate: string | null;
    daysRemaining: number | null;
    isInTrial: boolean;
    trialEndDate: string | null;
    trialDaysRemaining: number | null;
  }> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select(
        'subscription_status, subscription_start_date, subscription_end_date, last_payment_date, next_payment_date, trial_end_date'
      )
      .eq('id', brandId)
      .single();

    if (error || !data) {
      throw new Error('Error al obtener información de suscripción');
    }

    const daysRemaining = await this.getDaysRemaining(brandId);
    const inTrial = await this.isInTrial(brandId);
    const trialDaysRemaining = await this.getTrialDaysRemaining(brandId);

    if (inTrial && trialDaysRemaining !== null && trialDaysRemaining <= 3) {
      await recordTrialEvent(brandId, 'trial_expiring', { trialDaysRemaining }).catch(() => {});
    }

    if (!inTrial && data.trial_end_date) {
      const trialEnd = new Date(data.trial_end_date);
      if (!Number.isNaN(trialEnd.getTime()) && trialEnd <= new Date()) {
        await recordTrialEvent(brandId, 'trial_expired').catch(() => {});
      }
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

  /**
   * Reactiva una marca suspendida.
   * Si la marca tenía mini-landing suspendida hace menos de 90 días,
   * la restaura automáticamente (has_landing_page = true, landing_suspended_at = null).
   *
   * @param brandId - ID de la marca
   * @returns Marca actualizada con estado active
   */
  async reactivateSubscription(brandId: string): Promise<Brand> {
    const { data: brand, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('id, landing_suspended_at, has_landing_page, trial_end_date, subscription_end_date')
      .eq('id', brandId)
      .single();

    if (fetchError || !brand) {
      throw new Error('Marca no encontrada: ' + fetchError?.message);
    }

    const now = new Date();
    const trialEndDate = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
    const subscriptionEndDate = brand.subscription_end_date ? new Date(brand.subscription_end_date) : null;
    const hasActiveTrial = trialEndDate !== null && trialEndDate > now;
    const hasActivePaidPeriod = subscriptionEndDate !== null && subscriptionEndDate > now;

    if (!hasActiveTrial && !hasActivePaidPeriod) {
      throw new Error('PAYMENT_REQUIRED_FOR_REACTIVATION');
    }

    let restaurarLanding = false;
    if (brand.landing_suspended_at) {
      const suspendidaHace = Date.now() - new Date(brand.landing_suspended_at).getTime();
      const diasSuspendida = suspendidaHace / (1000 * 60 * 60 * 24);
      if (diasSuspendida < 90) {
        restaurarLanding = true;
      }
    }

    const shouldBeExpiringSoon =
      hasActivePaidPeriod &&
      subscriptionEndDate !== null &&
      subscriptionEndDate.getTime() - now.getTime() <= 7 * 24 * 60 * 60 * 1000;

    const updatePayload: Record<string, unknown> = {
      // BUG #8 FIX: 'trial' NO existe en el enum de subscription_status de Supabase.
      // El trial se infiere dinámicamente desde trial_end_date, nunca se persiste como status.
      subscription_status: shouldBeExpiringSoon ? 'expiring_soon' : 'active',
    };

    if (restaurarLanding) {
      updatePayload.has_landing_page = true;
      updatePayload.landing_suspended_at = null;
      console.log(`[Subscription] Restaurando mini-landing al reactivar marca ${brandId}`);
    }

    const { data, error } = await supabaseAdmin
      .from('brands')
      .update(updatePayload)
      .eq('id', brandId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al reactivar la suscripción: ' + error?.message);
    }

    return data as Brand;
  }

  /**
   * Actualiza el estado de suscripciones basado en fechas de vencimiento
   * Este método debe ser llamado por un job diario
   *
   * @returns Resumen de actualizaciones realizadas
   *
   * Requirement 11.3: Cambiar estado automáticamente al vencer
   */
  async updateSubscriptionStatuses(): Promise<{
    expired: number;
    expiringSoon: number;
    suspended: number;
    trialExpired: number;
  }> {
    const now = new Date();
    const nowIso = now.toISOString();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // BUG #1 FIX: Solo expirar marcas con subscription_end_date definida (nunca NULL).
    // Además, no expirar si trial_end_date aún está en el futuro (trial vigente).
    const { data: expiredBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'expired' })
      .lte('subscription_end_date', nowIso)
      .not('subscription_end_date', 'is', null)                    // BUG #10 FIX
      .in('subscription_status', ['active', 'expiring_soon'])
      .or(`trial_end_date.is.null,trial_end_date.lte.${nowIso}`)  // BUG #1 FIX: proteger trials vigentes
      .select('id');

    // BUG #10 FIX: Expirar marcas cuyo TRIAL venció y nunca tuvieron suscripción de pago
    const { data: expiredTrialBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'expired' })
      .lte('trial_end_date', nowIso)
      .not('trial_end_date', 'is', null)
      .is('subscription_end_date', null)  // Solo los que nunca tuvieron período pago
      .in('subscription_status', ['active', 'expiring_soon'])
      .select('id');

    const { data: expiringSoonBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'expiring_soon' })
      .gt('subscription_end_date', nowIso)
      .lte('subscription_end_date', sevenDaysFromNow.toISOString())
      .eq('subscription_status', 'active')
      .or(`trial_end_date.is.null,trial_end_date.lte.${nowIso}`)  // No marcar expiring_soon si trial aún activo
      .select('id');

    const { data: suspendedBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'suspended' })
      .eq('subscription_status', 'expired')
      .select('id');

    const totalExpired = (expiredBrands?.length || 0) + (expiredTrialBrands?.length || 0);
    console.log(
      `[Subscription Job] expired=${totalExpired} (subs=${expiredBrands?.length || 0} trials=${expiredTrialBrands?.length || 0}) expiringSoon=${expiringSoonBrands?.length || 0} suspended=${suspendedBrands?.length || 0}`
    );

    return {
      expired: totalExpired,
      expiringSoon: expiringSoonBrands?.length || 0,
      suspended: suspendedBrands?.length || 0,
      trialExpired: expiredTrialBrands?.length || 0,
    };
  }

  /**
   * Crea un registro de pago en el historial
   *
   * @param paymentData - Datos del pago
   * @returns Registro de pago creado
   *
   * Requirement 11.14: Registrar historial de pagos
   */
  private async createPaymentRecord(
    paymentData: CreatePaymentDto
  ): Promise<SubscriptionPayment> {
    if (paymentData.reference) {
      try {
        const { data: existing } = await supabaseAdmin
          .from('subscription_payments')
          .select('*')
          .eq('reference', paymentData.reference)
          .limit(1)
          .maybeSingle();
        if (existing) {
          return existing as SubscriptionPayment;
        }
      } catch {
        // Si el esquema no tiene `reference` en algún entorno legacy, seguimos sin idempotencia por reference.
      }
    }

    const notesWithSnapshot = paymentData.ledger_snapshot
      ? attachLedgerSnapshotToNotes(
          paymentData.notes || null,
          paymentData.ledger_snapshot as unknown as PaymentLedgerSnapshot
        )
      : (paymentData.notes || null);

    return this.insertPaymentCompat({
      brand_id: paymentData.brand_id,
      amount: paymentData.amount,
      currency: paymentData.currency || 'COP',
      payment_date: paymentData.payment_date || new Date().toISOString(),
      payment_method: paymentData.payment_method || null,
      status: paymentData.status || 'completed',
      notes: notesWithSnapshot,
      months_paid: paymentData.months_paid || 1,
      reference: paymentData.reference || null,
    });
  }

  /**
   * Obtiene el historial de pagos de una marca
   *
   * @param brandId - ID de la marca
   * @returns Lista de pagos ordenados por fecha descendente
   *
   * Requirement 11.14: Mostrar historial de pagos
   */
  async getPaymentHistory(brandId: string): Promise<SubscriptionPayment[]> {
    const { data, error } = await supabaseAdmin
      .from('subscription_payments')
      .select('*')
      .eq('brand_id', brandId)
      .order('payment_date', { ascending: false });

    if (error) {
      throw new Error('Error al obtener historial de pagos: ' + error.message);
    }

    const reportingTrm = await getReportingTrm();
    const trmCache = new Map<string, number | null>();

    const normalizedPayments = await Promise.all(
      (data || []).map(async (payment: any) => {
        const normalized = await normalizePaymentRecordToCop(payment, reportingTrm, trmCache);
        return {
          ...payment,
          amount: normalized.amountCop,
          amount_original: normalized.originalAmount,
          amount_cop: normalized.amountCop,
          exchange_rate_used: normalized.exchangeRateUsed,
          currency: normalized.currency,
          reference_used: normalized.referenceUsed,
        };
      })
    );

    return normalizedPayments as SubscriptionPayment[];
  }

  /**
   * Purga marcas suspendidas hace más de 90 días.
   * Elimina datos de la marca pero mantiene registros de pagos para auditoría.
   *
   * Requirements: 11.12, 11.13
   */
  async purgeExpiredSuspendedBrands(): Promise<{ purged: number; errors: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    const { data: brandsToPurge, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('id, name, email')
      .eq('subscription_status', 'suspended')
      .lt('subscription_end_date', cutoffDate.toISOString());

    if (fetchError || !brandsToPurge?.length) {
      return { purged: 0, errors: fetchError ? 1 : 0 };
    }

    let purged = 0;
    let errors = 0;

    for (const brand of brandsToPurge) {
      try {
        const { error } = await supabaseAdmin
          .from('brands')
          .update({
            subscription_status: 'suspended',
            name: `[ELIMINADA] ${brand.name}`,
            email: `deleted_${brand.id}@purged.local`,
            logo: null,
            slug: `deleted-${brand.id}`,
          })
          .eq('id', brand.id);

        if (error) {
          console.error(`[Subscription] Error purgando marca ${brand.id}:`, error.message);
          errors++;
        } else {
          console.log(`[Subscription] Marca purgada tras 90 días: ${brand.name} (${brand.id})`);
          purged++;
        }
      } catch (err) {
        console.error(`[Subscription] Error inesperado purgando marca ${brand.id}:`, err);
        errors++;
      }
    }

    return { purged, errors };
  }
}
