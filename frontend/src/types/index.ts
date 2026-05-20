// Plan types
export type PlanType = 'BASIC' | 'PRO' | 'ENTERPRISE';

/** Todos los valores de plan que puede tener una marca (incluye TRIAL) */
export type BrandPlan = 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL';

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
  plan: BrandPlan;
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
  // Trial fields
  trialEndDate?: string | null;
  trialGenerationsLimit?: number;
  trialPaymentStatus?: 'pending_payment' | 'completed' | 'active' | 'failed' | null;
  trialPaymentMethod?: string | null;
  extraCreditsBalance?: number;
  reviewPromptShownAt?: string | null;
  // Email verification
  emailVerified?: boolean;
  hasLandingPage?: boolean;
  has_landing_page?: boolean;
  customDomain?: string | null;
  // Contact & Billing
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
  onboardingDismissed?: boolean;
  shareMessage?: string | null;
  // Widget playlist (featured products)
  widgetProductIds?: string[];
  widgetCoverImage?: string | null;
  whatsappContact?: string | null;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PublicReview {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  reviewer_plan: string;
  is_featured: boolean;
  created_at: string;
  avatar_url: string | null;
}

export interface MyReview extends PublicReview {
  brand_id: string;
  status: ReviewStatus;
  admin_note: string | null;
  updated_at: string;
}

export interface AdminReview extends MyReview {}

export interface CreateReviewDto {
  rating: number;
  comment: string;
}

export interface ModerateReviewDto {
  status?: 'approved' | 'rejected';
  is_featured?: boolean;
  admin_note?: string | null;
}

export interface PublicReviewsResponse {
  reviews: PublicReview[];
  total_approved: number;
}

export interface AdminReviewsResponse {
  reviews: AdminReview[];
  total: number;
  page: number;
  totalPages: number;
}

// Product types
export interface Product {
  id: string;
  brandId: string;
  name: string;
  description?: string; // IA description - solo para admin
  shortDescription?: string; // Visible para clientes
  imageUrl: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
  attributes?: Record<string, any>; // Atributos dinámicos
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Producto simplificado para uso en widgets/frontend (sin campos de admin)
export interface ProductWidget {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  description?: string;
  shortDescription?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
  attributes?: Record<string, any>;
}

export interface CreateProductDto {
  name: string;
  description?: string; // IA description - interno
  short_description?: string; // Visible para clientes
  imageUrl: string;
  category: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
  attributes?: Record<string, any>;
}

export interface UpdateProductDto {
  name?: string;
  description?: string;
  short_description?: string;
  imageUrl?: string;
  category?: string;
  price?: number | null;
  badge?: 'nuevo' | 'top' | 'oferta' | null;
  externalId?: string | null;
  attributes?: Record<string, any>;
}

// Category Attributes types
export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'tags' | 'boolean';
  options?: string[];
}

export interface CategoryAttribute {
  id: string;
  categoryKey: string;
  categoryLabel: string;
  attributes: AttributeDefinition[];
  createdAt: string;
  updatedAt: string;
}

// Usage types
export interface UsageStats {
  currentMonth: {
    generationsUsed: number;
    generationsLimit: number;
    generationsRemaining: number;
    productsCount: number;
    productsLimit: number;
  };
  extraCreditsBalance: number;
  availableCredits: number;
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
  brandDescription?: string | null; // Used by AI descriptor to generate product descriptions
  shareMessage?: string; // Custom share text for social media (PRO/ENTERPRISE)
  headerColor?: string | null;
  customDomain?: string | null;
  onboardingDismissed?: boolean;
  widgetCoverImage?: string | null; // PRO: imagen de portada exclusiva del widget
  whatsappContact?: string | null; // WhatsApp para CTA de compra en resultado
}

// Widget templates
export type WidgetTemplate = 'minimal' | 'modern' | 'bold' | 'bare' | 'showcase';

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
    shareMessage?: string | null; // Custom share text for social media (PRO/ENTERPRISE)
    plan?: BrandPlan;
    brandDescription?: string | null;
    whatsappContact?: string | null;
    coverImageUrl?: string | null;
    socialLinks?: Record<string, unknown>;
    hasLandingPage?: boolean;
    customDomain?: string | null;
    widgetCoverImage?: string | null; // PRO: imagen de portada exclusiva del widget
  };
  products: Array<{
    id: string;
    name: string;
    imageUrl: string;
    category: string;
    description?: string; // Mantenemos para uso interno
    shortDescription?: string; // Descripción visible para clientes
    price?: number | null; // Precio del producto
    badge?: 'nuevo' | 'top' | 'oferta' | null; // Badge del producto
    externalId?: string | null; // ID de plataforma externa
    attributes?: Record<string, any>; // Atributos dinámicos
  }>;
}

export interface GenerateTryOnDto {
  productId: string;
  selfieFile: File;
  clientFingerprint?: string;
  termsAccepted?: boolean;
}

export interface GenerateTryOnResponse {
  success: boolean;
  generationId: string;
  imageUrl: string;
  processingTime: number;
  reused?: boolean;
  message?: string;
  error?: string;
  attemptsUsed?: number;
  attemptsLimit?: number;
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
  amount_original?: number;
  amount_cop?: number;
  currency: string;
  exchange_rate_used?: number | null;
  paymentDate: string;
  paymentMethod?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Analytics types
export * from '../services/analytics.service';
