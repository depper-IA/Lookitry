import type { TryOnConfigResponse, GenerateTryOnDto, GenerateTryOnResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

/** Tiempo máximo (ms) que esperamos una respuesta del endpoint de generación */
const GENERATION_TIMEOUT_MS = 95_000;

class TryOnService {
  async getConfig(brandSlug: string): Promise<TryOnConfigResponse> {
    const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}`);
    if (res.status === 404) throw new Error('Marca no encontrada');
    if (!res.ok) throw new Error('Error al cargar la configuración');
    const data = await res.json();

    return {
      brand: {
        id: data.brand.id,
        name: data.brand.name,
        slug: data.brand.slug,
        logo: data.brand.logo,
        primaryColor: data.brand.primary_color,
        secondaryColor: data.brand.secondary_color,
        widgetTemplate: data.brand.widget_template,
        buttonText: data.brand.button_text,
        welcomeMessage: data.brand.welcome_message,
        plan: data.brand.plan,
        headerColor: data.brand.header_color ?? null,
        brandDescription: data.brand.brand_description ?? null,
        whatsappContact: data.brand.whatsapp_contact ?? null,
        coverImageUrl: data.brand.cover_image_url ?? null,
        socialLinks: data.brand.social_links ?? {},
        hasLandingPage: data.brand.has_landing_page ?? false,
        customDomain: data.brand.custom_domain ?? null,
      },
      products: data.products.map((p: any) => ({
        id: p.id,
        name: p.name,
        imageUrl: p.image_url || '',
        category: p.category,
        description: p.description,
      })),
    };
  }

  async generate(brandSlug: string, data: GenerateTryOnDto): Promise<GenerateTryOnResponse> {
    const formData = new FormData();
    formData.append('productId', data.productId);
    formData.append('selfie', data.selfieFile);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

    try {
      const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}/generate`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      const json = await res.json();

      if (res.status === 429) throw new Error(json.message || 'Límite de generaciones excedido');
      if (!res.ok) {
        const msg: string = json.message || 'Error al generar la imagen';
        // Marcar errores de servicio (créditos agotados) para que el widget los trate diferente
        if (msg === 'SERVICE_CREDITS_EXHAUSTED') {
          const err = new Error('SERVICE_CREDITS_EXHAUSTED') as any;
          err.isServiceError = true;
          throw err;
        }
        throw new Error(msg);
      }

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
