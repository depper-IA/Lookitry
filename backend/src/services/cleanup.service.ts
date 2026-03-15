import axios from 'axios';
import { supabase } from '../config/supabase';

interface CleanupConfig {
  productImageRetentionDays: number; // Días para mantener imágenes de productos
  deleteOrphanImages: boolean; // Eliminar imágenes sin producto asociado
}

export class CleanupService {
  private readonly wpDeleteUrl = 'https://pruebalo.wilkiedevs.com/wp-json/n8n/v1/delete';
  private readonly bearerToken = process.env.N8N_BEARER_TOKEN || '';
  
  private config: CleanupConfig = {
    productImageRetentionDays: 30, // Por defecto 30 días
    deleteOrphanImages: true,
  };

  /**
   * Limpia imágenes de productos que han sido eliminados (soft delete)
   */
  async cleanupDeletedProductImages(): Promise<{ deleted: number; errors: number }> {
    try {
      console.log('[Cleanup] Iniciando limpieza de imágenes de productos eliminados...');

      // Obtener productos eliminados (deleted_at no es null)
      const { data: deletedProducts, error } = await supabase
        .from('products')
        .select('id, image_url, deleted_at')
        .not('deleted_at', 'is', null);

      if (error) {
        console.error('[Cleanup] Error al obtener productos eliminados:', error);
        return { deleted: 0, errors: 1 };
      }

      if (!deletedProducts || deletedProducts.length === 0) {
        console.log('[Cleanup] No hay productos eliminados para limpiar');
        return { deleted: 0, errors: 0 };
      }

      let deleted = 0;
      let errors = 0;

      for (const product of deletedProducts) {
        try {
          // Solo eliminar si la imagen está en nuestro dominio
          if (product.image_url && product.image_url.includes('pruebalo.wilkiedevs.com')) {
            await this.deleteImageFromWordPress(product.image_url);
            deleted++;
            console.log(`[Cleanup] ✅ Imagen eliminada: ${product.image_url}`);
          }
        } catch (err) {
          console.error(`[Cleanup] ❌ Error al eliminar imagen ${product.image_url}:`, err);
          errors++;
        }
      }

      console.log(`[Cleanup] Limpieza completada: ${deleted} eliminadas, ${errors} errores`);
      return { deleted, errors };
    } catch (error) {
      console.error('[Cleanup] Error en cleanupDeletedProductImages:', error);
      return { deleted: 0, errors: 1 };
    }
  }

  /**
   * Limpia imágenes antiguas según la política de retención
   */
  async cleanupOldProductImages(): Promise<{ deleted: number; errors: number }> {
    try {
      console.log('[Cleanup] Iniciando limpieza de imágenes antiguas...');

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.productImageRetentionDays);

      // Obtener productos antiguos eliminados
      const { data: oldProducts, error } = await supabase
        .from('products')
        .select('id, image_url, deleted_at')
        .not('deleted_at', 'is', null)
        .lt('deleted_at', cutoffDate.toISOString());

      if (error) {
        console.error('[Cleanup] Error al obtener productos antiguos:', error);
        return { deleted: 0, errors: 1 };
      }

      if (!oldProducts || oldProducts.length === 0) {
        console.log('[Cleanup] No hay imágenes antiguas para limpiar');
        return { deleted: 0, errors: 0 };
      }

      let deleted = 0;
      let errors = 0;

      for (const product of oldProducts) {
        try {
          if (product.image_url && product.image_url.includes('pruebalo.wilkiedevs.com')) {
            await this.deleteImageFromWordPress(product.image_url);
            deleted++;
            console.log(`[Cleanup] ✅ Imagen antigua eliminada: ${product.image_url}`);
          }
        } catch (err) {
          console.error(`[Cleanup] ❌ Error al eliminar imagen ${product.image_url}:`, err);
          errors++;
        }
      }

      console.log(`[Cleanup] Limpieza de antiguas completada: ${deleted} eliminadas, ${errors} errores`);
      return { deleted, errors };
    } catch (error) {
      console.error('[Cleanup] Error en cleanupOldProductImages:', error);
      return { deleted: 0, errors: 1 };
    }
  }

  /**
   * Elimina una imagen de WordPress usando el endpoint del plugin
   */
  private async deleteImageFromWordPress(imageUrl: string): Promise<void> {
    try {
      const response = await axios.delete(
        this.wpDeleteUrl,
        {
          data: { url: imageUrl },
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (!response.data.success) {
        throw new Error('WordPress no pudo eliminar la imagen');
      }
    } catch (error: any) {
      // Si el archivo ya no existe (404), no es un error crítico
      if (error.response?.status === 404 || error.response?.data?.message?.includes('no existía')) {
        console.log(`[Cleanup] Imagen ya no existe: ${imageUrl}`);
        return;
      }
      throw error;
    }
  }

  /**
   * Ejecuta todas las tareas de limpieza
   */
  async runFullCleanup(): Promise<{ totalDeleted: number; totalErrors: number }> {
    console.log('[Cleanup] 🧹 Iniciando limpieza completa...');

    const result1 = await this.cleanupDeletedProductImages();
    const result2 = await this.cleanupOldProductImages();

    const totalDeleted = result1.deleted + result2.deleted;
    const totalErrors = result1.errors + result2.errors;

    console.log(`[Cleanup] 🧹 Limpieza completa finalizada: ${totalDeleted} eliminadas, ${totalErrors} errores`);

    return { totalDeleted, totalErrors };
  }

  /**
   * Configura los parámetros de limpieza
   */
  setConfig(config: Partial<CleanupConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[Cleanup] Configuración actualizada:', this.config);
  }
}
