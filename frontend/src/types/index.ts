// Plan types
export type PlanType = 'BASIC' | 'PRO';

/** Todos los valores de plan que puede tener una marca (incluye TRIAL) */
export type BrandPlan = 'BASIC' | 'PRO' | 'TRIAL';

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
  logo?: string | null;
  coverImageUrl?: string | null;
  plan: PlanType;
  primaryColor: string;
  secondaryColor: string;
  headerColor?: string | null;
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
  trialPaymentStatus?: 'pending_payment' | 'completed' | 'failed' | null;
  trialPaymentMethod?: string | null;
  // Email verification
  emailVerified?: boolean;
  customDomain?: string | null;
  // Contact & Billing (Requirement 503)
  phone?: string | null;
  contactName?: string | null;
  address?: string | null;
  city?: string | null;
  stateProvince?: string | null;
  country?: string | null;
  postalCode?: string | null;
  billingEmail?: string | null;
  nit?: string | null;
  website?: string | null;
  apiKey?: string | null;
  socialLinks?: {
    website?: string;
    allowed_origins?: string[];
    [key: string]: unknown;
  } | null;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string;
  imageUrl: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
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
  externalId?: string | null;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
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
  headerColor?: string | null;
  customDomain?: string | null;
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
    headerColor?: string | null;
    widgetTemplate?: string;
    buttonText?: string;
    welcomeMessage?: string;
    plan?: BrandPlan;
    // Mini-landing (task 33)
    brandDescription?: string | null;
    whatsappContact?: string | null;
    coverImageUrl?: string | null;
      socialLinks?: Record<string, unknown>;
    hasLandingPage?: boolean;
    customDomain?: string | null;
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
  reused?: boolean;
  message?: string;
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

// Analytics types
export * from '../services/analytics.service';
