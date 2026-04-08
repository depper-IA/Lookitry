import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL no está definida en las variables de entorno');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY no está definida en las variables de entorno');
}

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

const serviceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceKey) {
  console.error('[Supabase] ERROR CRÍTICO: No se encontró SUPABASE_SERVICE_KEY ni SUPABASE_SERVICE_ROLE_KEY en el entorno.');
}

export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  serviceKey || 'INVALID_KEY',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export type PlanType = 'BASIC' | 'PRO' | 'TRIAL' | 'ENTERPRISE' | 'LANDING';
export type GenerationStatus = 'PENDING' | 'SUCCESS' | 'FAILED';
export type SubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'suspended' | 'trial';
export type DiscountType = 'pct' | 'fixed';
export type PromotionType = 'modal_timer' | 'coupon' | 'banner' | 'plan_override' | 'launch_offer';
export type GenerationErrorType = 'wrong_clothing_removed' | 'wrong_clothing_kept' | 'body_distortion' | 'color_wrong' | 'product_not_applied' | 'background_changed' | 'other';

export interface Database {
  public: {
    Tables: {
      admin_notification_preferences: {
        Row: {
          id: string;
          type: string;
          enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          enabled?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          enabled?: boolean;
          updated_at?: string;
        };
      };
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          message: string;
          severity: string;
          brand_id: string | null;
          brand_name: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          message: string;
          severity?: string;
          brand_id?: string | null;
          brand_name?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          message?: string;
          severity?: string;
          brand_id?: string | null;
          brand_name?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      admins: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          role: string | null;
          created_at: string | null;
          updated_at: string | null;
          permissions: string[] | null;
          google_id: string | null;
          auth_provider: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          permissions?: string[] | null;
          google_id?: string | null;
          auth_provider?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          role?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          permissions?: string[] | null;
          google_id?: string | null;
          auth_provider?: string | null;
        };
      };
      addon_packages: {
        Row: {
          id: string;
          name: string;
          credits_amount: number;
          price_cop: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          credits_amount: number;
          price_cop: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          credits_amount?: number;
          price_cop?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      blog_categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          created_at?: string | null;
        };
      };
      blog_settings: {
        Row: {
          id: number;
          frequency: string;
          is_enabled: boolean;
          next_run: string;
          last_run: string | null;
          webhook_url: string | null;
          webhook_secret: string;
          created_at: string;
          updated_at: string;
          openrouter_article_model: string | null;
          image_generation_provider: string | null;
          openrouter_image_model: string | null;
          image_generator_webhook: string | null;
        };
        Insert: {
          id?: number;
          frequency: string;
          is_enabled?: boolean;
          next_run?: string;
          last_run?: string | null;
          webhook_url?: string | null;
          webhook_secret?: string;
          created_at?: string;
          updated_at?: string;
          openrouter_article_model?: string | null;
          image_generation_provider?: string | null;
          openrouter_image_model?: string | null;
          image_generator_webhook?: string | null;
        };
        Update: {
          id?: number;
          frequency?: string;
          is_enabled?: boolean;
          next_run?: string;
          last_run?: string | null;
          webhook_url?: string | null;
          webhook_secret?: string;
          created_at?: string;
          updated_at?: string;
          openrouter_article_model?: string | null;
          image_generation_provider?: string | null;
          openrouter_image_model?: string | null;
          image_generator_webhook?: string | null;
        };
      };
      blog_topics: {
        Row: {
          id: string;
          title: string;
          category_slug: string | null;
          keywords: string | null;
          meta_description: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
          source_url: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          category_slug?: string | null;
          keywords?: string | null;
          meta_description?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          source_url?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          category_slug?: string | null;
          keywords?: string | null;
          meta_description?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          source_url?: string | null;
        };
      };
      blogs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          content: string;
          excerpt: string | null;
          meta_description: string | null;
          featured_image: string | null;
          category_id: string | null;
          tags: string[] | null;
          status: string | null;
          author_id: string | null;
          published_at: string | null;
          created_at: string | null;
          updated_at: string | null;
          topic_id: string | null;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          content: string;
          excerpt?: string | null;
          meta_description?: string | null;
          featured_image?: string | null;
          category_id?: string | null;
          tags?: string[] | null;
          status?: string | null;
          author_id?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          topic_id?: string | null;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          content?: string;
          excerpt?: string | null;
          meta_description?: string | null;
          featured_image?: string | null;
          category_id?: string | null;
          tags?: string[] | null;
          status?: string | null;
          author_id?: string | null;
          published_at?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          topic_id?: string | null;
        };
      };
      brand_reviews: {
        Row: {
          id: string;
          brand_id: string;
          rating: number;
          comment: string;
          reviewer_name: string;
          reviewer_plan: string;
          status: string;
          is_featured: boolean;
          admin_note: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          rating: number;
          comment: string;
          reviewer_name: string;
          reviewer_plan: string;
          status?: string;
          is_featured?: boolean;
          admin_note?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          rating?: number;
          comment?: string;
          reviewer_name?: string;
          reviewer_plan?: string;
          status?: string;
          is_featured?: boolean;
          admin_note?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          slug: string;
          plan: PlanType;
          logo: string | null;
          primary_color: string;
          secondary_color: string;
          created_at: string;
          updated_at: string;
          phone: string | null;
          address: string | null;
          city: string | null;
          country: string | null;
          contact_name: string;
          subscription_start_date: string | null;
          subscription_end_date: string | null;
          subscription_status: SubscriptionStatus | null;
          last_payment_date: string | null;
          next_payment_date: string | null;
          widget_template: string | null;
          button_text: string | null;
          welcome_message: string | null;
          trial_end_date: string | null;
          trial_generations_limit: number | null;
          nit: string | null;
          website: string | null;
          trial_payment_status: string | null;
          email_verified: boolean;
          email_verification_token: string | null;
          brand_description: string | null;
          whatsapp_contact: string | null;
          cover_image_url: string | null;
          social_links: Record<string, unknown> | null;
          has_landing_page: boolean | null;
          city_display: string | null;
          national_shipping: boolean | null;
          whatsapp_message: string | null;
          cta_button_text: string | null;
          rating: number | null;
          total_reviews: number | null;
          landing_template: string | null;
          schedule: Record<string, unknown> | null;
          slogan: string | null;
          landing_suspended_at: string | null;
          logo_light: string | null;
          logo_dark: string | null;
          reset_token: string | null;
          reset_token_expires_at: string | null;
          cover_bg_color: string | null;
          cover_overlay_opacity: number | null;
          show_brand_name: boolean | null;
          upgrade_requested_at: string | null;
          landing_font: string | null;
          widget_bg_color: string | null;
          api_key: string | null;
          state_province: string | null;
          postal_code: string | null;
          billing_email: string | null;
          extra_credits_balance: number;
          review_prompt_shown_at: string | null;
          internal_notes: string | null;
          google_id: string | null;
          auth_provider: string | null;
          needs_onboarding: boolean | null;
          referral_code: string | null;
          referral_count: number | null;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          slug: string;
          plan?: PlanType;
          logo?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          contact_name?: string;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          subscription_status?: SubscriptionStatus | null;
          last_payment_date?: string | null;
          next_payment_date?: string | null;
          widget_template?: string | null;
          button_text?: string | null;
          welcome_message?: string | null;
          trial_end_date?: string | null;
          trial_generations_limit?: number | null;
          nit?: string | null;
          website?: string | null;
          trial_payment_status?: string | null;
          email_verified?: boolean;
          email_verification_token?: string | null;
          brand_description?: string | null;
          whatsapp_contact?: string | null;
          cover_image_url?: string | null;
          social_links?: Record<string, unknown> | null;
          has_landing_page?: boolean | null;
          city_display?: string | null;
          national_shipping?: boolean | null;
          whatsapp_message?: string | null;
          cta_button_text?: string | null;
          rating?: number | null;
          total_reviews?: number | null;
          landing_template?: string | null;
          schedule?: Record<string, unknown> | null;
          slogan?: string | null;
          landing_suspended_at?: string | null;
          logo_light?: string | null;
          logo_dark?: string | null;
          reset_token?: string | null;
          reset_token_expires_at?: string | null;
          cover_bg_color?: string | null;
          cover_overlay_opacity?: number | null;
          show_brand_name?: boolean | null;
          upgrade_requested_at?: string | null;
          landing_font?: string | null;
          widget_bg_color?: string | null;
          api_key?: string | null;
          state_province?: string | null;
          postal_code?: string | null;
          billing_email?: string | null;
          extra_credits_balance?: number;
          review_prompt_shown_at?: string | null;
          internal_notes?: string | null;
          google_id?: string | null;
          auth_provider?: string | null;
          needs_onboarding?: boolean | null;
          referral_code?: string | null;
          referral_count?: number | null;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          slug?: string;
          plan?: PlanType;
          logo?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
          updated_at?: string;
          phone?: string | null;
          address?: string | null;
          city?: string | null;
          country?: string | null;
          contact_name?: string;
          subscription_start_date?: string | null;
          subscription_end_date?: string | null;
          subscription_status?: SubscriptionStatus | null;
          last_payment_date?: string | null;
          next_payment_date?: string | null;
          widget_template?: string | null;
          button_text?: string | null;
          welcome_message?: string | null;
          trial_end_date?: string | null;
          trial_generations_limit?: number | null;
          nit?: string | null;
          website?: string | null;
          trial_payment_status?: string | null;
          email_verified?: boolean;
          email_verification_token?: string | null;
          brand_description?: string | null;
          whatsapp_contact?: string | null;
          cover_image_url?: string | null;
          social_links?: Record<string, unknown> | null;
          has_landing_page?: boolean | null;
          city_display?: string | null;
          national_shipping?: boolean | null;
          whatsapp_message?: string | null;
          cta_button_text?: string | null;
          rating?: number | null;
          total_reviews?: number | null;
          landing_template?: string | null;
          schedule?: Record<string, unknown> | null;
          slogan?: string | null;
          landing_suspended_at?: string | null;
          logo_light?: string | null;
          logo_dark?: string | null;
          reset_token?: string | null;
          reset_token_expires_at?: string | null;
          cover_bg_color?: string | null;
          cover_overlay_opacity?: number | null;
          show_brand_name?: boolean | null;
          upgrade_requested_at?: string | null;
          landing_font?: string | null;
          widget_bg_color?: string | null;
          api_key?: string | null;
          state_province?: string | null;
          postal_code?: string | null;
          billing_email?: string | null;
          extra_credits_balance?: number;
          review_prompt_shown_at?: string | null;
          internal_notes?: string | null;
          google_id?: string | null;
          auth_provider?: string | null;
          needs_onboarding?: boolean | null;
          referral_code?: string | null;
          referral_count?: number | null;
        };
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          max_uses: number | null;
          uses_count: number;
          expires_at: string | null;
          plan_ids: string[];
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_type: DiscountType;
          discount_value: number;
          max_uses?: number | null;
          uses_count?: number;
          expires_at?: string | null;
          plan_ids?: string[];
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          discount_type?: DiscountType;
          discount_value?: number;
          max_uses?: number | null;
          uses_count?: number;
          expires_at?: string | null;
          plan_ids?: string[];
          active?: boolean;
          created_at?: string;
        };
      };
      enterprise_sync_configs: {
        Row: {
          id: string;
          brand_id: string | null;
          sync_type: string;
          source_url: string;
          api_key: string | null;
          field_map: Record<string, unknown> | null;
          active: boolean;
          last_sync_at: string | null;
          last_sync_status: string | null;
          last_sync_message: string | null;
          products_synced_count: number | null;
          notes: string | null;
          created_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id?: string | null;
          sync_type?: string;
          source_url: string;
          api_key?: string | null;
          field_map?: Record<string, unknown> | null;
          active?: boolean;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          last_sync_message?: string | null;
          products_synced_count?: number | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string | null;
          sync_type?: string;
          source_url?: string;
          api_key?: string | null;
          field_map?: Record<string, unknown> | null;
          active?: boolean;
          last_sync_at?: string | null;
          last_sync_status?: string | null;
          last_sync_message?: string | null;
          products_synced_count?: number | null;
          notes?: string | null;
          created_at?: string | null;
          updated_at?: string;
        };
      };
      generation_feedback: {
        Row: {
          id: string;
          generation_id: string | null;
          brand_id: string | null;
          error_type: GenerationErrorType;
          description: string | null;
          product_category: string | null;
          prompt_used: string | null;
          embedding: unknown | null;
          resolved: boolean;
          resolved_at: string | null;
          resolved_by: string | null;
          created_at: string;
          updated_at: string;
          content: string | null;
          metadata: Record<string, unknown> | null;
        };
        Insert: {
          id?: string;
          generation_id?: string | null;
          brand_id?: string | null;
          error_type?: GenerationErrorType;
          description?: string | null;
          product_category?: string | null;
          prompt_used?: string | null;
          embedding?: unknown | null;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
          content?: string | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          id?: string;
          generation_id?: string | null;
          brand_id?: string | null;
          error_type?: GenerationErrorType;
          description?: string | null;
          product_category?: string | null;
          prompt_used?: string | null;
          embedding?: unknown | null;
          resolved?: boolean;
          resolved_at?: string | null;
          resolved_by?: string | null;
          created_at?: string;
          updated_at?: string;
          content?: string | null;
          metadata?: Record<string, unknown> | null;
        };
      };
      generations: {
        Row: {
          id: string;
          brand_id: string;
          product_id: string;
          selfie_url: string;
          result_image_url: string | null;
          status: GenerationStatus;
          error_message: string | null;
          generated_at: string;
          processing_time: number | null;
          prompt_used: string | null;
          input_fingerprint: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          product_id: string;
          selfie_url: string;
          result_image_url?: string | null;
          status?: GenerationStatus;
          error_message?: string | null;
          generated_at?: string;
          processing_time?: number | null;
          prompt_used?: string | null;
          input_fingerprint?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          product_id?: string;
          selfie_url?: string;
          result_image_url?: string | null;
          status?: GenerationStatus;
          error_message?: string | null;
          generated_at?: string;
          processing_time?: number | null;
          prompt_used?: string | null;
          input_fingerprint?: string | null;
        };
      };
      payment_logs: {
        Row: {
          id: string;
          created_at: string;
          event_type: string;
          gateway: string;
          reference: string | null;
          brand_id: string | null;
          transaction_id: string | null;
          amount_cents: number | null;
          currency: string | null;
          status: string;
          payload: Record<string, unknown> | null;
          error_message: string | null;
          processed_at: string | null;
          ip_address: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          event_type: string;
          gateway: string;
          reference?: string | null;
          brand_id?: string | null;
          transaction_id?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          status: string;
          payload?: Record<string, unknown> | null;
          error_message?: string | null;
          processed_at?: string | null;
          ip_address?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          event_type?: string;
          gateway?: string;
          reference?: string | null;
          brand_id?: string | null;
          transaction_id?: string | null;
          amount_cents?: number | null;
          currency?: string | null;
          status?: string;
          payload?: Record<string, unknown> | null;
          error_message?: string | null;
          processed_at?: string | null;
          ip_address?: string | null;
        };
      };
      payment_settings: {
        Row: {
          id: number;
          wompi_enabled: boolean;
          wompi_public_key: string;
          wompi_private_key: string;
          wompi_events_secret: string;
          wompi_integrity_secret: string;
          wompi_test_mode: boolean;
          paypal_enabled: boolean;
          paypal_email: string;
          paypal_client_id: string;
          paypal_client_secret: string;
          paypal_sandbox: boolean;
          manual_enabled: boolean;
          manual_instructions: string;
          manual_bank_name: string;
          manual_account_number: string;
          manual_account_holder: string;
          manual_whatsapp: string;
          manual_email: string;
          transfer_enabled: boolean;
          transfer_bank_name: string;
          transfer_account_number: string;
          transfer_account_type: string;
          transfer_account_holder: string;
          transfer_nit: string;
          currency: string;
          updated_at: string;
          landing_price: number;
          landing_original_price: number;
          bypass_ip_protection: boolean;
          ip_whitelist: string;
          wompi_prod_public_key: string;
          wompi_prod_private_key: string;
          wompi_prod_events_secret: string;
          wompi_prod_integrity_secret: string;
          modal_promo_config: Record<string, unknown> | null;
          modal_title: string | null;
          modal_description: string | null;
          modal_image_url: string | null;
          mini_landing_preview_seconds: number | null;
          maintenance_mode: boolean | null;
          maintenance_message: string | null;
          paypal_prod_client_id: string | null;
          paypal_prod_client_secret: string | null;
        };
        Insert: {
          id?: number;
          wompi_enabled?: boolean;
          wompi_public_key?: string;
          wompi_private_key?: string;
          wompi_events_secret?: string;
          wompi_integrity_secret?: string;
          wompi_test_mode?: boolean;
          paypal_enabled?: boolean;
          paypal_email?: string;
          paypal_client_id?: string;
          paypal_client_secret?: string;
          paypal_sandbox?: boolean;
          manual_enabled?: boolean;
          manual_instructions?: string;
          manual_bank_name?: string;
          manual_account_number?: string;
          manual_account_holder?: string;
          manual_whatsapp?: string;
          manual_email?: string;
          transfer_enabled?: boolean;
          transfer_bank_name?: string;
          transfer_account_number?: string;
          transfer_account_type?: string;
          transfer_account_holder?: string;
          transfer_nit?: string;
          currency?: string;
          updated_at?: string;
          landing_price?: number;
          landing_original_price?: number;
          bypass_ip_protection?: boolean;
          ip_whitelist?: string;
          wompi_prod_public_key?: string;
          wompi_prod_private_key?: string;
          wompi_prod_events_secret?: string;
          wompi_prod_integrity_secret?: string;
          modal_promo_config?: Record<string, unknown> | null;
          modal_title?: string | null;
          modal_description?: string | null;
          modal_image_url?: string | null;
          mini_landing_preview_seconds?: number | null;
          maintenance_mode?: boolean | null;
          maintenance_message?: string | null;
          paypal_prod_client_id?: string | null;
          paypal_prod_client_secret?: string | null;
        };
        Update: {
          id?: number;
          wompi_enabled?: boolean;
          wompi_public_key?: string;
          wompi_private_key?: string;
          wompi_events_secret?: string;
          wompi_integrity_secret?: string;
          wompi_test_mode?: boolean;
          paypal_enabled?: boolean;
          paypal_email?: string;
          paypal_client_id?: string;
          paypal_client_secret?: string;
          paypal_sandbox?: boolean;
          manual_enabled?: boolean;
          manual_instructions?: string;
          manual_bank_name?: string;
          manual_account_number?: string;
          manual_account_holder?: string;
          manual_whatsapp?: string;
          manual_email?: string;
          transfer_enabled?: boolean;
          transfer_bank_name?: string;
          transfer_account_number?: string;
          transfer_account_type?: string;
          transfer_account_holder?: string;
          transfer_nit?: string;
          currency?: string;
          updated_at?: string;
          landing_price?: number;
          landing_original_price?: number;
          bypass_ip_protection?: boolean;
          ip_whitelist?: string;
          wompi_prod_public_key?: string;
          wompi_prod_private_key?: string;
          wompi_prod_events_secret?: string;
          wompi_prod_integrity_secret?: string;
          modal_promo_config?: Record<string, unknown> | null;
          modal_title?: string | null;
          modal_description?: string | null;
          modal_image_url?: string | null;
          mini_landing_preview_seconds?: number | null;
          maintenance_mode?: boolean | null;
          maintenance_message?: string | null;
          paypal_prod_client_id?: string | null;
          paypal_prod_client_secret?: string | null;
        };
      };
      paypal_orders: {
        Row: {
          id: string;
          reference: string;
          brand_id: string | null;
          email: string | null;
          plan: string;
          months: number;
          amount_cop: number;
          trm: number;
          amount_usd_expected: number;
          order_id: string | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          reference: string;
          brand_id?: string | null;
          email?: string | null;
          plan: string;
          months: number;
          amount_cop: number;
          trm: number;
          amount_usd_expected: number;
          order_id?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          reference?: string;
          brand_id?: string | null;
          email?: string | null;
          plan?: string;
          months?: number;
          amount_cop?: number;
          trm?: number;
          amount_usd_expected?: number;
          order_id?: string | null;
          status?: string | null;
          created_at?: string | null;
        };
      };
      pending_registrations: {
        Row: {
          id: string;
          email: string;
          reference: string;
          plan: string;
          months: number;
          created_at: string | null;
          includes_landing: boolean;
          status: string | null;
          payment_id: string | null;
          updated_at: string | null;
          brand_name: string | null;
          amount: number;
          reminder_sent_at: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          reference: string;
          plan: string;
          months: number;
          created_at?: string | null;
          includes_landing?: boolean;
          status?: string | null;
          payment_id?: string | null;
          updated_at?: string | null;
          brand_name?: string | null;
          amount?: number;
          reminder_sent_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          reference?: string;
          plan?: string;
          months?: number;
          created_at?: string | null;
          includes_landing?: boolean;
          status?: string | null;
          payment_id?: string | null;
          updated_at?: string | null;
          brand_name?: string | null;
          amount?: number;
          reminder_sent_at?: string | null;
        };
      };
      plugin_telemetry_events: {
        Row: {
          id: string;
          brand_id: string;
          source: string;
          event_name: string;
          endpoint: string;
          success: boolean;
          status_code: number | null;
          duration_ms: number;
          retry_count: number;
          error_message: string | null;
          store_domain: string | null;
          product_external_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          source?: string;
          event_name: string;
          endpoint: string;
          success?: boolean;
          status_code?: number | null;
          duration_ms?: number;
          retry_count?: number;
          error_message?: string | null;
          store_domain?: string | null;
          product_external_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          source?: string;
          event_name?: string;
          endpoint?: string;
          success?: boolean;
          status_code?: number | null;
          duration_ms?: number;
          retry_count?: number;
          error_message?: string | null;
          store_domain?: string | null;
          product_external_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      pricing_config: {
        Row: {
          id: string;
          data: Record<string, unknown>;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          data: Record<string, unknown>;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          data?: Record<string, unknown>;
          updated_at?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          description: string | null;
          image_url: string;
          category: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          price: number | null;
          badge: string | null;
          external_id: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          description?: string | null;
          image_url: string;
          category: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          price?: number | null;
          badge?: string | null;
          external_id?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          description?: string | null;
          image_url?: string;
          category?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          price?: number | null;
          badge?: string | null;
          external_id?: string | null;
        };
      };
      promotions: {
        Row: {
          id: string;
          type: PromotionType;
          name: string;
          config: Record<string, unknown>;
          active: boolean;
          starts_at: string | null;
          ends_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: PromotionType;
          name: string;
          config?: Record<string, unknown>;
          active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: PromotionType;
          name?: string;
          config?: Record<string, unknown>;
          active?: boolean;
          starts_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
        };
      };
      referrals: {
        Row: {
          id: string;
          referrer_brand_id: string;
          referred_brand_id: string;
          referral_code: string;
          bonus_months: number | null;
          bonus_credited: boolean | null;
          bonus_credited_at: string | null;
          referrer_claimed: boolean | null;
          referred_claimed: boolean | null;
          referrer_claimed_at: string | null;
          referred_claimed_at: string | null;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
          reward_credits: number;
          converted_at: string | null;
          conversion_payment_reference: string | null;
        };
        Insert: {
          id?: string;
          referrer_brand_id: string;
          referred_brand_id: string;
          referral_code: string;
          bonus_months?: number | null;
          bonus_credited?: boolean | null;
          bonus_credited_at?: string | null;
          referrer_claimed?: boolean | null;
          referred_claimed?: boolean | null;
          referrer_claimed_at?: string | null;
          referred_claimed_at?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          reward_credits?: number;
          converted_at?: string | null;
          conversion_payment_reference?: string | null;
        };
        Update: {
          id?: string;
          referrer_brand_id?: string;
          referred_brand_id?: string;
          referral_code?: string;
          bonus_months?: number | null;
          bonus_credited?: boolean | null;
          bonus_credited_at?: string | null;
          referrer_claimed?: boolean | null;
          referred_claimed?: boolean | null;
          referrer_claimed_at?: string | null;
          referred_claimed_at?: string | null;
          status?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
          reward_credits?: number;
          converted_at?: string | null;
          conversion_payment_reference?: string | null;
        };
      };
      subscription_payments: {
        Row: {
          id: string;
          brand_id: string;
          amount: number;
          currency: string;
          payment_date: string;
          payment_method: string | null;
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
          months_paid: number;
          reference: string | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          amount: number;
          currency?: string;
          payment_date?: string;
          payment_method?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          months_paid?: number;
          reference?: string | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          amount?: number;
          currency?: string;
          payment_date?: string;
          payment_method?: string | null;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          months_paid?: number;
          reference?: string | null;
        };
      };
      trial_campaigns: {
        Row: {
          id: string;
          name: string;
          active: boolean;
          trial_days: number;
          ends_at: string | null;
          require_card_verification: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
          trial_generations_limit: number;
          price_cop: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          active?: boolean;
          trial_days?: number;
          ends_at?: string | null;
          require_card_verification?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          trial_generations_limit?: number;
          price_cop?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          active?: boolean;
          trial_days?: number;
          ends_at?: string | null;
          require_card_verification?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          trial_generations_limit?: number;
          price_cop?: number | null;
        };
      };
      trial_registrations: {
        Row: {
          id: string;
          brand_id: string;
          campaign_id: string;
          ip_address: string;
          fingerprint: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          campaign_id: string;
          ip_address: string;
          fingerprint?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          campaign_id?: string;
          ip_address?: string;
          fingerprint?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export default supabase;
