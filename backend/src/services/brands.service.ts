import { supabaseAdmin } from '../config/supabase';
import { Brand } from '../types';
import * as jwt from 'jsonwebtoken';

export interface UpdateBrandDto {
  name?: string;
  slug?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
  header_color?: string | null;
  widget_template?: string;
  button_text?: string;
  welcome_message?: string;
  // Campos de contacto / perfil
  phone?: string;
  contact_name?: string;
  address?: string;
  city?: string;
  country?: string;
  nit?: string;
  website?: string;
  state_province?: string;
  postal_code?: string;
  billing_email?: string;
  // Campos de mini-landing
  brand_description?: string;
  whatsapp_contact?: string;
  cover_image_url?: string;
  social_links?: Record<string, any>;
  has_landing_page?: boolean;
  city_display?: string;
  national_shipping?: boolean;
  whatsapp_message?: string;
  cta_button_text?: string;
  rating?: number;
  total_reviews?: number;
  landing_template?: string;
  landing_font?: string | null;
  widget_bg_color?: string | null;
  schedule?: Record<string, any> | null;
  slogan?: string;
  logo_light?: string | null;
  logo_dark?: string | null;
  cover_bg_color?: string | null;
  cover_overlay_opacity?: number | null;
  modal_title?: string | null;
  modal_description?: string | null;
  modal_features?: string[] | null;
  show_brand_name?: boolean | null;
  custom_domain?: string | null;
}

export class BrandsService {
  async getBrandById(brandId: string): Promise<Brand | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !data) return null;
    return data as Brand;
  }

  async updateBrand(brandId: string, updates: UpdateBrandDto): Promise<Brand> {
    // 1. Validar slug
    if (updates.slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(updates.slug) || updates.slug.length < 3 || updates.slug.length > 50) {
        throw new Error('El slug debe tener entre 3 y 50 caracteres, solo letras minúsculas, números y guiones');
      }
      
      const reservedSlugs = [
        'admin', 'api', 'app', 'blog', 'checkout', 'dashboard', 'home', 'login', 
        'logout', 'register', 'signup', 'signin', 'password', 'reset', 'forgot',
        'account', 'accounts', 'auth', 'authorize', 'callback', 'contact', 'docs',
        'documentation', 'download', 'downloads', 'email', 'help', 'jobs', 'legal',
        'market', 'markets', 'news', 'onboarding', 'payment', 'payments', 'plans',
        'pricing', 'privacy', 'products', 'profile', 'public', 'root', 'secure',
        'security', 'settings', 'shop', 'site', 'sites', 'static', 'support', 'terms',
        'tools', 'trial', 'trial-checkout', 'upload', 'uploads', 'users', 'verify',
        'webhook', 'webhooks', 'www', 'mail', 'superadmin', 'system', 'null', 'undefined',
        'true', 'false', 'none', 'default', 'main', 'test', 'demo', 'dev', 'development',
        'staging', 'stage', 'prod', 'production', 'lookitry', 'mobile', 'desktop'
      ];
      if (reservedSlugs.includes(updates.slug.toLowerCase())) {
        throw new Error('Este slug está reservado. Elige otro.');
      }

      const existing = await this.getBrandBySlug(updates.slug);
      if (existing && existing.id !== brandId) {
        throw new Error('Ese slug ya está en uso por otra marca');
      }
    }

    // 2. Validar colores
    if (updates.primary_color && !this.isValidHexColor(updates.primary_color)) {
      throw new Error('El color primario debe estar en formato hexadecimal (#RRGGBB)');
    }

    // 3. Filtrar campos que podrían no existir en la DB (Blindaje contra Error 500)
    // Obtenemos las columnas reales de la tabla para este entorno
    const { data: sample } = await supabaseAdmin.from('brands').select('*').limit(1).single();
    const validColumns = sample ? Object.keys(sample) : [];
    
    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
      if (validColumns.includes(key) && (updates as any)[key] !== undefined) {
        filteredUpdates[key] = (updates as any)[key];
      }
    });

    // 4. Ejecutar actualización con campos filtrados
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update(filteredUpdates)
      .eq('id', brandId)
      .select()
      .single();

    if (error) {
      console.error('[BrandsService] Error en updateBrand:', error);
      throw new Error('Error al actualizar la marca: ' + error.message);
    }

    if (!data) throw new Error('No se recibieron datos tras la actualización');

    return data as Brand;
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) return null;
    return data as Brand;
  }

  async getBrandByCustomDomain(domain: string): Promise<Brand | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('custom_domain', domain)
      .single();

    if (error || !data) return null;
    return data as Brand;
  }

  private isValidHexColor(color: string): boolean {
    return /^#[0-9A-Fa-f]{6}$/.test(color);
  }

  async getBrandByApiKey(apiKey: string): Promise<Brand | null> {
    if (!apiKey) return null;

    // Tratamiento transparente de JWTs (para el plugin refactorizado con tokens efímeros)
    if (apiKey.startsWith('ey')) {
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        try {
          const decoded = jwt.verify(apiKey, jwtSecret) as any;
          if (decoded.brand_id && decoded.type === 'embed_session') {
            return await this.getBrandById(decoded.brand_id);
          }
        } catch (e) {
          console.warn('[BrandsService] JWT erróneo o expirado recibido como API Key:', (e as Error).message);
          return null;
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error || !data) return null;
    return data as Brand;
  }

  isValidDomain(domain: string): boolean {
    return /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,10}$/i.test(domain);
  }
}
