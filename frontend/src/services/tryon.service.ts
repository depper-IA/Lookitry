import { api } from './api';
import type { TryOnConfigResponse, GenerateTryOnDto, GenerateTryOnResponse } from '@/types';

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
          widgetCoverImage: data?.brand?.widget_cover_image ?? null,
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

  /**
   * Obtener estado de una generación por ID
   * Endpoint público de polling — usa /api/pruebalo/:brandSlug/generation/:generationId
   * No requiere auth (el generationId actúa como token)
   */
  async getGenerationStatus(generationId: string, brandSlug: string): Promise<{
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    imageUrl?: string;
    error?: string;
    processingTime?: number;
  }> {
    try {
      // IMPORTANTE: Usar ruta pública de widget, NO /generations/:id (esa requiere auth)
      const response = await api.get<any>(`/pruebalo/${brandSlug}/generation/${generationId}`);
      return {
        status: response.data?.status ?? 'PENDING',
        imageUrl: response.data?.imageUrl ?? response.data?.result_image_url,
        error: response.data?.error ?? response.data?.error_message,
        processingTime: response.data?.processingTime ?? response.data?.processing_time,
      };
    } catch (err: any) {
      // 404 = la generación aún se está creando, treat as PENDING
      if (err?.response?.status === 404) {
        return { status: 'PENDING' };
      }
      throw err;
    }
  }

  /**
   * Generar imagen de try-on
   * Si el backend retorna solo generationId (sin imageUrl), activa modo polling.
   * Si retorna imageUrl directamente, usa ese resultado sin polling.
   */
  async generate(brandSlug: string, data: GenerateTryOnDto): Promise<GenerateTryOnResponse> {
    const formData = new FormData();
    formData.append('productId', data.productId);
    formData.append('selfie', data.selfieFile);
    if (data.clientFingerprint) {
      formData.append('clientFingerprint', data.clientFingerprint);
    }

    try {
      const response = await api.post<GenerateTryOnResponse>(
        `/pruebalo/${brandSlug}/generate`,
        formData
      );

      return response.data;
    } catch (err: any) {
      const json = err?.response?.data || {};

      if (err?.response?.status === 429) {
        if (json.error === 'CLIENT_ATTEMPT_LIMIT_EXCEEDED') {
          const limitErr = new Error(json.message || 'Límite de intentos excedido') as any;
          limitErr.clientAttemptLimit = true;
          limitErr.attemptsUsed = json.attemptsUsed;
          limitErr.attemptsLimit = json.attemptsLimit;
          throw limitErr;
        }
        throw new Error(json.message || 'Límite de generaciones excedido');
      }

      const msg: string = json.message || 'Error al generar la imagen';

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
