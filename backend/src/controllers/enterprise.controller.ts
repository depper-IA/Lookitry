import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

// GET /admin/enterprise — Listar todas las configs de sync Enterprise
export const listEnterpriseSyncConfigs = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('enterprise_sync_configs')
      .select(`
        *,
        brands (id, name, email, slug, plan)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ configs: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /admin/enterprise/:brandId/sync-config — Crear o actualizar config de sync
export const upsertEnterpriseSyncConfig = async (req: Request, res: Response) => {
  const { brandId } = req.params;
  const { sync_type, source_url, api_key, field_map, active, notes } = req.body;

  if (!source_url) {
    return res.status(400).json({ error: 'source_url es requerido' });
  }

  if (!['csv', 'api', 'woocommerce'].includes(sync_type || 'csv')) {
    return res.status(400).json({ error: 'sync_type inválido. Valores: csv, api, woocommerce' });
  }

  try {
    // Verificar que la marca existe y tiene plan ENTERPRISE
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('id, name, plan')
      .eq('id', brandId)
      .single();

    if (brandError || !brand) {
      return res.status(404).json({ error: 'Marca no encontrada' });
    }

    const payload: Record<string, any> = {
      brand_id: brandId,
      sync_type: sync_type || 'csv',
      source_url,
      active: active !== undefined ? active : true,
      updated_at: new Date().toISOString(),
    };

    if (api_key !== undefined) payload.api_key = api_key;
    if (field_map !== undefined) payload.field_map = field_map;
    if (notes !== undefined) payload.notes = notes;

    const { data, error } = await supabaseAdmin
      .from('enterprise_sync_configs')
      .upsert(payload, { onConflict: 'brand_id' })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({
      message: 'Configuración de sync guardada exitosamente',
      config: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /admin/enterprise/:brandId/trigger-sync — Disparo manual desde el panel
export const triggerEnterpriseSync = async (req: Request, res: Response) => {
  const { brandId } = req.params;

  try {
    const { data: config, error } = await supabaseAdmin
      .from('enterprise_sync_configs')
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (error || !config) {
      return res.status(404).json({
        error: 'No existe configuración de sync para esta marca. Configúrala primero.',
      });
    }

    if (!config.active) {
      return res.status(400).json({ error: 'La sincronización está pausada para esta marca.' });
    }

    // Disparar el webhook de n8n para este cliente
    const n8nWebhookUrl = process.env.N8N_ENTERPRISE_SYNC_WEBHOOK_URL;
    if (!n8nWebhookUrl) {
      return res.status(503).json({ error: 'Webhook de n8n no configurado (N8N_ENTERPRISE_SYNC_WEBHOOK_URL)' });
    }

    const response = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.N8N_BEARER_TOKEN}`,
      },
      body: JSON.stringify({
        brand_id: brandId,
        sync_type: config.sync_type,
        source_url: config.source_url,
        api_key: config.api_key,
        field_map: config.field_map,
      }),
    });

    if (!response.ok) {
      const resText = await response.text();
      console.error('[Enterprise Sync] Error al llamar n8n:', resText);
      return res.status(502).json({ error: 'Error al comunicarse con el flujo de n8n', detail: resText });
    }

    // Marcar como pendiente en la BD
    await supabaseAdmin
      .from('enterprise_sync_configs')
      .update({ last_sync_status: 'pending', updated_at: new Date().toISOString() })
      .eq('brand_id', brandId);

    return res.json({ message: 'Sync disparado exitosamente. n8n procesará los productos en breve.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

// POST /api/enterprise/sync-product — Webhook interno llamado por n8n para cada producto
// Protegido por ENTERPRISE_SYNC_TOKEN (Bearer token secreto compartido con n8n)
export const syncProductWebhook = async (req: Request, res: Response) => {
  // Verificar token secreto
  const authHeader = req.headers.authorization || '';
  const expectedToken = process.env.ENTERPRISE_SYNC_TOKEN;

  if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const {
    brand_id,
    name,
    description,
    category,
    image_url,  // URL ya procesada (background removed, en MinIO)
    price,
    external_id, // ID del producto en el sistema del cliente (para deduplicación)
  } = req.body;

  if (!brand_id || !name || !image_url) {
    return res.status(400).json({ error: 'brand_id, name e image_url son requeridos' });
  }

  try {
    // Verificar si el producto ya existe (deduplicar por external_id o nombre+marca)
    let existingProduct = null;

    if (external_id) {
      const { data } = await supabaseAdmin
        .from('products')
        .select('id')
        .eq('brand_id', brand_id)
        .eq('external_id', external_id)
        .maybeSingle();
      existingProduct = data;
    }

    if (existingProduct) {
      // Actualizar producto existente
      const { data: updated, error } = await supabaseAdmin
        .from('products')
        .update({
          name,
          description: description || null,
          category: category || null,
          image_url,
          price: price || null,
          is_active: true,
        })
        .eq('id', existingProduct.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: error.message });

      // Actualizar contador de sync
      await supabaseAdmin.rpc('increment_sync_count', { p_brand_id: brand_id });

      return res.json({ action: 'updated', product: updated });
    } else {
      // Insertar nuevo producto
      const insertPayload: Record<string, any> = {
        brand_id,
        name,
        description: description || null,
        category: category || null,
        image_url,
        is_active: true,
        price: price || null,
      };

      // Añadir external_id solo si la columna existe
      if (external_id) {
        insertPayload.external_id = external_id;
      }

      const { data: created, error } = await supabaseAdmin
        .from('products')
        .insert(insertPayload)
        .select()
        .single();

      if (error) {
        // Si falla por columna external_id inexistente, reintentar sin ella
        if (error.message.includes('external_id')) {
          delete insertPayload.external_id;
          const retry = await supabaseAdmin.from('products').insert(insertPayload).select().single();
          if (retry.error) return res.status(500).json({ error: retry.error.message });
          return res.json({ action: 'created', product: retry.data });
        }
        return res.status(500).json({ error: error.message });
      }

      // Actualizar timestamp en enterprise_sync_configs
      await supabaseAdmin
        .from('enterprise_sync_configs')
        .update({
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          updated_at: new Date().toISOString(),
        })
        .eq('brand_id', brand_id);

      return res.status(201).json({ action: 'created', product: created });
    }
  } catch (err: any) {
    // Registrar el error en la config de sync
    await supabaseAdmin
      .from('enterprise_sync_configs')
      .update({
        last_sync_status: 'failed',
        last_sync_message: err.message,
        updated_at: new Date().toISOString(),
      })
      .eq('brand_id', brand_id);

    return res.status(500).json({ error: err.message });
  }
};

// PATCH /admin/enterprise/:brandId/sync-status — Actualizar estado del último sync (llamado por n8n al terminar)
export const updateSyncStatus = async (req: Request, res: Response) => {
  const { brandId } = req.params;
  const { status, message, products_synced_count } = req.body;

  // Verificar token secreto (también puede ser llamado por n8n)
  const authHeader = req.headers.authorization || '';
  const adminHeader = (req as any).admin; // set by adminAuthMiddleware
  const expectedToken = process.env.ENTERPRISE_SYNC_TOKEN;

  if (!adminHeader && authHeader !== `Bearer ${expectedToken}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const updatePayload: Record<string, any> = {
      last_sync_at: new Date().toISOString(),
      last_sync_status: status || 'success',
      updated_at: new Date().toISOString(),
    };

    if (message !== undefined) updatePayload.last_sync_message = message;
    if (products_synced_count !== undefined) updatePayload.products_synced_count = products_synced_count;

    const { data, error } = await supabaseAdmin
      .from('enterprise_sync_configs')
      .update(updatePayload)
      .eq('brand_id', brandId)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ message: 'Estado de sync actualizado', config: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
