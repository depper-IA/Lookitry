import axios from 'axios';
import { N8nWebhookPayload, N8nWebhookResponse } from '../types';

/**
 * Cliente para integración con n8n workflow
 * Maneja la comunicación con el webhook de n8n para generación de imágenes
 */
export class N8nClient {
  private webhookUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor() {
    // Configurar desde variables de entorno
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || '';
    this.apiKey = process.env.N8N_API_KEY || '';
    this.timeout = 90000; // 90 segundos (Gemini puede tardar)

    // Validar configuración
    if (!this.webhookUrl) {
      console.warn('⚠️  N8N_WEBHOOK_URL no está configurado');
    }

    if (!this.apiKey) {
      console.warn('⚠️  N8N_API_KEY no está configurado');
    }
  }

  /**
   * Llamar al webhook de n8n para generar imagen de try-on
   * @param payload Datos necesarios para la generación
   * @returns Respuesta con URL de imagen generada o error
   */
  async callTryOnWebhook(payload: N8nWebhookPayload): Promise<N8nWebhookResponse> {
    // Validar que la configuración esté completa
    if (!this.webhookUrl || !this.apiKey) {
      throw new Error('Configuración de n8n incompleta. Verifica N8N_WEBHOOK_URL y N8N_API_KEY');
    }

    try {
      console.log(`🔄 Llamando a n8n webhook para brand_id: ${payload.brand_id}, product_id: ${payload.product_id}`);

      const response = await axios.post<N8nWebhookResponse>(
        this.webhookUrl,
        {
          brand_id: payload.brand_id,
          product_id: payload.product_id,
          selfie_url: payload.selfie_url,
          product_image_url: payload.product_image_url,
          prompt: payload.prompt,
        },
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.N8N_BEARER_TOKEN}`,
          },
        }
      );

      console.log('✅ Respuesta exitosa de n8n');
      return response.data;

    } catch (error: any) {
      // Manejar errores específicos de axios
      if (axios.isAxiosError(error)) {
        // Timeout
        if (error.code === 'ECONNABORTED') {
          console.error('⏱️  Timeout: La generación tardó más de 90 segundos');
          throw new Error('Timeout: La generación tardó más de 90 segundos');
        }

        // Error de respuesta del servidor
        if (error.response) {
          const status: number = error.response.status;
          const errorMessage = error.response.data?.error || error.response.data?.message || error.message;
          console.error(`[n8n] Error HTTP ${status}:`, errorMessage, '| body:', JSON.stringify(error.response.data ?? {}));

          // Crear error enriquecido con statusCode para que el controller lo detecte
          const enriched = new Error(`n8n error ${status}: ${errorMessage}`) as any;
          enriched.statusCode = status;
          enriched.n8nBody = error.response.data;
          throw enriched;
        }

        // Error de conexión
        if (error.request) {
          console.error('❌ Error de conexión con n8n');
          throw new Error('Error de conexión: No se pudo conectar con el servicio de n8n');
        }
      }

      // Error genérico
      console.error('❌ Error desconocido al llamar a n8n:', error.message);
      throw new Error(`Error al conectar con n8n: ${error.message}`);
    }
  }

  /**
   * Verificar si el cliente está configurado correctamente
   */
  isConfigured(): boolean {
    return !!(this.webhookUrl && this.apiKey);
  }

  /**
   * Obtener información de configuración (sin exponer credenciales)
   */
  getConfigInfo(): { configured: boolean; webhookUrl: string; timeout: number } {
    return {
      configured: this.isConfigured(),
      webhookUrl: this.webhookUrl ? '***configurado***' : 'no configurado',
      timeout: this.timeout,
    };
  }
}
