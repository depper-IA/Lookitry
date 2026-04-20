import { api } from './api';
import type { Brand, UpdateBrandConfigDto } from '@/types';
import type {
  Command,
  Smartphone,
  Cpu,
  Package,
  Globe,
  Sparkles,
  Zap,
  Rocket,
  ChevronRight
} from 'lucide-react';

class BrandsService {
  async getCurrentBrand(): Promise<Brand> {
    const response = await api.get<any>('/brands/me');
    
    // Convertir snake_case a camelCase en la respuesta
    const brandData: Brand = {
      ...response.data,
      primaryColor: response.data.primary_color,
      secondaryColor: response.data.secondary_color,
      widgetTemplate: response.data.widget_template,
      buttonText: response.data.button_text,
      welcomeMessage: response.data.welcome_message,
      subscriptionStartDate: response.data.subscription_start_date,
      subscriptionEndDate: response.data.subscription_end_date,
      subscriptionStatus: response.data.subscription_status,
      lastPaymentDate: response.data.last_payment_date,
      nextPaymentDate: response.data.next_payment_date,
      trialEndDate: response.data.trial_end_date,
      trialGenerationsLimit: response.data.trial_generations_limit,
      reviewPromptShownAt: response.data.review_prompt_shown_at,
      headerColor: response.data.header_color,
      emailVerified: response.data.email_verified,
      hasLandingPage: response.data.has_landing_page,
      has_landing_page: response.data.has_landing_page,
      customDomain: response.data.custom_domain,
      contactName: response.data.contact_name,
      stateProvince: response.data.state_province,
      postalCode: response.data.postal_code,
      billingEmail: response.data.billing_email,
apiKey: response.data.api_key,
      socialLinks: response.data.social_links,
      onboardingDismissed: response.data.onboarding_dismissed,
      shareMessage: response.data.share_message,
      // Widget playlist - map from snake_case
      widgetProductIds: response.data.widget_product_ids || [],
    };

    return brandData;
  }

  async updateMe(data: {
    name?: string;
    phone?: string;
    contact_name?: string;
    address?: string;
    city?: string;
    country?: string;
    state_province?: string;
    postal_code?: string;
    nit?: string;
    billing_email?: string;
    website?: string;
    allowed_origins?: string[];
    logo?: string;
    primary_color?: string;
    secondary_color?: string;
    widget_template?: string;
    button_text?: string;
    welcome_message?: string;
    header_color?: string;
    slug?: string;
  }): Promise<void> {
    await api.patch('/brands/me', data);
  }

  async updateBrand(data: UpdateBrandConfigDto): Promise<Brand> {
    // Convertir camelCase a snake_case para el backend
    const backendData = {
      name: data.name,
      slug: data.slug,
      logo: data.logo,
      primary_color: data.primaryColor,
      secondary_color: data.secondaryColor,
      widget_template: data.widgetTemplate,
      button_text: data.buttonText,
      welcome_message: data.welcomeMessage,
      share_message: data.shareMessage,
      header_color: data.headerColor,
    };
    
    const response = await api.patch<any>('/brands/me', backendData);
    
    // Convertir snake_case a camelCase en la respuesta
    const brandData: Brand = {
      ...response.data,
      primaryColor: response.data.primary_color,
      secondaryColor: response.data.secondary_color,
      widgetTemplate: response.data.widget_template,
      buttonText: response.data.button_text,
      welcomeMessage: response.data.welcome_message,
      subscriptionStartDate: response.data.subscription_start_date,
      subscriptionEndDate: response.data.subscription_end_date,
      subscriptionStatus: response.data.subscription_status,
      lastPaymentDate: response.data.last_payment_date,
      nextPaymentDate: response.data.next_payment_date,
      trialEndDate: response.data.trial_end_date,
      trialGenerationsLimit: response.data.trial_generations_limit,
      reviewPromptShownAt: response.data.review_prompt_shown_at,
      headerColor: response.data.header_color,
      emailVerified: response.data.email_verified,
      hasLandingPage: response.data.has_landing_page,
      has_landing_page: response.data.has_landing_page,
      customDomain: response.data.custom_domain,
      contactName: response.data.contact_name,
      stateProvince: response.data.state_province,
      postalCode: response.data.postal_code,
      billingEmail: response.data.billing_email,
      apiKey: response.data.api_key,
      socialLinks: response.data.social_links,
      onboardingDismissed: response.data.onboarding_dismissed,
    };
    
    return brandData;
  }

  async getLegalRequests(): Promise<{ requests: any[]; data_exports?: any[] }> {
    const response = await api.get<{ requests: any[]; data_exports?: any[] }>('/brands/me/legal-requests');
    return response.data;
  }

  async createLegalRequest(type: string): Promise<{ request: any; requests: any[]; data?: any; data_export?: any; data_exports?: any[] }> {
    const response = await api.post<{ request: any; requests: any[]; data?: any; data_export?: any; data_exports?: any[] }>('/brands/me/legal-requests', { type });
    return response.data;
  }

  async createTrialEvent(eventName: string, metadata?: Record<string, unknown>): Promise<void> {
    await api.post('/brands/me/trial-events', { eventName, metadata });
  }

  async updateConfig(data: { onboardingDismissed?: boolean }): Promise<void> {
    const backendData: any = {};
    if (data.onboardingDismissed !== undefined) {
      backendData.onboarding_dismissed = data.onboardingDismissed;
    }
    await api.patch('/brands/me', backendData);
  }
}

export const brandsService = new BrandsService();
