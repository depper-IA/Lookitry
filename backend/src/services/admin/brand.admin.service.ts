import { supabaseAdmin } from '../../config/supabase';
import bcrypt from 'bcryptjs';
import { getBrandSocialLinks } from '../../utils/brandLifecycle';

export interface BrandWithStats {
  id: string;
  email: string;
  name: string;
  slug: string;
  plan: string;
  created_at: string;
  products_count: number;
  generations_count: number;
  last_generation: string | null;
}

/**
 * Brand Admin Service — Gestión de marcas desde el panel de administración.
 * Extraído de AdminService para mejorar mantenibilidad.
 */
export class BrandAdminService {
  /**
   * Obtener todas las marcas con estadísticas (optimizado con Promise.all)
   */
  async getAllBrandsWithStats(): Promise<any[]> {
    try {
      const { data: brands, error } = await supabaseAdmin
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !brands) {
        throw new Error('Error al obtener marcas: ' + error?.message);
      }

      const brandIds = brands.map(b => b.id);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [productsData, generationsData, monthlyData, successData, failedData] = await Promise.all([
        supabaseAdmin.from('products').select('brand_id').in('brand_id', brandIds).eq('is_active', true),
        supabaseAdmin.from('generations').select('brand_id').in('brand_id', brandIds),
        supabaseAdmin.from('generations').select('brand_id').in('brand_id', brandIds).gte('generated_at', startOfMonth.toISOString()),
        supabaseAdmin.from('generations').select('brand_id').in('brand_id', brandIds).eq('status', 'SUCCESS'),
        supabaseAdmin.from('generations').select('brand_id').in('brand_id', brandIds).eq('status', 'FAILED'),
      ]);

      const productCounts: Record<string, number> = {};
      const generationCounts: Record<string, number> = {};
      const monthlyCounts: Record<string, number> = {};
      const successCounts: Record<string, number> = {};
      const failedCounts: Record<string, number> = {};

      productsData.data?.forEach(p => { productCounts[p.brand_id] = (productCounts[p.brand_id] || 0) + 1; });
      generationsData.data?.forEach(g => { generationCounts[g.brand_id] = (generationCounts[g.brand_id] || 0) + 1; });
      monthlyData.data?.forEach(m => { monthlyCounts[m.brand_id] = (monthlyCounts[m.brand_id] || 0) + 1; });
      successData.data?.forEach(s => { successCounts[s.brand_id] = (successCounts[s.brand_id] || 0) + 1; });
      failedData.data?.forEach(f => { failedCounts[f.brand_id] = (failedCounts[f.brand_id] || 0) + 1; });

      return brands.map(brand => {
        const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
        const isInTrial =
          brand.plan === 'TRIAL' &&
          trialEnd !== null &&
          trialEnd > now &&
          brand.subscription_status !== 'suspended';
        const trialDaysRemaining = isInTrial && trialEnd
          ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          : null;

        return {
          id: brand.id,
          email: brand.email,
          name: brand.name,
          slug: brand.slug,
          plan: brand.plan,
          created_at: brand.created_at,
          phone: brand.phone,
          address: brand.address,
          city: brand.city,
          country: brand.country,
          contact_name: brand.contact_name,
          subscription_status: brand.subscription_status,
          trial_end_date: brand.trial_end_date,
          is_in_trial: isInTrial,
          trial_days_remaining: trialDaysRemaining,
          has_landing_page: brand.has_landing_page ?? false,
          modal_title: brand.modal_title ?? null,
          modal_description: brand.modal_description ?? null,
          modal_features: brand.modal_features ?? null,
          totalGenerations: generationCounts[brand.id] || 0,
          successfulGenerations: successCounts[brand.id] || 0,
          failedGenerations: failedCounts[brand.id] || 0,
          generationsThisMonth: monthlyCounts[brand.id] || 0,
          productsCount: productCounts[brand.id] || 0,
          // Retrocompatibilidad
          stats: {
            productsCount: productCounts[brand.id] || 0,
            generationsCount: generationCounts[brand.id] || 0,
            generationsThisMonth: monthlyCounts[brand.id] || 0,
          },
        };
      });
    } catch (error) {
      console.error('Error in getAllBrandsWithStats:', error);
      throw error;
    }
  }

  /**
   * Cambiar el plan de una marca (solo entre planes pagos activos)
   */
  async changeBrandPlan(brandId: string, newPlan: 'BASIC' | 'PRO'): Promise<void> {
    const { data: current } = await supabaseAdmin
      .from('brands')
      .select('plan, subscription_start_date, subscription_end_date, subscription_status, trial_end_date')
      .eq('id', brandId)
      .single();

    const updatePayload: Record<string, any> = { plan: newPlan };
    const now = new Date();

    const hasActiveTrial =
      current?.plan === 'TRIAL' &&
      !!current?.trial_end_date &&
      new Date(current.trial_end_date).getTime() > now.getTime() &&
      current?.subscription_status !== 'active' &&
      current?.subscription_status !== 'expiring_soon';

    if (hasActiveTrial) {
      throw new Error('PLAN_CHANGE_REQUIRES_PAYMENT');
    }

    const hasActivePaidSubscription =
      !!current?.subscription_end_date &&
      new Date(current.subscription_end_date).getTime() > now.getTime() &&
      (current?.subscription_status === 'active' || current?.subscription_status === 'expiring_soon');

    if (!hasActivePaidSubscription) {
      throw new Error('PLAN_CHANGE_REQUIRES_ACTIVE_SUBSCRIPTION');
    }

    const status = current?.subscription_status;
    if (!status || status === 'suspended' || status === 'expired') {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
      updatePayload.subscription_status = 'active';
      if (!current?.subscription_start_date) updatePayload.subscription_start_date = now.toISOString();
      if (!current?.subscription_end_date) updatePayload.subscription_end_date = endDate.toISOString();
    }

    const { error } = await supabaseAdmin.from('brands').update(updatePayload).eq('id', brandId);
    if (error) throw new Error('Error al cambiar plan: ' + error.message);
  }

  /**
   * Archivar una marca (soft delete — suspende y registra en social_links)
   */
  async deleteBrand(brandId: string): Promise<void> {
    const { data: brand, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .single();

    if (fetchError || !brand) throw new Error('Marca no encontrada');

    const socialLinks = getBrandSocialLinks(brand as any);

    const { error: deleteError } = await supabaseAdmin
      .from('brands')
      .update({
        subscription_status: 'suspended',
        has_landing_page: false,
        landing_suspended_at: new Date().toISOString(),
        social_links: {
          ...socialLinks,
          account_archived_at: new Date().toISOString(),
          account_archived_reason: 'admin_delete',
          account_archived_by: 'admin',
        },
      })
      .eq('id', brandId);

    if (deleteError) throw new Error('Error al archivar marca: ' + deleteError.message);
  }

  /**
   * Eliminar un producto inactivo de una marca
   */
  async deleteInactiveProduct(brandId: string, productId: string): Promise<void> {
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, is_active, brand_id')
      .eq('id', productId)
      .eq('brand_id', brandId)
      .single();

    if (fetchError || !product) throw new Error('Producto no encontrado o no pertenece a esta marca');
    if (product.is_active) throw new Error('Solo se pueden eliminar productos inactivos');

    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('brand_id', brandId);

    if (deleteError) throw new Error('Error al eliminar producto: ' + deleteError.message);
  }

  /**
   * Obtener productos de una marca específica
   */
  async getBrandProducts(brandId: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('brand_id', brandId)
      .order('created_at', { ascending: false });

    if (error) throw new Error('Error al obtener productos: ' + error.message);
    return data || [];
  }

  /**
   * Crear una nueva marca manualmente desde el panel admin
   */
  async createBrand(data: {
    email: string;
    password: string;
    name: string;
    slug: string;
    plan?: 'BASIC' | 'PRO' | 'TRIAL';
    trial_days?: number;
    phone?: string;
    contact_name?: string;
  }) {
    const { data: existingEmail } = await supabaseAdmin.from('brands').select('id').eq('email', data.email).single();
    if (existingEmail) throw new Error('El email ya está registrado');

    const { data: existingSlug } = await supabaseAdmin.from('brands').select('id').eq('slug', data.slug).single();
    if (existingSlug) throw new Error('El slug ya está en uso');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const trialDays = data.trial_days ?? 7;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    const requestedPlan = String(data.plan || 'TRIAL').toUpperCase();

    const { data: newBrand, error } = await supabaseAdmin
      .from('brands')
      .insert({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        slug: data.slug,
        plan: requestedPlan,
        phone: data.phone || null,
        contact_name: data.contact_name || null,
        subscription_status: null,
        trial_end_date: trialEndDate.toISOString(),
        trial_generations_limit: 30,
      })
      .select()
      .single();

    if (error || !newBrand) throw new Error('Error al crear la marca: ' + error?.message);
    return newBrand;
  }

  /**
   * Obtener marcas en período de prueba activo
   */
  async getTrialBrands() {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, slug, plan, trial_end_date, subscription_status, created_at')
      .eq('plan', 'TRIAL')
      .gt('trial_end_date', now)
      .neq('subscription_status', 'suspended')
      .order('trial_end_date', { ascending: true });

    if (error) throw new Error('Error al obtener marcas en trial: ' + error.message);

    return (data || []).map(brand => {
      const trialEnd = new Date(brand.trial_end_date);
      const diffMs = trialEnd.getTime() - new Date().getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...brand, trial_days_remaining: daysRemaining };
    });
  }

  /**
   * Obtener ficha completa de una marca (para la vista de detalle del admin)
   */
  async getBrandFull(brandId: string) {
    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !brand) throw new Error('Marca no encontrada');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [productsRes, generationsRes, paymentsRes, feedbackRes] = await Promise.all([
      supabaseAdmin.from('products').select('id, name, category, is_active, external_id, created_at').eq('brand_id', brandId).order('created_at', { ascending: false }),
      supabaseAdmin.from('generations').select('id, status, generated_at, error_message, product_id').eq('brand_id', brandId).gte('generated_at', thirtyDaysAgo.toISOString()).order('generated_at', { ascending: false }).limit(50),
      supabaseAdmin.from('subscription_payments').select('id, amount, currency, status, payment_date, payment_method, notes').eq('brand_id', brandId).order('payment_date', { ascending: false }).limit(20),
      supabaseAdmin.from('generation_feedback').select('id, error_type, comment, created_at, resolved').eq('brand_id', brandId).order('created_at', { ascending: false }).limit(20),
    ]);

    const products = productsRes.data || [];
    const generations = generationsRes.data || [];
    const payments = paymentsRes.data || [];
    const feedback = feedbackRes.data || [];

    const totalGenerations = generations.length;
    const successfulGenerations = generations.filter(g => g.status === 'SUCCESS').length;
    const failedGenerations = generations.filter(g => g.status === 'FAILED').length;
    const successRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 0;
    const totalRevenue = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    const isInTrial = brand.plan === 'TRIAL' && brand.trial_end_date && new Date(brand.trial_end_date) > now;
    const trialDaysRemaining = isInTrial ? Math.ceil((new Date(brand.trial_end_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

    const riskFactors: string[] = [];
    let riskScore = 0;
    if (isInTrial && trialDaysRemaining !== null && trialDaysRemaining <= 3) { riskFactors.push(`Trial expira en ${trialDaysRemaining} días`); riskScore += 30; }
    if (totalGenerations === 0) { riskFactors.push('Sin uso en 30 días'); riskScore += 25; }
    if (totalGenerations > 0 && failedGenerations / totalGenerations > 0.5) { riskFactors.push('Alta tasa de error en generaciones'); riskScore += 25; }
    if (brand.subscription_status === 'suspended') { riskFactors.push('Suscripción suspendida'); riskScore += 40; }

    return {
      brand: {
        id: brand.id, name: brand.name, email: brand.email, slug: brand.slug, plan: brand.plan,
        subscription_status: brand.subscription_status, trial_end_date: brand.trial_end_date,
        subscription_end_date: brand.subscription_end_date, created_at: brand.created_at,
        has_landing_page: brand.has_landing_page, landing_suspended_at: brand.landing_suspended_at,
        phone: brand.phone, contact_name: brand.contact_name,
        is_in_trial: isInTrial, trial_days_remaining: trialDaysRemaining,
      },
      usage: {
        products_count: products.length,
        active_products: products.filter(p => p.is_active).length,
        generations_30d: totalGenerations,
        successful_generations: successfulGenerations,
        failed_generations: failedGenerations,
        success_rate: Math.round(successRate * 10) / 10,
        last_generation: generations[0]?.generated_at || null,
      },
      finances: {
        total_revenue: totalRevenue,
        payments,
        payment_count: payments.length,
        failed_payments: payments.filter(p => p.status === 'failed').length,
      },
      support: {
        feedback_count: feedback.length,
        unresolved_feedback: feedback.filter(f => !f.resolved).length,
        feedback,
      },
      risk: { score: Math.min(riskScore, 100), factors: riskFactors },
      products,
      recent_generations: generations,
    };
  }
}

export const brandAdminService = new BrandAdminService();
