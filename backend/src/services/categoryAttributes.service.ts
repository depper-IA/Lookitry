import { supabaseAdmin } from '../config/supabase';

export interface AttributeDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'tags' | 'boolean';
  options?: string[]; // para select y tags
}

export interface CategoryAttribute {
  id: string;
  categoryKey: string;
  categoryLabel: string;
  attributes: AttributeDefinition[];
  createdAt: string;
  updatedAt: string;
}

export class CategoryAttributesService {
  /**
   * Obtener los atributos definidos para una categoría específica
   */
  async getAttributesByCategory(category: string): Promise<CategoryAttribute | null> {
    // Normalizar la categoría (minúsculas, sin espacios extra)
    const normalizedCategory = category.toLowerCase().trim();

    // Primero intentar coincidencia exacta
    let { data, error } = await supabaseAdmin
      .from('category_attributes')
      .select('*')
      .eq('category_key', normalizedCategory)
      .single();

    // Si no hay coincidencia exacta, buscar por clave que contenga el texto
    if (error || !data) {
      // Intentar buscar por clave parcial (para categorías like "vestido" matching "vestido")
      const { data: partialData } = await supabaseAdmin
        .from('category_attributes')
        .select('*')
        .ilike('category_key', `%${normalizedCategory}%`)
        .limit(1);

      if (partialData && partialData.length > 0) {
        data = partialData[0];
      }
    }

    // Si aún no hay match, devolver los atributos de "general"
    if (!data) {
      const { data: generalData } = await supabaseAdmin
        .from('category_attributes')
        .select('*')
        .eq('category_key', 'general')
        .single();

      if (generalData) {
        data = generalData;
      }
    }

    if (!data) {
      return null;
    }

    return {
      id: data.id,
      categoryKey: data.category_key,
      categoryLabel: data.category_label,
      attributes: data.attributes as AttributeDefinition[],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Obtener todos los atributos de todas las categorías
   */
  async getAllCategoryAttributes(): Promise<CategoryAttribute[]> {
    const { data, error } = await supabaseAdmin
      .from('category_attributes')
      .select('*')
      .order('category_label');

    if (error) {
      throw new Error('Error al obtener atributos de categorías: ' + error.message);
    }

    return (data || []).map(item => ({
      id: item.id,
      categoryKey: item.category_key,
      categoryLabel: item.category_label,
      attributes: item.attributes as AttributeDefinition[],
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));
  }

  /**
   * Crear o actualizar la definición de atributos para una categoría
   */
  async upsertCategoryAttributes(
    categoryKey: string,
    categoryLabel: string,
    attributes: AttributeDefinition[]
  ): Promise<CategoryAttribute> {
    const { data, error } = await supabaseAdmin
      .from('category_attributes')
      .upsert({
        category_key: categoryKey.toLowerCase().trim(),
        category_label: categoryLabel.trim(),
        attributes,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error('Error al guardar atributos de categoría: ' + error.message);
    }

    return {
      id: data.id,
      categoryKey: data.category_key,
      categoryLabel: data.category_label,
      attributes: data.attributes as AttributeDefinition[],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  /**
   * Eliminar la definición de atributos de una categoría
   */
  async deleteCategoryAttributes(categoryKey: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('category_attributes')
      .delete()
      .eq('category_key', categoryKey.toLowerCase().trim());

    if (error) {
      throw new Error('Error al eliminar atributos de categoría: ' + error.message);
    }
  }
}
