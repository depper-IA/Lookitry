import { api } from './api';
import type { Brand, UpdateBrandConfigDto } from '@/types';

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
    nit?: string;
    website?: string;
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
    };
    
    return brandData;
  }
}

export const brandsService = new BrandsService();
