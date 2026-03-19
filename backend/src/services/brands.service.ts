import { supabaseAdmin } from '../config/supabase';
import { Brand } from '../types';

export interface UpdateBrandDto {
  name?: string;
  slug?: string;
  logo?: string;
  primary_color?: string;
  secondary_color?: string;
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
  // Campos de mini-landing (task 33)
  brand_description?: string;
  whatsapp_contact?: string;
  cover_image_url?: string;
  social_links?: Record<string, string>;
  has_landing_page?: boolean;
  // Nuevos campos de mini-landing (task 5)
  city_display?: string;
  national_shipping?: boolean;
  whatsapp_message?: string;
  cta_button_text?: string;
  rating?: number;
  total_reviews?: number;
  landing_template?: string;
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
}

export class BrandsService {
  async getBrandById(brandId: string): Promise<Brand | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Brand;
  }

  async updateBrand(brandId: string, updates: UpdateBrandDto): Promise<Brand> {
    // Validar slug si se proporciona
    if (updates.slug !== undefined) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(updates.slug) || updates.slug.length < 3) {
        throw new Error('El slug solo puede contener letras minúsculas, números y guiones, con mínimo 3 caracteres');
      }
      // Verificar unicidad
      const existing = await this.getBrandBySlug(updates.slug);
      if (existing && existing.id !== brandId) {
        throw new Error('Ese slug ya está en uso por otra marca');
      }
    }

    // Validar colores hexadecimales si se proporcionan
    if (updates.primary_color && !this.isValidHexColor(updates.primary_color)) {
      throw new Error('El color primario debe estar en formato hexadecimal (#RRGGBB)');
    }

    if (updates.secondary_color && !this.isValidHexColor(updates.secondary_color)) {
      throw new Error('El color secundario debe estar en formato hexadecimal (#RRGGBB)');
    }

    // Intentar actualización completa primero
    const { data, error } = await supabaseAdmin
      .from('brands')
      .update(updates)
      .eq('id', brandId)
      .select()
      .single();

    if (error) {
      // Si el error es por columnas inexistentes (widget_template, button_text, welcome_message),
      // reintentar solo con los campos base que siempre existen
      const isColumnError = error.message?.includes('column') ||
        error.code === '42703' ||
        error.message?.includes('widget_template') ||
        error.message?.includes('button_text') ||
        error.message?.includes('welcome_message');

      if (isColumnError) {
        console.warn('[BrandsService] Columnas de widget no existen aún. Actualizando solo campos base.');
        const baseUpdates: Partial<UpdateBrandDto> = {};
        if (updates.name !== undefined) baseUpdates.name = updates.name;
        if (updates.logo !== undefined) baseUpdates.logo = updates.logo;
        if (updates.primary_color !== undefined) baseUpdates.primary_color = updates.primary_color;
        if (updates.secondary_color !== undefined) baseUpdates.secondary_color = updates.secondary_color;

        if (Object.keys(baseUpdates).length === 0) {
          // Nada que actualizar en campos base, devolver datos actuales
          const current = await this.getBrandById(brandId);
          if (!current) throw new Error('Marca no encontrada');
          return current;
        }

        const { data: fallbackData, error: fallbackError } = await supabaseAdmin
          .from('brands')
          .update(baseUpdates)
          .eq('id', brandId)
          .select()
          .single();

        if (fallbackError || !fallbackData) {
          throw new Error('Error al actualizar la marca: ' + fallbackError?.message);
        }
        return fallbackData as Brand;
      }

      throw new Error('Error al actualizar la marca: ' + error.message);
    }

    if (!data) {
      throw new Error('Error al actualizar la marca: sin datos de respuesta');
    }

    return data as Brand;
  }

  async getBrandBySlug(slug: string): Promise<Brand | null> {
    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Brand;
  }

  private isValidHexColor(color: string): boolean {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexColorRegex.test(color);
  }
}
