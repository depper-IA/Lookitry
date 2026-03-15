// Plan types
export type PlanType = 'BASIC' | 'PRO';

export interface Plan {
  type: PlanType;
  maxProducts: number;
  maxGenerationsPerMonth: number;
}

// Brand types
export interface Brand {
  id: string;
  email: string;
  name: string;
  slug: string;
  plan: PlanType;
  logo?: string;
  primaryColor: string;
  secondaryColor: string;
  widgetTemplate?: string;
  buttonText?: string;
  welcomeMessage?: string;
  // Subscription fields
  subscriptionStartDate?: string | null;
  subscriptionEndDate?: string | null;
  subscriptionStatus?: 'active' | 'expiring_soon' | 'expired' | 'suspended' | null;
  lastPaymentDate?: string | null;
  nextPaymentDate?: string | null;
  // Trial fields (Requirement 11 - Opción C)
  trialEndDate?: string | null;
  trialGenerationsLimit?: number;
}

// Product types
export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
}

// Usage types
export interface UsageStats {
  currentMonth: {
    generationsUsed: number;
    generationsLimit: number;
    productsCount: number;
    productsLimit: number;
  };
  percentageUsed: number;
  resetDate: string;
}

// Brand configuration types
export interface UpdateBrandConfigDto {
  name?: string;
  slug?: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  widgetTemplate?: string;
  buttonText?: string;
  welcomeMessage?: string;
}

// Widget templates
export type WidgetTemplate = 'minimal' | 'modern' | 'bold' | 'bare';

export interface TemplateConfig {
  id: WidgetTemplate;
  name: string;
  description: string;
  primaryColor: string;
  secondaryColor: string;
  preview: string; // emoji/icon
  proOnly?: boolean;
}

// Try-On types
export interface TryOnConfigResponse {
  brand: {
    name: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    widgetTemplate?: string;
    buttonText?: string;
    welcomeMessage?: string;
  };
  products: Array<{
    id: string;
    name: string;
    imageUrl: string;
    category: string;
  }>;
}

export interface GenerateTryOnDto {
  productId: string;
  selfieFile: File;
}

export interface GenerateTryOnResponse {
  success: boolean;
  generationId: string;
  imageUrl: string;
  processingTime: number;
}

// Subscription Payments
export interface SubscriptionPayment {
  id: string;
  brandId: string;
  amount: number;
  currency: string;
  paymentDate: string;
  paymentMethod?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
