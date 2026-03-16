import { api } from './api';

interface UploadImageResponse {
  success: boolean;
  url: string;
  path?: string;
}

class UploadService {
  async uploadImage(imageBase64: string, filename: string, temporary: boolean = false): Promise<string> {
    const response = await api.post<UploadImageResponse>('/products/upload', {
      image_base64: imageBase64,
      filename,
      temporary,
    });

    if (!response.data.success || !response.data.url) {
      throw new Error('Error al subir imagen');
    }

    return response.data.url;
  }
}

export const uploadService = new UploadService();
