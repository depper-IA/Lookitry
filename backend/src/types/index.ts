// Tipos de base de datos
export interface Brand {
  id: string;
  email: string;
  password: string;
  name: string;
  slug: string;
  plan: 'BASIC' | 'PRO';
  logo: string | null;
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
  created_at: string;
  updated_at: string;
  custom_domain: string | null;
}

export interface Product {
  id: string;
  brand_id: string;
  name: string;
  description: string | null;
  image_url: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Generation {
  id: string;
  brand_id: string;
  product_id: string;
  selfie_url: string;
  result_image_url: string | null;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  error_message: string | null;
  generated_at: string;
  processing_time: number | null;
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
}

export interface AuthResponse {
  token: string;
  brand: {
    id: string;
    email: string;
    name: string;
    slug: string;
    plan: string;
    emailVerified?: boolean;
    trialEndDate?: string | null;
    trialPaymentStatus?: string | null;
  };
  verificationToken?: string;
  requireCardVerification?: boolean;
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
  brandId: string;
  productId: string;
  selfieBase64: string;
  productImageUrl: string;
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
