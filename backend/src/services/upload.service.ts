import axios from 'axios';

export interface UploadImageDto {
  image_base64: string;
  filename: string;
  temporary?: boolean;
}

export interface UploadResponse {
  success: boolean;
  url: string;
  path?: string;
}

export class UploadService {
  private readonly n8nUploadUrl = 'https://pruebalo.wilkiedevs.com/wp-json/n8n/v1/upload';
  private readonly bearerToken = process.env.N8N_BEARER_TOKEN || '';

  async uploadImage(data: UploadImageDto): Promise<UploadResponse> {
    try {
      console.log('[Upload Service] Llamando a WordPress:', {
        url: this.n8nUploadUrl,
        filename: data.filename,
        temporary: data.temporary,
        base64Length: data.image_base64.length
      });

      const response = await axios.post<UploadResponse>(
        this.n8nUploadUrl,
        {
          image_base64: data.image_base64,
          filename: data.filename,
          temporary: data.temporary || false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      console.log('[Upload Service] Respuesta de WordPress:', response.data);

      if (!response.data.success || !response.data.url) {
        throw new Error('Error al subir imagen a WordPress');
      }

      return response.data;
    } catch (error: any) {
      console.error('[Upload Service] Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(error.response?.data?.message || 'Error al subir imagen');
    }
  }
}
