import { api } from './api';
import type { Brand, SubscriptionPayment, PlanType } from '@/types';

export interface SubscriptionDetails {
  status: string;
  startDate: string | null;
  endDate: string | null;
  lastPaymentDate: string | null;
  nextPaymentDate: string | null;
  daysRemaining: number | null;
  isInTrial: boolean;
  trialEndDate: string | null;
  trialDaysRemaining: number | null;
}

export interface SubscriptionResponse {
  subscription: SubscriptionDetails;
  payments: SubscriptionPayment[];
}

export interface SubscriptionInfo {
  brand: Brand;
  plan: PlanType;
  hasLandingPage: boolean;
  daysRemaining: number;
  status: 'active' | 'expiring_soon' | 'expired' | 'suspended' | null;
  isInTrial: boolean;
  trialDaysRemaining: number | null;
  trialEndDate: string | null;
}

class SubscriptionService {
  async getSubscriptionInfo(): Promise<SubscriptionInfo> {
    const brandResponse = await api.get<any>('/brands/me');
    const rawBrand = brandResponse.data;

    const brand: Brand = {
      ...rawBrand,
      primaryColor: rawBrand.primary_color,
      secondaryColor: rawBrand.secondary_color,
      widgetTemplate: rawBrand.widget_template,
      buttonText: rawBrand.button_text,
      welcomeMessage: rawBrand.welcome_message,
      subscriptionStartDate: rawBrand.subscription_start_date,
      subscriptionEndDate: rawBrand.subscription_end_date,
      subscriptionStatus: rawBrand.subscription_status,
      lastPaymentDate: rawBrand.last_payment_date,
      nextPaymentDate: rawBrand.next_payment_date,
      trialEndDate: rawBrand.trial_end_date,
      trialGenerationsLimit: rawBrand.trial_generations_limit,
    };

    const subscriptionResponse = await api.get<SubscriptionResponse>('/brands/subscription');
    const { subscription } = subscriptionResponse.data;

    return {
      brand,
      plan: (rawBrand.plan ?? 'BASIC') as PlanType,
      hasLandingPage: rawBrand.has_landing_page ?? false,
      daysRemaining: subscription.daysRemaining ?? 0,
      status: (subscription.status as 'active' | 'expiring_soon' | 'expired' | 'suspended') || null,
      isInTrial: subscription.isInTrial ?? false,
      trialDaysRemaining: subscription.trialDaysRemaining ?? null,
      trialEndDate: subscription.trialEndDate ?? null,
    };
  }

  async getPayments(): Promise<SubscriptionPayment[]> {
    const response = await api.get<any>('/brands/me/payments');
    // El backend retorna { payments: [...] }
    const rawPayments = Array.isArray(response.data?.payments)
      ? response.data.payments
      : Array.isArray(response.data)
        ? response.data
        : [];
    
    return rawPayments.map((p: any) => ({
      id: p.id,
      brandId: p.brand_id,
      amount: p.amount,
      amount_original: p.amount_original,
      amount_cop: p.amount_cop,
      currency: p.currency,
      exchange_rate_used: p.exchange_rate_used,
      paymentDate: p.payment_date,
      paymentMethod: p.payment_method,
      status: p.status,
      notes: p.notes,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
  }
}

export const subscriptionService = new SubscriptionService();
