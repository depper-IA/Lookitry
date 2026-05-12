import axios from 'axios';

import { N8nClient } from '../n8n.client';

import { N8nWebhookPayload } from '../../types';



// Mock de axios

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;



describe('N8nClient', () => {

  let n8nClient: N8nClient;

  const originalEnv = process.env;



  beforeEach(() => {

    // Resetear mocks

    jest.clearAllMocks();



    // Configurar variables de entorno para tests

    process.env = {

      ...originalEnv,

      N8N_WEBHOOK_URL: 'https://n8n.test.com/webhook/test',

      N8N_API_KEY: 'test-api-key-123',

    };



    // Crear nueva instancia del cliente

    n8nClient = new N8nClient();

  });



  afterEach(() => {

    // Restaurar variables de entorno

    process.env = originalEnv;

  });



  describe('callTryOnWebhook', () => {

    const mockPayload: N8nWebhookPayload = {

      brand_id: 'brand-123',

      product_id: 'product-456',

      selfie_url: 'https://example.com/selfie.jpg',

      product_image_url: 'https://example.com/product.jpg',

      prompt: 'Create a photorealistic image',

    };



    it('debe retornar respuesta exitosa cuando n8n responde correctamente', async () => {

      // Arrange

      const mockResponse = {

        data: {

          success: true,

          imageUrl: 'https://example.com/generated-image.jpg',

        },

      };



      mockedAxios.post.mockResolvedValueOnce(mockResponse);



      // Act

      const result = await n8nClient.callTryOnWebhook(mockPayload);



      // Assert

      expect(result).toEqual({

        success: true,

        imageUrl: 'https://example.com/generated-image.jpg',

      });



      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

      expect(mockedAxios.post).toHaveBeenCalledWith(

        'https://n8n.test.com/webhook/test',

        {

          brand_id: mockPayload.brand_id,

          product_id: mockPayload.product_id,

          selfie_url: mockPayload.selfie_url,

          product_image_url: mockPayload.product_image_url,

          prompt: mockPayload.prompt,

        },

        {

          timeout: 90000,

          headers: {

            'Content-Type': 'application/json',

            'Authorization': expect.stringMatching(/^Bearer /),

          },

        }

      );

    });



    it('debe lanzar error de timeout cuando la llamada excede 90 segundos', async () => {

      // Arrange

      const timeoutError = {

        code: 'ECONNABORTED',

        message: 'timeout of 90000ms exceeded',

        isAxiosError: true,

      };



      mockedAxios.post.mockRejectedValueOnce(timeoutError);

      mockedAxios.isAxiosError.mockReturnValue(true);



      // Act & Assert

      await expect(n8nClient.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'Timeout: La generación tardó más de 90 segundos'

      );



      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    });



    it('debe lanzar error cuando n8n retorna un error en la respuesta', async () => {

      // Arrange

      const n8nError = {

        isAxiosError: true,

        response: {

          status: 500,

          data: {

            error: 'Error al procesar la imagen con IA',

          },

        },

        message: 'Request failed with status code 500',

      };



      mockedAxios.post.mockRejectedValueOnce(n8nError);

      mockedAxios.isAxiosError.mockReturnValue(true);



      // Act & Assert

      await expect(n8nClient.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'n8n error 500: Error al procesar la imagen con IA'

      );



      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    });



    it('debe lanzar error cuando n8n retorna error sin campo error específico', async () => {

      // Arrange

      const n8nError = {

        isAxiosError: true,

        response: {

          status: 500,

          data: {

            message: 'Internal server error',

          },

        },

        message: 'Request failed with status code 500',

      };



      mockedAxios.post.mockRejectedValueOnce(n8nError);

      mockedAxios.isAxiosError.mockReturnValue(true);



      // Act & Assert

      await expect(n8nClient.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'n8n error 500: Internal server error'

      );

    });



    it('debe lanzar error de conexión cuando no se puede conectar con n8n', async () => {

      // Arrange

      const connectionError = {

        isAxiosError: true,

        request: {},

        message: 'Network Error',

      };



      mockedAxios.post.mockRejectedValueOnce(connectionError);

      mockedAxios.isAxiosError.mockReturnValue(true);



      // Act & Assert

      await expect(n8nClient.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'Error de conexión: No se pudo conectar con el servicio de n8n'

      );



      expect(mockedAxios.post).toHaveBeenCalledTimes(1);

    });



    it('debe lanzar error genérico cuando ocurre un error desconocido', async () => {

      // Arrange

      const genericError = new Error('Unknown error');



      mockedAxios.post.mockRejectedValueOnce(genericError);

      mockedAxios.isAxiosError.mockReturnValue(false);



      // Act & Assert

      await expect(n8nClient.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'Error al conectar con n8n: Unknown error'

      );

    });



    it('debe lanzar error cuando N8N_WEBHOOK_URL no está configurado', async () => {

      // Arrange

      process.env.N8N_WEBHOOK_URL = '';

      const clientWithoutUrl = new N8nClient();



      // Act & Assert

      await expect(clientWithoutUrl.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'Configuración de n8n incompleta. Verifica N8N_WEBHOOK_URL y N8N_BEARER_TOKEN / N8N_API_KEY'

      );



      expect(mockedAxios.post).not.toHaveBeenCalled();

    });



    it('debe lanzar error cuando N8N_API_KEY / N8N_BEARER_TOKEN no están configurados', async () => {

      // Arrange

      process.env.N8N_API_KEY = '';

      process.env.N8N_BEARER_TOKEN = '';

      const clientWithoutKey = new N8nClient();



      // Act & Assert

      await expect(clientWithoutKey.callTryOnWebhook(mockPayload)).rejects.toThrow(

        'Configuración de n8n incompleta. Verifica N8N_WEBHOOK_URL y N8N_BEARER_TOKEN / N8N_API_KEY'

      );



      expect(mockedAxios.post).not.toHaveBeenCalled();

    });

  });



  describe('isConfigured', () => {

    it('debe retornar true cuando está configurado correctamente', () => {

      expect(n8nClient.isConfigured()).toBe(true);

    });



    it('debe retornar false cuando falta N8N_WEBHOOK_URL', () => {

      process.env.N8N_WEBHOOK_URL = '';

      const client = new N8nClient();

      expect(client.isConfigured()).toBe(false);

    });



    it('debe retornar false cuando falta N8N_API_KEY', () => {

      process.env.N8N_API_KEY = '';

      const client = new N8nClient();

      expect(client.isConfigured()).toBe(false);

    });

  });



  describe('getConfigInfo', () => {

    it('debe retornar información de configuración sin exponer credenciales', () => {

      const info = n8nClient.getConfigInfo();



      expect(info).toEqual({

        configured: true,

        webhookUrl: '***configurado***',

        timeout: 90000,

      });

    });



    it('debe indicar cuando no está configurado', () => {

      process.env.N8N_WEBHOOK_URL = '';

      const client = new N8nClient();

      const info = client.getConfigInfo();



      expect(info).toEqual({

        configured: false,

        webhookUrl: 'no configurado',

        timeout: 90000,

      });

    });

  });

});

