import type { TryOnConfigResponse, GenerateTryOnDto, GenerateTryOnResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class TryOnService {
  async getConfig(brandSlug: string): Promise<TryOnConfigResponse> {
    const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}`);
    if (res.status === 404) throw new Error('Marca no encontrada');
    if (!res.ok) throw new Error('Error al cargar la configuración');
    const data = await res.json();

    return {
      brand: {
        name: data.brand.name,
        logo: data.brand.logo,
        primaryColor: data.brand.primary_color,
        secondaryColor: data.brand.secondary_color,
        widgetTemplate: data.brand.widget_template,
        buttonText: data.brand.button_text,
        welcomeMessage: data.brand.welcome_message,
      },
      products: data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        // Usar la URL original directamente — los <img> tags no tienen restricción CORS.
        // El proxy solo se usa como fallback si la URL original falla.
        imageUrl: p.image_url || '',
        category: p.category,
      })),
    };
  }

  async generate(brandSlug: string, data: GenerateTryOnDto): Promise<GenerateTryOnResponse> {
    const formData = new FormData();
    formData.append('productId', data.productId);
    formData.append('selfie', data.selfieFile);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 95000);

    try {
      const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}/generate`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const json = await res.json();

      if (res.status === 429) throw new Error(json.message || 'Límite de generaciones excedido');
      if (!res.ok) throw new Error(json.message || 'Error al generar la imagen');

      return json as GenerateTryOnResponse;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('La generación está tardando demasiado. Por favor intenta de nuevo.');
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const tryonService = new TryOnService();
