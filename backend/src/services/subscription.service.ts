import { supabaseAdmin } from '../config/supabase';
import { Brand, SubscriptionPayment, CreatePaymentDto } from '../types';

/**
 * SubscriptionService
 * 
 * Servicio para gestionar suscripciones de marcas.
 * Maneja verificación de estado, renovaciones, suspensiones y cálculos de fechas.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.5, 11.6, 11.10
 */
export class SubscriptionService {
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

    // Solo es "en trial" si no tiene suscripción activa pagada
    const hasActivePaidSubscription =
      data.subscription_status === 'active' ||
      data.subscription_status === 'expiring_soon';

    if (hasActivePaidSubscription) {
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
    if (plan && ['BASIC', 'PRO', 'TRIAL'].includes(plan.toUpperCase())) {
      const planUpper = plan.toUpperCase();
      updateData.plan = planUpper === 'TRIAL' ? 'BASIC' : planUpper; // El plan base es BASIC
      
      if (planUpper === 'TRIAL') {
        // Buscar duración del trial en la campaña actual
        const now = new Date().toISOString();
        const { data: campaign } = await supabaseAdmin
          .from('trial_campaigns')
          .select('trial_days')
          .eq('active', true)
          .or(`ends_at.is.null,ends_at.gt.${now}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        const trialDays = campaign?.trial_days ?? 7;
        const trialEndDate = new Date();
        trialEndDate.setDate(trialEndDate.getDate() + trialDays);
        
        updateData.trial_end_date = trialEndDate.toISOString();
        updateData.trial_payment_status = 'active';
        // En trial, la suscripción pagada no empieza aún
        updateData.subscription_status = 'active'; // Permitir acceso
        updateData.subscription_end_date = trialEndDate.toISOString();
      } else {
        // Limpiar trial al activar plan pagado
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

    // Registrar pago en historial
    await this.createPaymentRecord({
      ...paymentData,
      brand_id: brandId,
      payment_date: paymentData.payment_date || now.toISOString(),
      status: paymentData.status || 'completed',
    });

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
   * @param newPlanPricePerMonth - Precio mensual del nuevo plan en COP
   * @param currentPlanPriceTotalFallback - Precio total pagado por el plan actual (fallback si no hay registro)
   */
  async calculateUpgradeProration(
    brandId: string,
    newPlan: string,
    newMonths: number,
    newPlanPricePerMonth: number,
    currentPlanPriceTotalFallback: number
  ): Promise<{
    daysRemaining: number;
    creditAmount: number;
    newPlanTotal: number;
    amountToPay: number;
    remainingCredit: number;
    newEndDate: string;
    isFree: boolean;
  }> {
    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .select('subscription_end_date, subscription_start_date, plan')
      .eq('id', brandId)
      .single();

    if (error || !brand) throw new Error('Marca no encontrada');

    const now = new Date();
    const endDate = brand.subscription_end_date ? new Date(brand.subscription_end_date) : now;
    const startDate = brand.subscription_start_date ? new Date(brand.subscription_start_date) : now;

    // Días restantes calculados exactamente desde el fin actual.
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Días totales considerados para la prorrata: usar el ciclo del último pago si está disponible (en meses),
    // o fallback de 30 días (período del plan).
    // Esto evita que un subscription_start_date mal configurado reduzca totalDays a 1 y cause un crédito injusto.
    const { data: lastPayment } = await supabaseAdmin
      .from('subscription_payments')
      .select('amount, months_paid, notes')
      .eq('brand_id', brandId)
      .eq('status', 'completed')
      .gt('months_paid', 0) // excluir pagos de solo landing page
      .neq('payment_method', 'credit_proration') // excluir upgrades gratuitos previos
      .order('payment_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentMonths = lastPayment?.months_paid || 1;
    const totalDays = Math.max(1, 30 * paymentMonths); // prorrateo basado en meses pagados

    // Usar el monto real del último pago; si no hay registro, usar el fallback del frontend
    let currentPlanPriceTotal = lastPayment?.amount && lastPayment.amount > 0
      ? lastPayment.amount
      : currentPlanPriceTotalFallback;

    // Si el último pago incluía mini-landing, restar su valor para no prorratear un pago único
    if (lastPayment?.notes?.includes('Incluye Landing Page')) {
      try {
        const { PaymentSettingsService } = require('./paymentSettings.service');
        const settingsService = new PaymentSettingsService();
        const settings = await settingsService.getSettings();
        const landingPrice = settings.landing_price || 650000;
        
        const previousAmount = currentPlanPriceTotal;
        currentPlanPriceTotal = Math.max(0, currentPlanPriceTotal - landingPrice);
        console.log(`[Proration] Ajustando monto por landing page: ${previousAmount} -> ${currentPlanPriceTotal} (Restado: ${landingPrice})`);
      } catch (err) {
        console.error('[Proration] Error al obtener precio de landing para ajuste:', err);
      }
    }

    console.log(`[Proration] brandId=${brandId} lastPayment=${lastPayment?.amount} fallback=${currentPlanPriceTotalFallback} using=${currentPlanPriceTotal} totalDays=${totalDays} daysRemaining=${daysRemaining}`);

    // Precio por día del plan actual (basado en lo que pagó realmente)
    const pricePerDay = currentPlanPriceTotal / totalDays;
    const creditAmount = Math.round(pricePerDay * daysRemaining);

    // Precio total del nuevo plan (el frontend ya aplica descuentos por duración)
    const newPlanTotal = Math.round(newPlanPricePerMonth * newMonths);

    // Monto a cobrar: diferencia, mínimo 0 (hace downgrades gratis si el crédito excede)
    const amountToPay = Math.max(0, newPlanTotal - creditAmount);
    const remainingCredit = Math.max(0, creditAmount - newPlanTotal);

    // Nueva fecha de fin base: hoy + meses nuevos
    let newEndDate = this.calculateExpirationDate(now, newMonths);

    // LÓGICA DE CONVERSIÓN DE VALOR (Excedente a Tiempo)
    // Si el crédito sobra (típico en Downgrade de PRO a BASIC), convertir el restante en días adicionales
    if (remainingCredit > 0) {
      // Calculamos el precio diario del NUEVO plan basándonos en el precio mensual pactado
      const newPlanPricePerDay = newPlanPricePerMonth / 30;
      const extraDays = Math.floor(remainingCredit / newPlanPricePerDay);
      
      if (extraDays > 0) {
        newEndDate.setDate(newEndDate.getDate() + extraDays);
        console.log(`[Proration] Crédito excedente ($${remainingCredit}) convertido en ${extraDays} días extra de ${newPlan}`);
      }
    }

    return {
      daysRemaining,
      creditAmount,
      newPlanTotal,
      amountToPay,
      remainingCredit,
      newEndDate: newEndDate.toISOString(),
      isFree: amountToPay === 0,
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
    forcedEndDate?: string // Opcional: permite al frontend enviar la fecha con días extra
  ): Promise<Brand> {
    const now = new Date();
    
    // Si no viene fecha forzada (con días extra), calculamos la estándar
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
        last_payment_date: now.toISOString(),
        next_payment_date: newEndDate.toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error || !updatedBrand) throw new Error('Error al aplicar cambio de plan: ' + error?.message);

    // Registrar en historial con monto $0 (crédito cubrió todo)
    await this.createPaymentRecord({
      brand_id: brandId,
      amount: 0,
      currency: 'COP',
      payment_date: now.toISOString(),
      payment_method: 'credit_proration',
      status: 'completed',
      months_paid: newMonths,
      notes: `Cambio de plan gratuito por prorrateo. Plan: ${newPlan}. Crédito aplicado: $${creditAmount}. Valor plan: $${newPlanTotal}. Ref: ${reference}`,
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
    // Obtener datos actuales de la marca para verificar estado de la landing
    const { data: brand, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('id, landing_suspended_at, has_landing_page')
      .eq('id', brandId)
      .single();

    if (fetchError || !brand) {
      throw new Error('Marca no encontrada: ' + fetchError?.message);
    }

    // Determinar si se debe restaurar la mini-landing
    let restaurarLanding = false;
    if (brand.landing_suspended_at) {
      const suspendidaHace = Date.now() - new Date(brand.landing_suspended_at).getTime();
      const diasSuspendida = suspendidaHace / (1000 * 60 * 60 * 24);
      // Solo restaurar si han pasado menos de 90 días desde la suspensión
      if (diasSuspendida < 90) {
        restaurarLanding = true;
      }
    }

    const updatePayload: Record<string, unknown> = {
      subscription_status: 'active',
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
  }> {
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Marcar como expired las que vencieron hoy o antes
    const { data: expiredBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'expired' })
      .lte('subscription_end_date', now.toISOString())
      .in('subscription_status', ['active', 'expiring_soon'])
      .select();

    // Marcar como expiring_soon las que vencen en menos de 7 días
    const { data: expiringSoonBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'expiring_soon' })
      .gt('subscription_end_date', now.toISOString())
      .lte('subscription_end_date', sevenDaysFromNow.toISOString())
      .eq('subscription_status', 'active')
      .select();

    // Suspender marcas con suscripción vencida (opcional, puede hacerse manualmente)
    const { data: suspendedBrands } = await supabaseAdmin
      .from('brands')
      .update({ subscription_status: 'suspended' })
      .eq('subscription_status', 'expired')
      .select();

    return {
      expired: expiredBrands?.length || 0,
      expiringSoon: expiringSoonBrands?.length || 0,
      suspended: suspendedBrands?.length || 0,
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
    const { data, error } = await supabaseAdmin
      .from('subscription_payments')
      .insert({
        brand_id: paymentData.brand_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'COP',
        payment_date: paymentData.payment_date || new Date().toISOString(),
        payment_method: paymentData.payment_method || null,
        status: paymentData.status || 'completed',
        notes: paymentData.notes || null,
        months_paid: paymentData.months_paid || 1,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error('Error al registrar el pago: ' + error?.message);
    }

    return data as SubscriptionPayment;
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

    return (data || []) as SubscriptionPayment[];
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

    // Buscar marcas suspendidas cuya suscripción venció hace más de 90 días
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
        // Soft-delete: marcar como eliminada en lugar de borrar físicamente
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
