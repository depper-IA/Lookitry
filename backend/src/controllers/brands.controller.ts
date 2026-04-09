import { Response } from 'express';
import { BrandsService, UpdateBrandDto } from '../services/brands.service';
import { AuthRequest } from '../middleware/auth';
import { notificationPreferencesService } from '../services/notificationPreferences.service';
import { UpdateNotificationPreferencesDto } from '../types';
import { emailService } from '../services/email.service';
import { invalidateBrandConfigCache } from '../utils/brandConfigCache';
import { createAdminNotification } from '../utils/adminNotifications';
import { getWooProductSummary, getWooTelemetrySummary } from '../utils/wooTelemetry';
import { sanitizeDomainList } from '../utils/storeDomain';
import { sanitizeError } from '../utils/sanitizeError';
import { buildLegalDataExport, createLegalRequest, getBrandSocialLinks, getLegalDataExports, getLegalRequests, recordTrialEvent } from '../utils/brandLifecycle';

const brandsService = new BrandsService();

export class BrandsController {
  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const brand = await brandsService.getBrandById(req.brand.id);

      if (!brand) {
        return res.status(404).json({
          error: 'NOT_FOUND',
          message: 'Marca no encontrada',
        });
      }

      // No devolver la contraseña
      const { password, ...brandWithoutPassword } = brand;

      return res.status(200).json(brandWithoutPassword);
    } catch (error: any) {
      console.error('Error en getMe:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener datos de la marca',
      });
    }
  }

  async getWooCommerceMetrics(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const [brand, productSummary, telemetrySummary] = await Promise.all([
        brandsService.getBrandById(req.brand.id),
        getWooProductSummary(req.brand.id),
        getWooTelemetrySummary(req.brand.id, 30),
      ]);

      const socialLinks = ((brand as any)?.social_links || {}) as Record<string, any>;
      const pluginValidatedAt =
        typeof socialLinks.woo_plugin_validated_at === 'string'
          ? socialLinks.woo_plugin_validated_at
          : null;
      const pluginStoreDomain =
        typeof socialLinks.woo_plugin_store_domain === 'string'
          ? socialLinks.woo_plugin_store_domain
          : null;

      return res.status(200).json({
        products: productSummary,
        telemetry: telemetrySummary,
        integration: {
          pluginValidated: Boolean(pluginValidatedAt),
          pluginValidatedAt,
          pluginStoreDomain,
        },
      });
    } catch (error: any) {
      console.error('Error en getWooCommerceMetrics:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener metricas de WooCommerce',
      });
    }
  }

  async updateMe(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      // Fetch current brand to merge JSONB objects like social_links safely
      const currentBrand = await brandsService.getBrandById(req.brand.id);
      if (!currentBrand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
      }

      const updates: UpdateBrandDto = {};

      // Solo permitir actualizar ciertos campos
      if (req.body.name !== undefined) {
        if (typeof req.body.name !== 'string' || req.body.name.trim().length === 0) {
          return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'El nombre no puede estar vacío',
          });
        }
        updates.name = req.body.name;
      }

      if (req.body.logo !== undefined) {
        updates.logo = req.body.logo;
      }

      if (req.body.primary_color !== undefined) {
        updates.primary_color = req.body.primary_color;
      }

      if (req.body.secondary_color !== undefined) {
        updates.secondary_color = req.body.secondary_color;
      }

      if (req.body.widget_template !== undefined) {
        updates.widget_template = req.body.widget_template;
      }

      if (req.body.button_text !== undefined) {
        updates.button_text = req.body.button_text;
      }

      if (req.body.welcome_message !== undefined) {
        updates.welcome_message = req.body.welcome_message;
      }

      if (req.body.onboarding_dismissed !== undefined) {
        updates.onboarding_dismissed = Boolean(req.body.onboarding_dismissed);
      }

      // Campos de contacto / perfil

      const contactFields: (keyof UpdateBrandDto)[] = [
        'phone', 'contact_name', 'address', 'city', 'country', 'nit',
        'state_province', 'postal_code', 'billing_email',
      ];
      for (const field of contactFields) {
        if (req.body[field] !== undefined) {
          (updates as any)[field] = req.body[field];
        }
      }

      // Campos de mini-landing
      const landingFields = [
        'brand_description', 'whatsapp_contact', 'cover_image_url', 'social_links',
        'city_display', 'national_shipping', 'whatsapp_message', 'cta_button_text',
        'rating', 'total_reviews', 'schedule', 'slogan', 'landing_template',
        'modal_title', 'modal_description', 'modal_features',
        'logo_light', 'logo_dark', 'cover_bg_color', 'cover_overlay_opacity',
        'show_brand_name', 'header_color', 'landing_font', 'widget_bg_color',
      ];
      for (const field of landingFields) {
        if (req.body[field] !== undefined) {
          (updates as any)[field] = req.body[field];
        }
      }

      // Merge website / dominios permitidos safely into social_links JSONB
      if (req.body.website !== undefined) {
        const currentSocialLinks = updates.social_links || (currentBrand as any).social_links || {};
        updates.social_links = {
          ...currentSocialLinks,
          website: req.body.website
        };
      }

      if (req.body.allowed_origins !== undefined) {
        const currentSocialLinks = updates.social_links || (currentBrand as any).social_links || {};
        updates.social_links = {
          ...currentSocialLinks,
          allowed_origins: sanitizeDomainList(req.body.allowed_origins),
        };
      }

      // Slug personalizado — solo Plan PRO
      if (req.body.slug !== undefined) {
        if (req.brand.plan !== 'PRO') {
          return res.status(403).json({
            error: 'FORBIDDEN',
            message: 'La personalización del slug requiere Plan Pro',
          });
        }
        const slug = String(req.body.slug).trim().toLowerCase();
        if (!slug || !/^[a-z0-9-]+$/.test(slug) || slug.length < 3) {
          return res.status(400).json({
            error: 'VALIDATION_ERROR',
            message: 'El slug solo puede contener letras minúsculas, números y guiones (mínimo 3 caracteres)',
          });
        }
        updates.slug = slug;
      }

      // Dominio personalizado — solo Plan PRO
      if (req.body.custom_domain !== undefined) {
        if (req.brand.plan !== 'PRO') {
          return res.status(403).json({
            error: 'FORBIDDEN',
            message: 'La configuración de dominio personalizado requiere Plan Pro',
          });
        }
        
        const domain = req.body.custom_domain ? String(req.body.custom_domain).trim().toLowerCase() : null;
        
        if (domain) {
          if (!brandsService.isValidDomain(domain)) {
            return res.status(400).json({
              error: 'VALIDATION_ERROR',
              message: 'El formato del dominio es inválido (ej: tumarca.com)',
            });
          }
          
          // Verificar unicidad
          const existing = await brandsService.getBrandByCustomDomain(domain);
          if (existing && existing.id !== req.brand.id) {
            return res.status(400).json({
              error: 'CONFLICT',
              message: 'Ese dominio ya está configurado por otra marca',
            });
          }
        }
        
        updates.custom_domain = domain;
      }

      // Verificar que hay algo que actualizar
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'No hay campos para actualizar',
        });
      }

      const updatedBrand = await brandsService.updateBrand(req.brand.id, updates);

      // Invalidar caché del probador para este slug
      invalidateBrandConfigCache(updatedBrand.slug);

      // No devolver la contraseña
      const { password, ...brandWithoutPassword } = updatedBrand;

      return res.status(200).json(brandWithoutPassword);
    } catch (error: any) {
      console.error('Error en updateMe:', error);

      if (error.message.includes('hexadecimal') || error.message.includes('slug') || error.message.includes('uso')) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: sanitizeError(error, 'Error de validación en perfil'),
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al actualizar la marca',
      });
    }
  }

  async getNotificationPreferences(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const preferences = await notificationPreferencesService.getPreferences(req.brand.id);

      return res.status(200).json(preferences);
    } catch (error: any) {
      console.error('Error en getNotificationPreferences:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al obtener preferencias de notificaciones',
      });
    }
  }

  async updateNotificationPreferences(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'No autenticado',
        });
      }

      const updates: UpdateNotificationPreferencesDto = {};

      // Validar y extraer campos permitidos
      const allowedFields = [
        'email_enabled',
        'whatsapp_enabled',
        'reminder_7days',
        'reminder_3days',
        'usage_alerts',
      ];

      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (typeof req.body[field] !== 'boolean') {
            return res.status(400).json({
              error: 'VALIDATION_ERROR',
              message: `El campo ${field} debe ser un valor booleano`,
            });
          }
          updates[field as keyof UpdateNotificationPreferencesDto] = req.body[field];
        }
      }

      // Verificar que hay algo que actualizar
      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: 'No hay campos para actualizar',
        });
      }

      const updatedPreferences = await notificationPreferencesService.updatePreferences(
        req.brand.id,
        updates
      );

      return res.status(200).json(updatedPreferences);
    } catch (error: any) {
      console.error('Error en updateNotificationPreferences:', error);

      if (error.message.includes('No hay campos')) {
        return res.status(400).json({
          error: 'VALIDATION_ERROR',
          message: sanitizeError(error, 'Error de validación en preferencias'),
        });
      }

      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al actualizar preferencias de notificaciones',
      });
    }
  }

  /**
   * POST /api/brands/request-upgrade
   * Solicitar upgrade a Plan PRO — envía notificación al admin para gestión manual.
   * El admin aplica el cambio desde el panel una vez confirme el pago.
   * Requirement 29.1
   */
  async requestUpgrade(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      if (req.brand.plan === 'PRO') {
        return res.status(400).json({
          error: 'ALREADY_PRO',
          message: 'Tu marca ya tiene el Plan PRO',
        });
      }

      const brand = await brandsService.getBrandById(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
      }

      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (!adminEmail) {
        console.error('[requestUpgrade] ADMIN_EMAIL no configurado');
        return res.status(500).json({
          error: 'INTERNAL_ERROR',
          message: 'Error de configuración del servidor',
        });
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

      emailService.sendEmail({
        to: adminEmail,
        subject: `Solicitud de upgrade a PRO — ${brand.name}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:#4f46e5;margin-bottom:8px">Solicitud de upgrade a Plan PRO</h2>
            <p style="color:#6b7280;margin-bottom:24px">Una marca solicita cambiar al Plan PRO. Aplica el cambio una vez confirmes el pago.</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Nombre</td><td style="padding:8px 0;font-weight:600;color:#111827">${brand.name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 0;color:#111827">${brand.email}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Slug</td><td style="padding:8px 0;color:#111827">/${brand.slug}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Plan actual</td><td style="padding:8px 0;color:#111827">${brand.plan}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Fecha solicitud</td><td style="padding:8px 0;color:#111827">${new Date().toLocaleString('es-CO')}</td></tr>
            </table>
            <a href="${appUrl}/admin/brands" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Aplicar cambio en el panel admin
            </a>
          </div>
        `,
      }).catch(err => console.error('[requestUpgrade] Error enviando email:', err));

      // Guardar timestamp de la solicitud
      const { supabaseAdmin } = await import('../config/supabase');
      await supabaseAdmin.from('brands').update({ upgrade_requested_at: new Date().toISOString() }).eq('id', brand.id);

      // Notificación persistente en el panel admin
      createAdminNotification({
        type: 'upgrade_request',
        title: 'Solicitud de upgrade a PRO',
        message: `${brand.name} (${brand.email}) solicita cambiar al Plan PRO — pendiente de pago`,
        severity: 'warning',
        brandId: brand.id,
        brandName: brand.name,
        metadata: { fromPlan: brand.plan, toPlan: 'PRO' },
      }).catch(() => {});

      return res.status(200).json({ message: 'Solicitud enviada. Nos contactaremos para coordinar el pago.' });
    } catch (error: any) {
      console.error('Error en requestUpgrade:', error);
      return res.status(500).json({
        error: 'INTERNAL_ERROR',
        message: 'Error al enviar la solicitud de upgrade',
      });
    }
  }

  /**
   * POST /api/brands/request-plan-change
   * Solicitar cambio de plan (upgrade o downgrade) — envía email al admin
   */
  async requestPlanChange(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const { targetPlan, message, months } = req.body;
      if (!targetPlan || !['BASIC', 'PRO'].includes(targetPlan)) {
        return res.status(400).json({ error: 'INVALID_PLAN', message: 'Plan inválido' });
      }
      const monthsCount = Math.min(24, Math.max(1, Number(months) || 1));
      const discountPct = monthsCount >= 12 ? 15 : monthsCount >= 6 ? 10 : monthsCount >= 3 ? 5 : 0;
      const basePrices: Record<string, number> = { BASIC: 150000, PRO: 250000 };
      const totalPrice = Math.round(basePrices[targetPlan] * monthsCount * (1 - discountPct / 100));

      if (req.brand.plan === targetPlan) {
        return res.status(400).json({ error: 'SAME_PLAN', message: 'Ya tienes ese plan' });
      }

      const brand = await brandsService.getBrandById(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
      }

      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (!adminEmail) {
        return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error de configuración' });
      }

      const isUpgrade = targetPlan === 'PRO';
      const changeType = isUpgrade ? 'Upgrade' : 'Downgrade';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lookitry.com';

      const monthsLabel = monthsCount > 1
        ? `${monthsCount} meses${discountPct > 0 ? ` (${discountPct}% descuento — Total: ${totalPrice.toLocaleString('es-CO')} COP)` : ''}`
        : '1 mes';

      await emailService.sendEmail({
        to: adminEmail,
        subject: `Solicitud de ${changeType} — ${brand.name} (${brand.plan} → ${targetPlan})`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px">
            <h2 style="color:${isUpgrade ? '#4f46e5' : '#dc2626'};margin-bottom:8px">
              Solicitud de ${changeType} de Plan
            </h2>
            <p style="color:#6b7280;margin-bottom:24px">
              Una marca ha solicitado cambiar su plan de <strong>${brand.plan}</strong> a <strong>${targetPlan}</strong>.
            </p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Nombre</td><td style="padding:8px 0;font-weight:600;color:#111827">${brand.name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Email</td><td style="padding:8px 0;color:#111827">${brand.email}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Plan actual</td><td style="padding:8px 0;color:#111827">${brand.plan}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Plan solicitado</td><td style="padding:8px 0;font-weight:600;color:${isUpgrade ? '#4f46e5' : '#dc2626'}">${targetPlan}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Meses solicitados</td><td style="padding:8px 0;font-weight:600;color:#111827">${monthsLabel}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280;font-size:14px">Fecha</td><td style="padding:8px 0;color:#111827">${new Date().toLocaleString('es-CO')}</td></tr>
            </table>
            ${message ? `<div style="background:#f9fafb;border-radius:8px;padding:16px;margin-bottom:24px"><p style="color:#6b7280;font-size:12px;margin:0 0 6px">Mensaje del cliente:</p><p style="color:#111827;font-size:14px;margin:0">${message}</p></div>` : ''}
            <a href="${appUrl}/admin/brands" style="display:inline-block;background:${isUpgrade ? '#4f46e5' : '#dc2626'};color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
              Gestionar en el panel admin
            </a>
          </div>
        `,
      });

      // Guardar timestamp de la solicitud en la marca
      const { supabaseAdmin } = await import('../config/supabase');
      await supabaseAdmin.from('brands').update({ upgrade_requested_at: new Date().toISOString() }).eq('id', req.brand.id);

      // Notificación persistente en el panel admin
      const notifTitle = monthsCount > 1
        ? `Solicitud de ${changeType} — ${monthsCount} meses`
        : `Solicitud de ${changeType} de plan`;
      const notifMessage = monthsCount > 1
        ? `${brand.name} solicitó cambiar de ${brand.plan} a ${targetPlan} por ${monthsCount} meses${discountPct > 0 ? ` (${discountPct}% desc.)` : ''}`
        : `${brand.name} (${brand.email}) solicitó cambiar de ${brand.plan} a ${targetPlan}`;

      await createAdminNotification({
        type: 'plan_change_request',
        title: notifTitle,
        message: notifMessage,
        severity: isUpgrade ? 'warning' : 'info',
        brandId: brand.id,
        brandName: brand.name,
        metadata: {
          fromPlan: brand.plan,
          toPlan: targetPlan,
          clientMessage: message || null,
          months: monthsCount,
          discountPct,
          totalPrice,
        },
      });

      return res.status(200).json({ message: 'Solicitud enviada. Nos contactaremos en las próximas 24 horas.' });
    } catch (error: any) {
      console.error('Error en requestPlanChange:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al enviar la solicitud' });
    }
  }

  async getLegalRequests(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const brand = await brandsService.getBrandById(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
      }

      return res.status(200).json({
        requests: getLegalRequests(brand),
        data_exports: getLegalDataExports(brand),
      });
    } catch (error: any) {
      console.error('Error en getLegalRequests:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al obtener solicitudes legales' });
    }
  }

  async createLegalRequest(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const { type } = req.body || {};
      const supportedTypes = ['customers/data_request', 'customers/redact', 'shop/redact', 'app/uninstalled'];
      if (!supportedTypes.includes(type)) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Tipo de solicitud legal inválido' });
      }

      const brand = await brandsService.getBrandById(req.brand.id);
      if (!brand) {
        return res.status(404).json({ error: 'NOT_FOUND', message: 'Marca no encontrada' });
      }

      const requestRecord = await createLegalRequest(brand.id, {
        type,
        status: 'completed',
        completed_at: new Date().toISOString(),
        source: 'dashboard_profile_modal',
        summary: 'Solicitud creada desde autoservicio de perfil',
      });
      let socialLinks = getBrandSocialLinks(brand as any);
      let updates: UpdateBrandDto = {};
      let dataExport: Record<string, unknown> | null = null;
      let dataExportRecord: ReturnType<typeof buildLegalDataExport> | null = null;

      if (type === 'customers/data_request') {
        dataExport = {
          brand: {
            id: brand.id,
            name: brand.name,
            email: brand.email,
            slug: brand.slug,
            plan: brand.plan,
            subscription_status: (brand as any).subscription_status ?? null,
            trial_end_date: (brand as any).trial_end_date ?? null,
          },
          billing: {
            billing_email: (brand as any).billing_email ?? null,
            nit: (brand as any).nit ?? null,
            country: (brand as any).country ?? null,
            city: (brand as any).city ?? null,
          },
          integration: {
            plugin_validated_at: socialLinks.woo_plugin_validated_at ?? null,
            plugin_store_domain: socialLinks.woo_plugin_store_domain ?? null,
            website: socialLinks.website ?? null,
          },
        };
        dataExportRecord = buildLegalDataExport(requestRecord.id, dataExport);
      }

      if (type === 'customers/redact') {
        socialLinks = {
          ...socialLinks,
          customers_redacted_at: new Date().toISOString(),
          marketing_blocked_at: socialLinks.marketing_blocked_at ?? new Date().toISOString(),
        };
        updates.social_links = socialLinks;
      }

      if (type === 'shop/redact') {
        socialLinks = {
          ...socialLinks,
          shop_redacted_at: new Date().toISOString(),
          website: null,
          allowed_origins: [],
          woo_plugin_validated_at: null,
          woo_plugin_store_domain: null,
          integration_paused_at: new Date().toISOString(),
          marketing_blocked_at: socialLinks.marketing_blocked_at ?? new Date().toISOString(),
        };
        updates = {
          ...updates,
          name: 'Cuenta redactada',
          phone: null as any,
          contact_name: null as any,
          address: null as any,
          city: null as any,
          country: null as any,
          nit: null as any,
          state_province: null as any,
          postal_code: null as any,
          billing_email: null as any,
          custom_domain: null,
          has_landing_page: false,
          social_links: socialLinks,
        };
      }

      if (type === 'app/uninstalled') {
        socialLinks = {
          ...socialLinks,
          app_uninstalled_at: new Date().toISOString(),
          integration_paused_at: new Date().toISOString(),
          billing_paused_at: new Date().toISOString(),
          credits_paused_at: new Date().toISOString(),
          woo_plugin_validated_at: null,
          woo_plugin_store_domain: null,
          woo_plugin_validation_source: 'self_service_uninstall',
        };
        updates = {
          ...updates,
          has_landing_page: false,
          social_links: socialLinks,
        };
      }

      updates.social_links = {
        ...(updates.social_links || socialLinks),
        legal_requests: [...getLegalRequests({ ...(brand as any), social_links: updates.social_links || socialLinks } as any), requestRecord],
        legal_data_exports: dataExportRecord
          ? [dataExportRecord, ...getLegalDataExports({ ...(brand as any), social_links: updates.social_links || socialLinks } as any)].slice(0, 10)
          : getLegalDataExports({ ...(brand as any), social_links: updates.social_links || socialLinks } as any),
      };

      const updatedBrand = await brandsService.updateBrand(req.brand.id, updates);

      return res.status(201).json({
        message: 'Solicitud legal registrada',
        request: requestRecord,
        requests: getLegalRequests(updatedBrand as any),
        data: dataExport,
        data_export: dataExportRecord,
        data_exports: getLegalDataExports(updatedBrand as any),
      });
    } catch (error: any) {
      console.error('Error en createLegalRequest:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al registrar la solicitud legal' });
    }
  }

  async createTrialEvent(req: AuthRequest, res: Response) {
    try {
      if (!req.brand) {
        return res.status(401).json({ error: 'UNAUTHORIZED', message: 'No autenticado' });
      }

      const { eventName, metadata } = req.body || {};
      const supportedEvents = [
        'trial_started',
        'trial_email_verified',
        'first_product_created',
        'first_generation_completed',
        'checkout_viewed',
        'trial_expiring',
        'trial_expired',
        'trial_converted',
      ];

      if (!supportedEvents.includes(eventName)) {
        return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Evento de trial inválido' });
      }

      await recordTrialEvent(req.brand.id, eventName as any, metadata && typeof metadata === 'object' ? metadata : {});
      return res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error en createTrialEvent:', error);
      return res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Error al registrar el evento trial' });
    }
  }
}
