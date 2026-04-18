import { api } from './api';
import type { TryOnConfigResponse, GenerateTryOnDto, GenerateTryOnResponse } from '@/types';

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
      const response = await api.get<any>(`/pruebalo/${brandSlug}`);
      const data = response.data;

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
          shortDescription: p?.short_description ?? '',
          price: p?.price ?? null,
          badge: p?.badge ?? null,
          externalId: p?.external_id ?? null,
          attributes: p?.attributes ?? {},
        })),
      };
    } catch (error: any) {
      console.error('[TryOnService] Error en getConfig:', error);
      if (error?.response?.status === 404) throw new Error('Marca no encontrada');
      throw error;
    }
  }

  async generate(brandSlug: string, data: GenerateTryOnDto): Promise<GenerateTryOnResponse> {
    const formData = new FormData();
    formData.append('productId', data.productId);
    formData.append('selfie', data.selfieFile);

    try {
      // Usamos el cliente api centralizado que ya maneja /api y credentials
      const response = await api.post<GenerateTryOnResponse>(
        `/pruebalo/${brandSlug}/generate`, 
        formData
      );

      return response.data;
    } catch (err: any) {
      const json = err?.response?.data || {};
      
      if (err?.response?.status === 429) {
        throw new Error(json.message || 'Límite de generaciones excedido');
      }

      const msg: string = json.message || 'Error al generar la imagen';
      
      // Marcar errores de servicio (créditos agotados / saldo insuficiente)
      if (isCreditsExhaustedErrorPayload(json)) {
        const serviceErr = new Error('SERVICE_CREDITS_EXHAUSTED') as any;
        serviceErr.isServiceError = true;
        throw serviceErr;
      }
      
      throw new Error(msg);
    }
  }
}

export const tryonService = new TryOnService();
