// Tipos de base de datos

export interface Brand {

  id: string;

  email: string;

  password: string;

  name: string;

  slug: string;

  plan: 'BASIC' | 'PRO' | 'ENTERPRISE' | 'TRIAL';

  logo: string | null;

  api_key: string | null; // Token para integraciones externas

  primary_color: string;

  secondary_color: string;

  header_color: string | null;

  // Campos de personalización del widget (Requirement 25)

  widget_template: string | null;

  button_text: string | null;

  welcome_message: string | null;

  // Campos de suscripción

  subscription_start_date: string | null;

  subscription_end_date: string | null;

  subscription_status: 'active' | 'expiring_soon' | 'expired' | 'suspended' | null;

  last_payment_date: string | null;

  next_payment_date: string | null;

  // Campos de período de prueba (Requirement 11 - Opción C)

  trial_end_date: string | null;

  trial_generations_limit: number;

  trial_payment_status?: 'pending_payment' | 'completed' | 'active' | 'failed' | null;

  email_verified?: boolean;

  email_verification_token?: string | null;

  email_verified_at?: string | null;

  has_landing_page?: boolean;

  extra_credits_balance?: number;

  review_prompt_shown_at?: string | null;

  created_at: string;

  updated_at: string;

  custom_domain: string | null;

  onboarding_dismissed?: boolean;

}



export type ReviewStatus = 'pending' | 'approved' | 'rejected';



export interface BrandReview {

  id: string;

  brand_id: string;

  rating: number;

  comment: string;

  reviewer_name: string;

  reviewer_plan: string;

  status: ReviewStatus;

  is_featured: boolean;

  admin_note: string | null;

  avatar_url: string | null;

  created_at: string;

  updated_at: string;

}



export interface CreateReviewDto {

  rating: number;

  comment: string;

}



export interface UpdateReviewModerationDto {

  status?: Exclude<ReviewStatus, 'pending'>;

  is_featured?: boolean;

  admin_note?: string | null;

}



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



export interface Product {

  id: string;

  brand_id: string;

  name: string;

  description: string | null;

  image_url: string;

  category: string;

  is_active: boolean;

  external_id: string | null; // ID de plataforma externa (WordPress, Shopify, etc.)

  created_at: string;

  updated_at: string;

}



export interface Generation {

  id: string;

  brand_id: string;

  product_id: string;

  selfie_url: string;

  input_fingerprint: string | null;

  result_image_url: string | null;

  status: 'PENDING' | 'SUCCESS' | 'FAILED';

  error_message: string | null;

  generated_at: string;

  processing_time: number | null;

  client_fingerprint: string | null;

}



// DTOs

export interface RegisterBrandDto {

  email: string;

  password: string;

  name: string;

  slug: string;

  contact_name: string;  // Nombre completo del responsable — obligatorio

  phone?: string;        // Teléfono — opcional

}



export interface LoginDto {

  email: string;

  password: string;

  ip?: string;        // IP del cliente para auditoría

  fingerprint?: string; // Fingerprint anti-abuso

}



export interface AuthResponse {
  token: string;
  refreshToken?: string;
  brand: {

    id: string;

    email: string;

    name: string;

    slug: string;

    plan: string;

    api_key?: string | null;

    emailVerified?: boolean;

    trialEndDate?: string | null;

    trialPaymentStatus?: string | null;

  };

  verificationToken?: string;

  requiresTrialPayment?: boolean;

  isTrial?: boolean;

}



// JWT Payload

export interface JwtPayload {

  brandId?: string;

  adminId?: string;

  email: string;

  iat?: number;

  exp?: number;

}



// Request con brand autenticada

export interface AuthRequest extends Request {

  brand?: {

    id: string;

    email: string;

  };

}



// N8n Integration

export interface N8nWebhookPayload {

  brand_id: string;

  product_id: string;

  selfie_url: string;

  product_image_url: string;

  prompt: string;

}



export interface N8nWebhookResponse {

  success: boolean;

  imageUrl?: string;

  error?: string;

}



// Subscription Payments

export interface SubscriptionPayment {

  id: string;

  brand_id: string;

  amount: number;

  currency: string;

  payment_date: string;

  payment_method: string | null;

  status: 'completed' | 'pending' | 'failed' | 'refunded';

  notes: string | null;

  created_at: string;

  updated_at: string;

}



export interface CreatePaymentDto {

  brand_id: string;

  amount: number;

  currency?: string;

  payment_date?: string;

  payment_method?: string;

  status?: 'completed' | 'pending' | 'failed' | 'refunded';

  notes?: string;

  months_paid?: number;

  reference?: string;

  ledger_snapshot?: unknown;

}



// Notification Preferences

export interface NotificationPreferences {

  id: string;

  brand_id: string;

  email_enabled: boolean;

  whatsapp_enabled: boolean;

  reminder_7days: boolean;

  reminder_3days: boolean;

  usage_alerts: boolean;

  created_at: string;

  updated_at: string;

}



export interface UpdateNotificationPreferencesDto {

  email_enabled?: boolean;

  whatsapp_enabled?: boolean;

  reminder_7days?: boolean;

  reminder_3days?: boolean;

  usage_alerts?: boolean;

}

