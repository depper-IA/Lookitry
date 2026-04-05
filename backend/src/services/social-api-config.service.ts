import { supabaseAdmin } from '../config/supabase';
import { SocialApiConfig } from './lead.service';

export interface SocialApiConfigInput {
  platform: 'instagram' | 'tiktok' | 'facebook' | 'googlemaps';
  config: Record<string, any>;
  created_by: string;
}

export class SocialApiConfigService {
  async getConfigs(): Promise<SocialApiConfig[]> {
    const { data, error } = await supabaseAdmin
      .from('social_api_configs')
      .select('*')
      .order('platform');

    if (error) throw error;
    return (data as SocialApiConfig[]) || [];
  }

  async getConfigByPlatform(platform: string): Promise<SocialApiConfig | null> {
    const { data, error } = await supabaseAdmin
      .from('social_api_configs')
      .select('*')
      .eq('platform', platform)
      .maybeSingle();

    if (error) throw error;
    return data as SocialApiConfig | null;
  }

  async upsertConfig(input: SocialApiConfigInput): Promise<SocialApiConfig> {
    const existing = await this.getConfigByPlatform(input.platform);

    const configToStore = {
      platform: input.platform,
      config: input.config,
      is_active: existing?.is_active || false,
      created_by: input.created_by,
    };

    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('social_api_configs')
        .update({
          ...configToStore,
          updated_at: new Date().toISOString(),
        })
        .eq('platform', input.platform)
        .select()
        .single();

      if (error) throw error;
      return data as SocialApiConfig;
    } else {
      const { data, error } = await supabaseAdmin
        .from('social_api_configs')
        .insert(configToStore)
        .select()
        .single();

      if (error) throw error;
      return data as SocialApiConfig;
    }
  }

  async setActive(platform: string, active: boolean): Promise<void> {
    const { error } = await supabaseAdmin
      .from('social_api_configs')
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('platform', platform);

    if (error) throw error;
  }

  async testConnection(platform: string): Promise<{ success: boolean; message: string }> {
    const config = await this.getConfigByPlatform(platform);
    if (!config) {
      return { success: false, message: 'Configuración no encontrada' };
    }

    try {
      if (platform === 'instagram' || platform === 'facebook') {
        return await this.testMetaConnection(config.config);
      } else if (platform === 'tiktok') {
        return await this.testTiktokConnection(config.config);
      } else if (platform === 'googlemaps') {
        return await this.testGoogleMapsConnection(config.config);
      }

      return { success: false, message: 'Plataforma no soportada' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async testGoogleMapsConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const apiKey = config.api_key;
    if (!apiKey) {
      return { success: false, message: 'API Key no configurada' };
    }

    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=test&key=${apiKey}`
      );
      const data = await response.json() as { error?: string; results?: unknown[] };

      if (data.error) {
        return { success: false, message: data.error };
      }

      await this.updateLastTest('googlemaps', { success: true });
      return { success: true, message: 'API de Google Maps configurada correctamente' };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async testMetaConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const accessToken = config.access_token;
    if (!accessToken) {
      return { success: false, message: 'Access token no configurado' };
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/me?access_token=${accessToken}`
      );
      const data = await response.json() as { error?: { message: string }; id?: string; name?: string };

      if (data.error) {
        return { success: false, message: data.error.message };
      }

      await this.updateLastTest(config.platform as string, { success: true, page_id: data.id });
      return { success: true, message: `Conectado como ${data.name} (${data.id})` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async testTiktokConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    const accessToken = config.access_token;
    if (!accessToken) {
      return { success: false, message: 'Access token no configurado' };
    }

    try {
      const response = await fetch('https://open.tiktokapis.com/v2/user/info/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields: ['open_id', 'display_name'] }),
      });

      const data = await response.json() as { error?: { message: string }; data?: { user?: { open_id: string; display_name: string } } };

      if (data.error) {
        return { success: false, message: data.error.message };
      }

      await this.updateLastTest(config.platform as string, { success: true, user_id: data.data?.user?.open_id });
      return { success: true, message: `Conectado como ${data.data?.user?.display_name || 'Tiktok User'}` };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private async updateLastTest(platform: string, result: Record<string, any>): Promise<void> {
    await supabaseAdmin
      .from('social_api_configs')
      .update({
        last_test_at: new Date().toISOString(),
        last_test_result: result,
        updated_at: new Date().toISOString(),
      })
      .eq('platform', platform);
  }

  async deleteConfig(platform: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('social_api_configs')
      .delete()
      .eq('platform', platform);

    if (error) throw error;
  }
}

export const socialApiConfigService = new SocialApiConfigService();
