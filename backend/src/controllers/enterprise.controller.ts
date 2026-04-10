import { Request, Response } from 'express';
import { sanitizeError } from '../utils/sanitizeError';
import { recordTrialEvent } from '../utils/brandLifecycle';
import { supabaseAdmin } from '../config/supabase';

const ENTERPRISE_SYNC_TABLE = 'enterprise_sync_configs';

function getEnterpriseSyncWebhookUrl() {
  if (process.env.N8N_ENTERPRISE_SYNC_WEBHOOK_URL) {
    return process.env.N8N_ENTERPRISE_SYNC_WEBHOOK_URL;
  }

  if (process.env.N8N_WEBHOOK_URL) {
    return process.env.N8N_WEBHOOK_URL.replace(/\/tryon\/?$/, '/enterprise-sync');
  }

  return '';
}

function isMissingEnterpriseSyncTableError(error: any) {
  const message = `${error?.message || ''} ${error?.details || ''} ${error?.hint || ''}`.toLowerCase();
  return (
    message.includes(`could not find the table 'public.${ENTERPRISE_SYNC_TABLE}'`) ||
    message.includes(`relation "public.${ENTERPRISE_SYNC_TABLE}" does not exist`) ||
    message.includes(`relation "${ENTERPRISE_SYNC_TABLE}" does not exist`) ||
    message.includes(`'public.${ENTERPRISE_SYNC_TABLE}'`) ||
    message.includes(ENTERPRISE_SYNC_TABLE)
  );
}

function getEnterpriseModuleUnavailableMessage() {
  return 'El módulo enterprise aún no está provisionado en esta base de datos. Falta la tabla enterprise_sync_configs.';
}

async function safeUpdateEnterpriseConfig(brandId: string, payload: Record<string, any>) {
  const response = await supabaseAdmin
    .from(ENTERPRISE_SYNC_TABLE)
    .update(payload)
    .eq('brand_id', brandId);

  if (response.error && isMissingEnterpriseSyncTableError(response.error)) {
    return { missingTable: true, error: null };
  }

  return { missingTable: false, error: response.error };
}

// GET /admin/enterprise — Listar todas las configs de sync Enterprise
export const listEnterpriseSyncConfigs = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from(ENTERPRISE_SYNC_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (isMissingEnterpriseSyncTableError(error)) {
        return res.json({
          configs: [],
          moduleAvailable: false,
          moduleMessage: getEnterpriseModuleUnavailableMessage(),
        });
      }
      return res.status(500).json({ error: sanitizeError(error, 'Error de base de datos') });
    }

    const configs = data || [];
    const brandIds = [...new Set(configs.map((config: any) => config.brand_id).filter(Boolean))];

    let brandsById = new Map<string, { id: string; name: string; email: string; slug: string; plan: string }>();

    if (brandIds.length > 0) {
      const { data: brands, error: brandsError } = await supabaseAdmin
        .from('brands')
        .select('id, name, email, slug, plan')
        .in('id', brandIds);

      if (brandsError) {
        return res.status(500).json({ error: sanitizeError(brandsError, 'Error al obtener marcas') });
      }

      brandsById = new Map((brands || []).map((brand: any) => [brand.id, brand]));
    }

    const hydratedConfigs = configs.map((config: any) => ({
      ...config,
      brands: brandsById.get(config.brand_id) || null,
    }));

    return res.json({ configs: hydratedConfigs });
  } catch (err: any) {
    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
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

    if (brand.plan !== 'ENTERPRISE') {
      return res.status(400).json({ error: 'Solo las marcas con plan ENTERPRISE pueden usar The Sync' });
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
      .from(ENTERPRISE_SYNC_TABLE)
      .upsert(payload, { onConflict: 'brand_id' })
      .select()
      .single();

    if (error) {
      if (isMissingEnterpriseSyncTableError(error)) {
        return res.status(503).json({ error: getEnterpriseModuleUnavailableMessage() });
      }
      return res.status(500).json({ error: sanitizeError(error, 'Error de base de datos') });
    }

    return res.json({
      message: 'Configuración de sync guardada exitosamente',
      config: data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
  }
};

// POST /admin/enterprise/:brandId/trigger-sync — Disparo manual desde el panel
export const triggerEnterpriseSync = async (req: Request, res: Response) => {
  const { brandId } = req.params;

  try {
    const { data: config, error } = await supabaseAdmin
      .from(ENTERPRISE_SYNC_TABLE)
      .select('*')
      .eq('brand_id', brandId)
      .single();

    if (error && isMissingEnterpriseSyncTableError(error)) {
      return res.status(503).json({ error: getEnterpriseModuleUnavailableMessage() });
    }

    if (error || !config) {
      return res.status(404).json({
        error: 'No existe configuración de sync para esta marca. Configúrala primero.',
      });
    }

    if (!config.active) {
      return res.status(400).json({ error: 'La sincronización está pausada para esta marca.' });
    }

    // Disparar el webhook de n8n para este cliente
    const n8nWebhookUrl = getEnterpriseSyncWebhookUrl();
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
      .from(ENTERPRISE_SYNC_TABLE)
      .update({
        last_sync_status: 'pending',
        last_sync_message: null,
        products_synced_count: 0,
        updated_at: new Date().toISOString(),
      })
      .eq('brand_id', brandId);

    return res.json({ message: 'Sync disparado exitosamente. n8n procesará los productos en breve.' });
  } catch (err: any) {
    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
  }
};

// POST /api/enterprise/sync-product — Webhook interno llamado por n8n para cada producto
// Protegido por ENTERPRISE_SYNC_TOKEN (Bearer token secreto compartido con n8n)
export const syncProductWebhook = async (req: Request, res: Response) => {
  try {
    console.log('[Enterprise] syncProductWebhook iniciado');

    const authHeader = req.headers.authorization || '';
    const expectedToken = process.env.ENTERPRISE_SYNC_TOKEN;

    console.log('[Enterprise] Token config:', { hasToken: !!expectedToken, hasHeader: !!authHeader });

    if (!expectedToken) {
      console.error('[Enterprise] ENTERPRISE_SYNC_TOKEN no configurado');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (authHeader !== `Bearer ${expectedToken}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { brand_id, name, description, category, image_url, price, external_id } = req.body;

    console.log('[Enterprise] Datos recibidos:', { brand_id, name, image_url: !!image_url });

    if (!brand_id || !name || !image_url) {
      return res.status(400).json({ error: 'brand_id, name e image_url son requeridos' });
    }

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

      if (error) return res.status(500).json({ error: sanitizeError(error, 'Error al actualizar producto') });

      // Actualizar contador de sync (si falla, continuar sin fallar)
      try {
        await supabaseAdmin.rpc('increment_sync_count', { p_brand_id: brand_id });
      } catch (rpcError: any) {
        console.warn('[Enterprise] RPC increment_sync_count no disponible:', rpcError.message);
      }

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
          if (retry.error) return res.status(500).json({ error: sanitizeError(retry.error, 'Error al crear producto') });
          return res.json({ action: 'created', product: retry.data });
        }
        return res.status(500).json({ error: sanitizeError(error, 'Error de base de datos') });
      }

      // Actualizar timestamp y contador en enterprise_sync_configs (si falla, continuar sin fallar)
      try {
        await supabaseAdmin.rpc('increment_sync_count', { p_brand_id: brand_id });
      } catch (rpcError: any) {
        console.warn('[Enterprise] RPC increment_sync_count no disponible:', rpcError.message);
      }
      try {
        await safeUpdateEnterpriseConfig(brand_id, {
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'success',
          updated_at: new Date().toISOString(),
        });
      } catch (configError: any) {
        console.warn('[Enterprise] Error actualizando config:', configError.message);
      }

      return res.status(201).json({ action: 'created', product: created });
    }
  } catch (err: any) {
    console.error('[Enterprise] Error general en syncProductWebhook:', err);

    const errorBrandId = req.body?.brand_id;
    if (errorBrandId) {
      try {
        await safeUpdateEnterpriseConfig(errorBrandId, {
          last_sync_status: 'failed',
          last_sync_message: err.message,
          updated_at: new Date().toISOString(),
        });
      } catch (configError: any) {
        console.warn('[Enterprise] Error actualizando config de error:', configError.message);
      }
    }

    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
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
      .from(ENTERPRISE_SYNC_TABLE)
      .update(updatePayload)
      .eq('brand_id', brandId)
      .select()
      .single();

    if (error && isMissingEnterpriseSyncTableError(error)) {
      return res.status(503).json({ error: getEnterpriseModuleUnavailableMessage() });
    }

    if (error)         return res.status(500).json({ error: sanitizeError(error, 'Error al crear producto') });

    return res.json({ message: 'Estado de sync actualizado', config: data });
  } catch (err: any) {
    console.error('[Enterprise] Error en updateSyncStatus:', err.message);
    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /admin/enterprise/create-client
// Alta completa de un cliente Enterprise: crea la marca con plan ENTERPRISE,
// activa la suscripción, registra el pago y genera la notificación de admin.
// ─────────────────────────────────────────────────────────────────────────────
export const createEnterpriseClient = async (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    slug,
    contact_name,
    phone,
    monthly_amount,     // Mensualidad acordada en COP
    setup_amount,       // Pago único de setup en COP (puede ser 0)
    source_plan,        // Plan previo si la alta enterprise viene de otro ciclo comercial
    months_paid,        // Meses del contrato (1, 3, 6, 12...)
    payment_method,     // 'transfer', 'efectivo', 'wompi', 'otro'
    notes,              // Notas internas del contrato
    products_limit,     // Máximo de productos activos (default 50)
    generations_limit,  // Generaciones por mes (default 2000)
  } = req.body;

  // ── Validaciones básicas ──────────────────────────────────────────────────
  if (!name || !email || !password || !slug) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'nombre, email, contraseña y slug son requeridos',
    });
  }
  if (!monthly_amount || Number(monthly_amount) <= 0) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'monthly_amount debe ser mayor a 0',
    });
  }
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'El slug solo puede contener letras minúsculas, números y guiones',
    });
  }

  try {
    // 1. Verificar email único
    const { data: existingEmail } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    if (existingEmail) {
      return res.status(409).json({ error: 'CONFLICT', message: 'El email ya está registrado' });
    }

    // 2. Verificar slug único
    const { data: existingSlug } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (existingSlug) {
      return res.status(409).json({ error: 'CONFLICT', message: 'El slug ya está en uso' });
    }

    // 3. Hash de contraseña
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Calcular fechas de suscripción
    const now = new Date();
    const contractMonths = Number(months_paid) || 1;
    const normalizedSourcePlan = ['TRIAL', 'BASIC', 'PRO'].includes(String(source_plan || '').toUpperCase()) ? String(source_plan).toUpperCase() : 'NONE';
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + contractMonths);

    // 5. Crear la marca con plan ENTERPRISE y suscripción activa inmediata
    const { data: newBrand, error: createError } = await supabaseAdmin
      .from('brands')
      .insert({
        email,
        password: hashedPassword,
        name,
        slug,
        contact_name: contact_name || null,
        phone: phone || null,
        plan: 'ENTERPRISE',
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        last_payment_date: now.toISOString(),
        next_payment_date: endDate.toISOString(),
        email_verified: true, // El admin es responsable de la verificación
        trial_generations_limit: Number(generations_limit) || 2000,
        social_links: normalizedSourcePlan !== 'NONE' ? { acquisition_source_plan: normalizedSourcePlan, enterprise_created_at: now.toISOString() } : { enterprise_created_at: now.toISOString() },
      })
      .select()
      .single();

    if (createError || !newBrand) {
      console.error('[Enterprise] Error creando marca:', createError);
      return res.status(500).json({
        error: 'ERROR_CREATING_BRAND',
        message: sanitizeError(createError, 'Error desconocido al crear la marca'),
      });
    }

    if (normalizedSourcePlan === 'TRIAL') {
      await recordTrialEvent(newBrand.id, 'trial_converted', {
        planPurchased: 'ENTERPRISE',
        sourcePlan: 'TRIAL',
        conversionSource: 'admin_enterprise_create',
      }).catch(() => {});
    }

    // 6. Registrar pago en subscription_payments
    const totalSetup = Number(setup_amount) || 0;
    const totalMonthly = Number(monthly_amount) * contractMonths;
    const totalPaid = totalSetup + totalMonthly;

    await supabaseAdmin.from('subscription_payments').insert({
      brand_id: newBrand.id,
      amount: totalPaid,
      currency: 'COP',
      payment_date: now.toISOString(),
      payment_method: payment_method || 'manual',
      status: 'completed',
      months_paid: contractMonths,
      notes: notes
        ? `[ENTERPRISE] ${notes}`
        : `Alta Enterprise — $${Number(monthly_amount).toLocaleString('es-CO')} COP/mes × ${contractMonths} mes(es) + Setup $${totalSetup.toLocaleString('es-CO')} COP`,
    });

    // 7. Notificación de admin
    await supabaseAdmin.from('admin_notifications').insert({
      type: 'new_enterprise_client',
      title: 'Nuevo cliente Enterprise activado',
      message: `${name} (${email}) dado de alta como cliente Enterprise — ${contractMonths} mes(es) de contrato.`,
      severity: 'success',
      brand_id: newBrand.id,
      metadata: {
        monthly_amount: Number(monthly_amount),
        setup_amount: totalSetup,
        total_paid: totalPaid,
        months_paid: contractMonths,
        products_limit: Number(products_limit) || 50,
        generations_limit: Number(generations_limit) || 2000,
        payment_method: payment_method || 'manual',
        source_plan: normalizedSourcePlan,
        subscription_end_date: endDate.toISOString(),
      },
    });

    // 8. Auditoría
    const adminReq = req as any;
    console.log(`[Enterprise] Alta por ${adminReq.admin?.email || 'admin'}: ${name} (${email}) hasta ${endDate.toISOString()}`);

    return res.status(201).json({
      message: 'Cliente Enterprise activado exitosamente',
      brand: {
        id: newBrand.id,
        name: newBrand.name,
        email: newBrand.email,
        slug: newBrand.slug,
        plan: newBrand.plan,
        subscription_status: newBrand.subscription_status,
        subscription_start_date: newBrand.subscription_start_date,
        subscription_end_date: newBrand.subscription_end_date,
      },
      contract: {
        monthly_amount: Number(monthly_amount),
        setup_amount: totalSetup,
        total_paid: totalPaid,
        months_paid: contractMonths,
        subscription_end_date: endDate.toISOString(),
      },
    });
  } catch (err: any) {
    console.error('[Enterprise] Error en createEnterpriseClient:', err);
    return res.status(500).json({ error: sanitizeError(err, 'Error interno del servidor') });
  }
};