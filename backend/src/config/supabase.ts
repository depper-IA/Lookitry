import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Validar que las variables de entorno existan
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL no está definida en las variables de entorno');
}

if (!process.env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_ANON_KEY no está definida en las variables de entorno');
}

// Cliente de Supabase con anon key (para operaciones normales)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // No persistir sesión en servidor
      autoRefreshToken: false,
    },
  }
);

// Cliente de Supabase con service role key (para operaciones admin)
// Este cliente bypasea RLS y debe usarse con cuidado
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

// Tipos de base de datos (generados automáticamente por Supabase)
export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string;
          email: string;
          password: string;
          name: string;
          slug: string;
          plan: 'BASIC' | 'PRO';
          logo: string | null;
          primary_color: string;
          secondary_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password: string;
          name: string;
          slug: string;
          plan?: 'BASIC' | 'PRO';
          logo?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password?: string;
          name?: string;
          slug?: string;
          plan?: 'BASIC' | 'PRO';
          logo?: string | null;
          primary_color?: string;
          secondary_color?: string;
          created_at?: string;
          updated_at?: string;
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
        };
      };
      generations: {
        Row: {
          id: string;
          brand_id: string;
          product_id: string;
          selfie_url: string;
          result_image_url: string | null;
          status: 'PENDING' | 'SUCCESS' | 'FAILED';
          error_message: string | null;
          generated_at: string;
          processing_time: number | null;
        };
        Insert: {
          id?: string;
          brand_id: string;
          product_id: string;
          selfie_url: string;
          result_image_url?: string | null;
          status?: 'PENDING' | 'SUCCESS' | 'FAILED';
          error_message?: string | null;
          generated_at?: string;
          processing_time?: number | null;
        };
        Update: {
          id?: string;
          brand_id?: string;
          product_id?: string;
          selfie_url?: string;
          result_image_url?: string | null;
          status?: 'PENDING' | 'SUCCESS' | 'FAILED';
          error_message?: string | null;
          generated_at?: string;
          processing_time?: number | null;
        };
      };
    };
  };
}

export default supabase;
