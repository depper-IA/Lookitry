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
  // Email verification
  emailVerified?: boolean;
}

// Product types
export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
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
    id: string;
    name: string;
    slug: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
    widgetTemplate?: string;
    buttonText?: string;
    welcomeMessage?: string;
    plan?: string;
    // Mini-landing (task 33)
    brandDescription?: string | null;
    whatsappContact?: string | null;
    coverImageUrl?: string | null;
    socialLinks?: Record<string, string>;
    hasLandingPage?: boolean;
  };
  products: Array<{
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    description?: string;
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
