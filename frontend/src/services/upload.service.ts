import { api } from './api';

interface UploadImageResponse {
  success: boolean;
  url: string;
  path?: string;
}

class UploadService {
  async uploadImage(imageBase64: string, filename: string, temporary: boolean = false): Promise<string> {
    console.log('[UploadService] 🚀 INICIO uploadImage');
    console.log('[UploadService] 📦 Parámetros:', { 
      filename, 
      temporary, 
      base64Length: imageBase64.length,
      base64Preview: imageBase64.substring(0, 50) + '...'
    });
    
    try {
      console.log('[UploadService] 🔵 Llamando a api.post /products/upload...');
      const response = await api.post<UploadImageResponse>('/products/upload', {
        image_base64: imageBase64,
        filename,
        temporary,
      });

      console.log('[UploadService] ✅ Respuesta recibida:', response.data);
      console.log('[UploadService] 📊 Status:', response.status);

      if (!response.data.success || !response.data.url) {
        console.error('[UploadService] ❌ Respuesta inválida:', response.data);
        throw new Error('Error al subir imagen');
      }

      console.log('[UploadService] ✅ URL de imagen:', response.data.url);
      return response.data.url;
    } catch (error: any) {
      console.error('[UploadService] ❌ ERROR en uploadImage:', error);
      console.error('[UploadService] ❌ Error response:', error.response?.data);
      console.error('[UploadService] ❌ Error status:', error.response?.status);
      throw error;
    }
  }
}

export const uploadService = new UploadService();
