import type { TryOnConfigResponse, GenerateTryOnDto, GenerateTryOnResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.lookitry.com';

/** Tiempo máximo (ms) que esperamos una respuesta del endpoint de generación */
const GENERATION_TIMEOUT_MS = 95_000;

function isCreditsExhaustedErrorPayload(payload: any): boolean {
  const errorCode = String(payload?.error || '').toUpperCase();
  const message = String(payload?.message || '').toLowerCase();
  const details = JSON.stringify(payload?.details ?? {}).toLowerCase();
  const combined = `${message} ${details}`;

  return (
    errorCode.includes('OPENROUTER') ||
    message === 'service_credits_exhausted' ||
    combined.includes('service_credits_exhausted') ||
    combined.includes('credits') ||
    combined.includes('quota') ||
    combined.includes('out of credits') ||
    combined.includes('insufficient balance') ||
    combined.includes('balance') ||
    combined.includes('payment required') ||
    combined.includes('billing')
  );
}

class TryOnService {
  async getConfig(brandSlug: string): Promise<TryOnConfigResponse> {
    try {
      const res = await fetch(`${API_URL}/api/pruebalo/${brandSlug}`);
      if (res.status === 404) throw new Error('Marca no encontrada');
      if (!res.ok) throw new Error('Error al cargar la configuración');
      const data = await res.json();

      return {
        brand: {
          id: data?.brand?.id ?? '',
          name: data?.brand?.name ?? '',
          slug: data?.brand?.slug ?? '',
          logo: data?.brand?.logo ?? null,
          primaryColor: data?.brand?.primary_color ?? '#FF5C3A',
          secondaryColor: data?.brand?.secondary_color ?? null,
          widgetTemplate: data?.brand?.widget_template ?? 'minimal',
          buttonText: data?.brand?.button_text ?? 'Probarme esto',
          welcomeMessage: data?.brand?.welcome_message ?? '',
          plan: data?.brand?.plan ?? 'BASIC',
          headerColor: data?.brand?.header_color ?? null,
          brandDescription: data?.brand?.brand_description ?? null,
          whatsappContact: data?.brand?.whatsapp_contact ?? null,
          coverImageUrl: data?.brand?.cover_image_url ?? null,
          socialLinks: data?.brand?.social_links ?? {},
          hasLandingPage: data?.brand?.has_landing_page ?? false,
          customDomain: data?.brand?.custom_domain ?? null,
        },
        products: (data?.products ?? []).map((p: any) => ({
          id: p?.id ?? '',
          name: p?.name ?? '',
          imageUrl: p?.image_url || '',
          category: p?.category ?? '',
          description: p?.description ?? '',
        })),
      };
    } catch (error) {
      console.error('[TryOnService] Error en getConfig:', error);
      throw error;
    }
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
        // Marcar errores de servicio (créditos agotados / saldo insuficiente) para que el widget los trate diferente
        if (isCreditsExhaustedErrorPayload(json)) {
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
