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

    this.apiKey = process.env.N8N_BEARER_TOKEN || process.env.N8N_API_KEY || '';

    this.timeout = 90000; // 90 segundos (Gemini puede tardar)



    // Validar configuración

    if (!this.webhookUrl) {

      console.warn('â ï¸  N8N_WEBHOOK_URL no está configurado');

    }



    if (!this.apiKey) {

      console.warn('â ï¸  N8N_BEARER_TOKEN / N8N_API_KEY no están configurados');

    }

  }



  /**

   * Llamar al webhook de n8n para generar descripción del producto

   */

  async callDescriptionWebhook(payload: { brand_id: string; product_id: string; product_image_url: string }): Promise<{ success: boolean; description?: string; error?: string }> {

    const webhookUrl = process.env.N8N_DESCRIPTOR_URL || 'https://n8n.wilkiedevs.com/webhook/descriptor';

    if (!webhookUrl) throw new Error('N8N_DESCRIPTOR_URL no configurado');



    try {

      const response = await axios.post<{ success: boolean; description?: string; error?: string }>(

        webhookUrl,

        payload,

        {

          timeout: this.timeout,

          headers: {

            'Content-Type': 'application/json',

            'Authorization': `Bearer ${this.apiKey}`,

          },

        }

      );

      return response.data;

    } catch (error: any) {

      console.error('â Error al llamar a n8n para descripción:', error.message);

      return { success: false, error: error.message };

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

      throw new Error('Configuración de n8n incompleta. Verifica N8N_WEBHOOK_URL y N8N_BEARER_TOKEN / N8N_API_KEY');

    }



    const MAX_RETRIES = 3;

    const RETRY_DELAYS = [2000, 4000, 8000]; // ms



    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {

      try {

        console.log(`ð Llamando a n8n webhook para brand_id: ${payload.brand_id}, product_id: ${payload.product_id} (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);

        console.log(`ð¦ Payload enviado:`, JSON.stringify({

          brand_id: payload.brand_id,

          product_id: payload.product_id,

          selfie_url: payload.selfie_url,

          product_image_url: payload.product_image_url,

          prompt: (payload.prompt || '').substring(0, 100) + '...',

        }, null, 2));



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

              'Authorization': `Bearer ${this.apiKey}`,

            },

          }

        );



        console.log('â Respuesta exitosa de n8n');

        return response.data;



      } catch (error: any) {

        const isLastAttempt = attempt === MAX_RETRIES;

        const isRetryableError = this.isRetryableError(error);



        if (isRetryableError && !isLastAttempt) {

          const delay = RETRY_DELAYS[attempt] || 8000;

          console.warn(`â ï¸  Intento ${attempt + 1} falló (${error.message}), reintentando en ${delay}ms...`);

          await new Promise(resolve => setTimeout(resolve, delay));

          continue;

        }



        // Manejar errores específicos de axios

        if (axios.isAxiosError(error)) {

          // Timeout

          if (error.code === 'ECONNABORTED') {

            console.error('â±ï¸  Timeout: La generación tardó más de 90 segundos');

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

            console.error('â Error de conexión con n8n');

            throw new Error('Error de conexión: No se pudo conectar con el servicio de n8n');

          }

        }



        // Error genérico

        console.error('â Error desconocido al llamar a n8n:', error.message);

        throw new Error(`Error al conectar con n8n: ${error.message}`);

      }

    }



    // Should not reach here, but TypeScript needs this

    throw new Error('n8n webhook call failed after all retries');

  }



  /**

   * Determine if an error is retryable (transient network errors)

   */

  private isRetryableError(error: any): boolean {

    if (!axios.isAxiosError(error)) {

      // Non-axios errors: retry on unknown errors (could be transient)

      return true;

    }



    const code = error.code || '';

    const message = error.message || '';

    const status = error.response?.status;



    // Retry on connection errors, timeouts, and 5xx server errors

    const retryableCodes = ['ECONNABORTED', 'ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ENETUNREACH', 'EAI_AGAIN'];

    const retryableStatuses = [502, 503, 504, 429, 408];



    return (

      retryableCodes.includes(code) ||

      (status !== undefined && retryableStatuses.includes(status)) ||

      message.includes('socket hang up') ||

      message.includes('getaddrinfo') ||

      message.includes('N8N webhook error') ||

      (!status && !error.response) // Network error with no response

    );

  }



  /**

   * Verificar si el cliente está configurado correctamente

   */

  isConfigured(): boolean {

    return !!(this.webhookUrl && this.apiKey);

  }



  async isWebhookRegistered(): Promise<boolean> {

    if (!this.webhookUrl) return false;

    try {

      const response = await axios.head(this.webhookUrl, {

        timeout: 5000,

        headers: this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {},

        validateStatus: () => true,

      });

      return response.status !== 404;

    } catch {

      return false;

    }

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

