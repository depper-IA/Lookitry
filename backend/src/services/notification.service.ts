import { emailService } from './email.service';
import { SubscriptionService } from './subscription.service';
import { notificationPreferencesService } from './notificationPreferences.service';
import { supabaseAdmin } from '../config/supabase';
import { Brand } from '../types';
import { isTrialOperationalBrand } from '../utils/brandLifecycle';
import {
  welcomeEmail,
  completeRegistrationEmail,
  reminder7DaysEmail,
  reminder3DaysEmail,
  expirationTodayEmail,
  suspensionEmail,
  renewalConfirmationEmail,
  usageAlert80Email,
  usageAlert100Email,
  adminWelcomeEmail,
  landingActivatedEmail,
  landingDeletionWarningEmail,
  landingDeletedNoticeEmail,
  referralBonusCreditedEmail,
  referralConvertedNotifierEmail,
} from '../templates/email-templates';

/**
 * NotificationService
 * 
 * Servicio para enviar notificaciones por email a las marcas.
 * Utiliza EmailService y templates de email para enviar diferentes tipos de notificaciones.
 * Respeta las preferencias de notificaciones de cada marca.
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.10
 */
export class NotificationService {
  private subscriptionService: SubscriptionService;

  constructor() {
    this.subscriptionService = new SubscriptionService();
  }

  /**
   * Formatea un monto en COP (pesos colombianos)
   * 
   * @param amount - Monto numérico
   * @returns Monto formateado como string (ej: "$150.000 COP")
   */
  private formatCOP(amount: number): string {
    return `$${amount.toLocaleString('es-CO')} COP`;
  }

  /**
   * Obtiene el monto del plan de una marca desde pricing_config
   * 
   * @param plan - Tipo de plan ('TRIAL', 'BASIC' o 'PRO')
   * @returns Monto del plan en COP
   */
  private async getPlanAmount(plan: string): Promise<number> {
    try {
      const planUpper = plan.toUpperCase();
      if (planUpper === 'TRIAL') {
        return 20000;
      }

      const planId = plan.toLowerCase(); // 'basic' o 'pro'
      const { data } = await supabaseAdmin
        .from('pricing_config')
        .select('data')
        .eq('id', planId)
        .single();

      if (data?.data?.precio_mensual_cop) {
        const value = data.data.precio_mensual_cop;
        // Sanity check: si por error `pro` quedó con precio de `basic` (o viceversa),
        // usamos fallback para no enviar correos con monto incorrecto.
        if (planUpper === 'PRO' && value < 200000) return 250000;
        if (planUpper === 'BASIC' && value > 200000) return 150000;
        return value;
      }
    } catch (e) {
      console.error('[NotificationService] Error consultando pricing_config:', e);
    }
    // Fallback en caso de error o datos faltantes
    const planUpper = plan.toUpperCase();
    if (planUpper === 'TRIAL') return 20000;
    return planUpper === 'PRO' ? 250000 : 150000;
  }

  private buildPendingRegistrationUrl(reference: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
    return `${frontendUrl}/onboarding-post-pago?ref=${encodeURIComponent(reference)}`;
  }

  /**
   * Envía email de bienvenida al registrarse una nueva marca
   *
   * @param brand - Información de la marca
   * @param skipPreferenceCheck - Si es true omite la verificación de preferencias (para cuentas recién creadas)
   *
   * Requirement 13.1: Enviar email de bienvenida con detalles del plan
   */
  async sendWelcomeEmail(brand: Brand, skipPreferenceCheck = false): Promise<void> {
    try {
      // Para cuentas recién creadas las preferencias aún no existen en BD,
      // así que si skipPreferenceCheck es true, saltamos esa verificación.
      if (!skipPreferenceCheck) {
        const emailEnabled = await notificationPreferencesService.isNotificationEnabled(
          brand.id,
          'email'
        );
        if (!emailEnabled) {
          console.log(`⏭️  Email de bienvenida omitido para ${brand.email} (preferencias)`);
          return;
        }
      }

      const effectivePlan = isTrialOperationalBrand(brand) ? 'TRIAL' : brand.plan;
      const amount = this.formatCOP(await this.getPlanAmount(effectivePlan));
      // getDaysRemaining puede fallar si el plan es TRIAL sin sub activa; usar fallback 7
      let daysRemaining = 7;
      try {
        daysRemaining = await this.subscriptionService.getDaysRemaining(brand.id) || 7;
      } catch {
        // silenciar; la marca puede estar en trial sin suscripción
      }

      const html = welcomeEmail(
        { name: brand.name, email: brand.email },
        effectivePlan,
        amount,
        daysRemaining
      );

      await emailService.sendEmail({
        to: brand.email,
        subject: '¡Bienvenido a Lookitry!',
        html,
      });

      console.log(`✅ Email de bienvenida enviado a ${brand.email}`);
    } catch (error) {
      // No relanzar — el email de bienvenida nunca debe bloquear el flujo de registro
      console.error(`❌ Error al enviar email de bienvenida a ${brand.email}:`, error);
    }
  }

  async sendCompleteRegistrationEmail(pending: {
    email: string;
    reference: string;
    plan: string;
    name?: string | null;
    amount?: number | null;
  }): Promise<void> {
    try {
      const plan = pending.plan.toUpperCase();
      if (!['BASIC', 'PRO'].includes(plan)) {
        return;
      }

      const amount = this.formatCOP(
        typeof pending.amount === 'number' && Number.isFinite(pending.amount)
          ? pending.amount
          : await this.getPlanAmount(plan)
      );
      const html = completeRegistrationEmail(
        {
          name: pending.name?.trim() || pending.email,
          email: pending.email,
        },
        plan,
        amount,
        this.buildPendingRegistrationUrl(pending.reference)
      );

      await emailService.sendEmail({
        to: pending.email,
        subject: 'Completa tu registro en Lookitry',
        html,
      });

      console.log(`✅ Email para completar registro enviado a ${pending.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar email de registro pendiente a ${pending.email}:`, error);
    }
  }

  async sendCompleteRegistrationReminderEmail(pending: {
    email: string;
    reference: string;
    plan: string;
    name?: string | null;
    amount?: number | null;
  }): Promise<void> {
    try {
      const plan = pending.plan.toUpperCase();
      if (!['BASIC', 'PRO'].includes(plan)) {
        return;
      }

      const amount = this.formatCOP(
        typeof pending.amount === 'number' && Number.isFinite(pending.amount)
          ? pending.amount
          : await this.getPlanAmount(plan)
      );
      const html = completeRegistrationEmail(
        {
          name: pending.name?.trim() || pending.email,
          email: pending.email,
        },
        plan,
        amount,
        this.buildPendingRegistrationUrl(pending.reference),
        true
      );

      await emailService.sendEmail({
        to: pending.email,
        subject: 'Recordatorio: completa tu registro en Lookitry',
        html,
      });

      console.log(`✅ Recordatorio de registro pendiente enviado a ${pending.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar recordatorio de registro pendiente a ${pending.email}:`, error);
    }
  }

  /**
   * Envía recordatorio de renovación antes del vencimiento
   * 
   * @param brand - Información de la marca
   * @param daysRemaining - Días restantes hasta el vencimiento
   * 
   * Requirements: 13.2, 13.3, 13.4, 13.9, 13.10
   */
  async sendExpirationReminder(brand: Brand, daysRemaining: number): Promise<void> {
    try {
      // Verificar si el email está habilitado
      const emailEnabled = await notificationPreferencesService.isNotificationEnabled(
        brand.id,
        'email'
      );

      if (!emailEnabled) {
        console.log(`⏭️  Recordatorio omitido para ${brand.email} (email deshabilitado)`);
        return;
      }

      // Verificar preferencias específicas según los días
      if (daysRemaining === 7) {
        const reminder7Enabled = await notificationPreferencesService.isNotificationEnabled(
          brand.id,
          'reminder_7days'
        );
        if (!reminder7Enabled) {
          console.log(`⏭️  Recordatorio 7 días omitido para ${brand.email} (preferencias)`);
          return;
        }
      } else if (daysRemaining === 3) {
        const reminder3Enabled = await notificationPreferencesService.isNotificationEnabled(
          brand.id,
          'reminder_3days'
        );
        if (!reminder3Enabled) {
          console.log(`⏭️  Recordatorio 3 días omitido para ${brand.email} (preferencias)`);
          return;
        }
      }

      const amount = this.formatCOP(await this.getPlanAmount(brand.plan));
      let html: string;
      let subject: string;

      if (daysRemaining === 7) {
        // Recordatorio 7 días antes (urgencia baja)
        html = reminder7DaysEmail(
          { name: brand.name, email: brand.email },
          daysRemaining,
          amount
        );
        subject = 'Recordatorio: Tu suscripción vence en 7 días';
      } else if (daysRemaining === 3) {
        // Recordatorio 3 días antes (urgencia alta)
        html = reminder3DaysEmail(
          { name: brand.name, email: brand.email },
          daysRemaining,
          amount
        );
        subject = '⚠️ Urgente: Tu suscripción vence en 3 días';
      } else if (daysRemaining === 0) {
        // Notificación el día del vencimiento
        html = expirationTodayEmail(
          { name: brand.name, email: brand.email },
          amount
        );
        subject = '🚨 Tu suscripción vence hoy';
      } else {
        // Para otros días, usar template de 7 días con días personalizados
        html = reminder7DaysEmail(
          { name: brand.name, email: brand.email },
          daysRemaining,
          amount
        );
        subject = `Recordatorio: Tu suscripción vence en ${daysRemaining} días`;
      }

      await emailService.sendEmail({
        to: brand.email,
        subject,
        html,
      });

      console.log(`✅ Recordatorio de vencimiento enviado a ${brand.email} (${daysRemaining} días)`);
    } catch (error) {
      console.error(`❌ Error al enviar recordatorio a ${brand.email}:`, error);
      throw error;
    }
  }

  /**
   * Envía notificación de suspensión de cuenta
   * 
   * @param brand - Información de la marca
   * 
   * Requirement 13.5: Enviar notificación de suspensión si no se renueva
   */
  async sendSuspensionNotice(brand: Brand): Promise<void> {
    try {
      // Verificar si el email está habilitado
      const emailEnabled = await notificationPreferencesService.isNotificationEnabled(
        brand.id,
        'email'
      );

      if (!emailEnabled) {
        console.log(`⏭️  Notificación de suspensión omitida para ${brand.email} (preferencias)`);
        return;
      }

      const amount = this.formatCOP(await this.getPlanAmount(brand.plan));

      const html = suspensionEmail(
        { name: brand.name, email: brand.email },
        amount
      );

      await emailService.sendEmail({
        to: brand.email,
        subject: 'Cuenta Suspendida - Acción Requerida',
        html,
      });

      console.log(`✅ Notificación de suspensión enviada a ${brand.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar notificación de suspensión a ${brand.email}:`, error);
      throw error;
    }
  }

  /**
   * Envía confirmación de renovación exitosa
   * 
   * @param brand - Información de la marca
   * 
   * Requirement 13.6: Enviar confirmación de renovación exitosa
   */
  async sendRenewalConfirmation(brand: Brand): Promise<void> {
    try {
      // Verificar si el email está habilitado
      const emailEnabled = await notificationPreferencesService.isNotificationEnabled(
        brand.id,
        'email'
      );

      if (!emailEnabled) {
        console.log(`⏭️  Confirmación de renovación omitida para ${brand.email} (preferencias)`);
        return;
      }

      const amount = this.formatCOP(await this.getPlanAmount(brand.plan));
      const daysRemaining = await this.subscriptionService.getDaysRemaining(brand.id) || 30;
      
      // Obtener información de suscripción para la nueva fecha de vencimiento
      const subscriptionInfo = await this.subscriptionService.getSubscriptionInfo(brand.id);
      const newExpirationDate = subscriptionInfo.endDate 
        ? new Date(subscriptionInfo.endDate).toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'No disponible';

      const html = renewalConfirmationEmail(
        { name: brand.name, email: brand.email },
        newExpirationDate,
        amount,
        daysRemaining
      );

      await emailService.sendEmail({
        to: brand.email,
        subject: '✅ Renovación Exitosa - Lookitry',
        html,
      });

      console.log(`✅ Confirmación de renovación enviada a ${brand.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar confirmación de renovación a ${brand.email}:`, error);
      throw error;
    }
  }

  /**
   * Envía alerta de uso cuando se alcanza un porcentaje del límite mensual
   * 
   * @param brand - Información de la marca
   * @param percentage - Porcentaje de uso alcanzado (80 o 100)
   * @param used - Número de generaciones usadas
   * @param limit - Límite total de generaciones
   * 
   * Requirements: 13.7, 13.8, 13.9, 13.10
   */
  async sendUsageAlert(
    brand: Brand,
    percentage: number,
    used: number,
    limit: number
  ): Promise<void> {
    try {
      // Verificar si las alertas de uso están habilitadas
      const usageAlertsEnabled = await notificationPreferencesService.isNotificationEnabled(
        brand.id,
        'usage_alerts'
      );

      if (!usageAlertsEnabled) {
        console.log(`⏭️  Alerta de uso omitida para ${brand.email} (preferencias)`);
        return;
      }

      const amount = this.formatCOP(await this.getPlanAmount(brand.plan));
      const daysRemaining = await this.subscriptionService.getDaysRemaining(brand.id) || 0;
      let html: string;
      let subject: string;

      if (percentage >= 100) {
        // Alerta 100% - límite alcanzado
        html = usageAlert100Email(
          { name: brand.name, email: brand.email },
          limit,
          daysRemaining,
          amount
        );
        subject = '🚫 Límite de Generaciones Alcanzado';
      } else if (percentage === 80) {
        // Alerta 80% exacto - advertencia
        html = usageAlert80Email(
          { name: brand.name, email: brand.email },
          used,
          limit,
          daysRemaining,
          amount
        );
        subject = '⚠️ Alerta: Has usado el 80% de tus generaciones';
      } else {
        // Para otros porcentajes, usar template de 80% con subject personalizado
        html = usageAlert80Email(
          { name: brand.name, email: brand.email },
          used,
          limit,
          daysRemaining,
          amount
        );
        subject = `⚠️ Alerta: Has usado el ${percentage}% de tus generaciones`;
      }

      await emailService.sendEmail({
        to: brand.email,
        subject,
        html,
      });

      console.log(`✅ Alerta de uso (${percentage}%) enviada a ${brand.email}`);
    } catch (error) {
      console.error(`❌ Error al enviar alerta de uso a ${brand.email}:`, error);
      throw error;
    }
  }
  /**
   * Envía email de bienvenida cuando el admin crea una marca manualmente.
   * Incluye credenciales de acceso y detalles del período de prueba.
   */
  async sendAdminCreatedWelcomeEmail(
    brand: Brand,
    password: string,
    trialDays: number
  ): Promise<void> {
    try {
      const trialEndDate = new Date();
      trialEndDate.setDate(trialEndDate.getDate() + trialDays);
      const formattedDate = trialEndDate.toLocaleDateString('es-CO', {
        day: '2-digit', month: 'long', year: 'numeric',
      });

      const html = adminWelcomeEmail(
        { name: brand.name, email: brand.email },
        password,
        brand.plan,
        trialDays,
        formattedDate
      );

      await emailService.sendEmail({
        to: brand.email,
        subject: 'Bienvenido a Lookitry — Tus datos de acceso',
        html,
      });

      console.log(`Email de bienvenida admin enviado a ${brand.email}`);
    } catch (error) {
      console.error(`Error al enviar email de bienvenida admin a ${brand.email}:`, error);
      throw error;
    }
  }
  /**
   * Envía email de confirmación cuando se activa la mini-landing de una marca.
   *
   * @param brand - Información de la marca
   */
  async sendLandingActivatedEmail(brand: Brand): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
      const landingUrl = `${frontendUrl}/sitio/${(brand as any).slug}`;
      const html = landingActivatedEmail(
        { name: brand.name, email: brand.email },
        landingUrl,
        brand.plan
      );
      await emailService.sendEmail({
        to: brand.email,
        subject: '🎉 ¡Tu mini-landing está activa! — Lookitry',
        html,
      });
      console.log(`[Notification] Email de activación de landing enviado a ${brand.email}`);
    } catch (error) {
      console.error(`[Notification] Error enviando email de activación de landing a ${brand.email}:`, error);
      // No relanzar — no debe bloquear el flujo de pago
    }
  }

  /**
   * Envía aviso previo de eliminación definitiva de mini-landing (a los 75 días de suspensión).
   *
   * @param brand - Información de la marca
   * @param diasRestantes - Días que quedan antes de la eliminación definitiva
   */
  async sendLandingDeletionWarning(brand: Brand, diasRestantes: number): Promise<void> {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'https://lookitry.com';
      const html = landingDeletionWarningEmail(
        { name: brand.name, email: brand.email },
        diasRestantes,
        frontendUrl
      );
      await emailService.sendEmail({
        to: brand.email,
        subject: `Aviso: tu mini-landing será eliminada en ${diasRestantes} días`,
        html,
      });
      console.log(`[Notification] Aviso de eliminación de landing enviado a ${brand.email} (${diasRestantes} días restantes)`);
    } catch (error) {
      console.error(`[Notification] Error enviando aviso de eliminación a ${brand.email}:`, error);
      throw error;
    }
  }

  /**
   * Envía notificación de eliminación definitiva de mini-landing (a los 90 días).
   *
   * @param brand - Información de la marca
   */
  async sendLandingDeletedNotice(brand: Brand): Promise<void> {
    try {
      const html = landingDeletedNoticeEmail({ name: brand.name, email: brand.email });
      await emailService.sendEmail({
        to: brand.email,
        subject: 'Tu mini-landing ha sido eliminada',
        html,
      });
      console.log(`[Notification] Aviso de eliminación definitiva enviado a ${brand.email}`);
    } catch (error) {
      console.error(`[Notification] Error enviando aviso de eliminación definitiva a ${brand.email}:`, error);
      throw error;
    }
  }

  /**
   * Envía email cuando se acredita el bonus de referido a una marca.
   *
   * @param brand - Información de la marca
   * @param months - Meses de bonus acreditados
   */
  async sendReferralBonusCredited(brand: Brand, months: number): Promise<void> {
    try {
      const html = referralBonusCreditedEmail({ name: brand.name, email: brand.email }, months);
      await emailService.sendEmail({
        to: brand.email,
        subject: '🎉 ¡Tu bonus de referido ha sido aplicado!',
        html,
      });
      console.log(`[Notification] Email de bonus de referido enviado a ${brand.email}`);
    } catch (error) {
      console.error(`[Notification] Error enviando email de bonus de referido a ${brand.email}:`, error);
    }
  }

  /**
   * Envía email al referente cuando uno de sus referidos se convierte a plan pago.
   *
   * @param referrer - Información del referente
   * @param referredName - Nombre del referido convertido
   */
  async sendReferralConvertedNotifier(referrer: Brand, referredName: string): Promise<void> {
    try {
      const html = referralConvertedNotifierEmail({ name: referrer.name, email: referrer.email }, referredName);
      await emailService.sendEmail({
        to: referrer.email,
        subject: '🎊 ¡Uno de tus referidos se convirtió!',
        html,
      });
      console.log(`[Notification] Email de referido convertido enviado a ${referrer.email}`);
    } catch (error) {
      console.error(`[Notification] Error enviando email de referido convertido a ${referrer.email}:`, error);
    }
  }
}

// Exportar instancia singleton
export const notificationService = new NotificationService();
