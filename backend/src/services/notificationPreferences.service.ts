import { supabaseAdmin } from '../config/supabase';
import { NotificationPreferences, UpdateNotificationPreferencesDto } from '../types';

/**
 * NotificationPreferencesService
 * 
 * Servicio para gestionar las preferencias de notificaciones de las marcas.
 * Permite a las marcas configurar qué notificaciones desean recibir.
 * 
 * Requirement: 13.10
 */
export class NotificationPreferencesService {
  /**
   * Obtiene las preferencias de notificaciones de una marca
   * Si no existen, las crea con valores por defecto
   * 
   * @param brandId - ID de la marca
   * @returns Preferencias de notificaciones
   */
  async getPreferences(brandId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (error) {
      // Si no existen preferencias, crearlas con valores por defecto
      if (error.code === 'PGRST116') {
        return this.createDefaultPreferences(brandId);
      }
      throw new Error(`Error al obtener preferencias: ${error.message}`);
    }

    return data;
  }

  /**
   * Crea preferencias por defecto para una marca
   * 
   * @param brandId - ID de la marca
   * @returns Preferencias creadas
   */
  private async createDefaultPreferences(brandId: string): Promise<NotificationPreferences> {
    const defaultPreferences = {
      brand_id: brandId,
      email_enabled: true,
      whatsapp_enabled: false, // No implementado aún
      reminder_7days: true,
      reminder_3days: true,
      usage_alerts: true,
    };

    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .insert(defaultPreferences)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear preferencias por defecto: ${error.message}`);
    }

    return data;
  }

  /**
   * Actualiza las preferencias de notificaciones de una marca
   * 
   * @param brandId - ID de la marca
   * @param updates - Campos a actualizar
   * @returns Preferencias actualizadas
   */
  async updatePreferences(
    brandId: string,
    updates: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences> {
    // Verificar que hay algo que actualizar
    if (Object.keys(updates).length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    // Validar que los valores sean booleanos
    for (const [key, value] of Object.entries(updates)) {
      if (typeof value !== 'boolean') {
        throw new Error(`El campo ${key} debe ser un valor booleano`);
      }
    }

    // Verificar si existen preferencias, si no, crearlas primero
    await this.getPreferences(brandId);

    // Actualizar preferencias
    const { data, error } = await supabaseAdmin
      .from('notification_preferences')
      .update(updates)
      .eq('brand_id', brandId)
      .select()
      .single();

    if (error) {
      throw new Error(`Error al actualizar preferencias: ${error.message}`);
    }

    return data;
  }

  /**
   * Verifica si una marca tiene habilitado un tipo específico de notificación
   * 
   * @param brandId - ID de la marca
   * @param notificationType - Tipo de notificación a verificar
   * @returns true si la notificación está habilitada
   */
  async isNotificationEnabled(
    brandId: string,
    notificationType: 'email' | 'whatsapp' | 'reminder_7days' | 'reminder_3days' | 'usage_alerts'
  ): Promise<boolean> {
    const preferences = await this.getPreferences(brandId);

    switch (notificationType) {
      case 'email':
        return preferences.email_enabled;
      case 'whatsapp':
        return preferences.whatsapp_enabled;
      case 'reminder_7days':
        return preferences.reminder_7days && preferences.email_enabled;
      case 'reminder_3days':
        return preferences.reminder_3days && preferences.email_enabled;
      case 'usage_alerts':
        return preferences.usage_alerts && preferences.email_enabled;
      default:
        return false;
    }
  }

  /**
   * Elimina las preferencias de una marca (usado al eliminar marca)
   * 
   * @param brandId - ID de la marca
   */
  async deletePreferences(brandId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('notification_preferences')
      .delete()
      .eq('brand_id', brandId);

    if (error) {
      throw new Error(`Error al eliminar preferencias: ${error.message}`);
    }
  }
}

// Exportar instancia singleton
export const notificationPreferencesService = new NotificationPreferencesService();
