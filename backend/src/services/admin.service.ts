import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getReportingTrm, normalizePaymentRecordToCop } from '../utils/paymentNormalization';
import {
  getPaymentDisplayBrand,
  inferBillingType,
  inferIncludesLanding,
} from '../utils/paymentLedger';
import { getBrandSocialLinks } from '../utils/brandLifecycle';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

type AdminRecord = Admin & {
  password: string;
  permissions?: string[];
  reset_token?: string | null;
  reset_token_expires_at?: string | null;
};

type PricingMetaData = {
  replicate_api_token?: string;
  replicate_monthly_budget_usd?: number;
  replicate_cost_per_generation_usd?: number;
};

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

export class AdminService {
  /**
   * Obtener admin por email
   */
  async getAdminByEmail(email: string): Promise<Admin | null> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Admin;
  }

  /**
   * Obtener admin por ID
   */
  async getAdminById(adminId: string): Promise<Admin | null> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('id', adminId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as Admin;
  }

  /**
   * Verificar contraseña de admin
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  private isValidBcryptHash(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
  }

  /**
   * Listar todos los admins (sin exponer passwords)
   */
  async listAdmins(): Promise<Omit<Admin, 'password'>[]> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, name, role, permissions, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) throw new Error('Error al obtener admins: ' + error.message);
    return (data || []) as any;
  }

  /**
   * Crear un nuevo admin con permisos opcionales
   */
  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    permissions?: string[];
  }): Promise<Omit<Admin, 'password'>> {
    const { data: existing } = await supabaseAdmin
      .from('admins')
      .select('id, social_links')
      .eq('email', data.email)
      .single();

    if (existing) throw new Error('El email ya está registrado como admin');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        role: 'admin',
        permissions: data.permissions || [],
      })
      .select('id, email, name, role, permissions, created_at, updated_at')
      .single();

    if (error || !newAdmin) throw new Error('Error al crear admin: ' + error?.message);
    return newAdmin as any;
  }

  /**
   * Actualizar permisos de un admin
   */
  async updateAdminPermissions(adminId: string, permissions: string[]): Promise<void> {
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ permissions })
      .eq('id', adminId);

    if (error) throw new Error('Error al actualizar permisos: ' + error.message);
  }

  async changeAdminPassword(adminId: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');

    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, social_links')
      .eq('id', adminId)
      .single();

    if (error || !admin) throw new Error('Admin no encontrado');

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        password: hashed,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);
  }

  /**
   * Resetear contraseña de un admin y devolver la nueva contraseña en texto plano
   * para que el controlador la envíe por email.
   */
  async resetAdminPassword(adminId: string): Promise<{ admin: Omit<Admin, 'password'>; newPassword: string }> {
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('id, email, name, role, permissions, created_at, updated_at')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) throw new Error('Admin no encontrado');

    // Generar contraseña temporal segura: 12 chars alfanuméricos
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let newPassword = '';
    for (let i = 0; i < 12; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', adminId);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);

    return { admin: admin as any, newPassword };
  }

  /**
   * Cambiar la contraseña del admin autenticado (self-service)
   */
  async changeOwnPassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, password')
      .eq('id', adminId)
      .single();

    if (error || !admin) throw new Error('Admin no encontrado');

    const adminRecord = admin as Pick<AdminRecord, 'id' | 'password'>;

    if (!this.isValidBcryptHash(adminRecord.password)) {
      throw new Error('La cuenta de administrador tiene una contraseña inválida en base de datos. Restablécela desde el panel o recrea el admin con el script seguro.');
    }

    const valid = await bcrypt.compare(currentPassword, adminRecord.password);
    if (!valid) throw new Error('La contraseña actual es incorrecta');

    if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
    if (newPassword === currentPassword) throw new Error('La nueva contraseña debe ser diferente a la actual');

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        password: hashed,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', adminId);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);
  }

  async requestPasswordResetGetToken(email: string): Promise<{
    admin: { name: string; email: string } | null;
    token: string | null;
  }> {
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('id, name, email')
      .eq('email', email)
      .single();

    if (!admin) {
      return { admin: null, token: null };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { error } = await supabaseAdmin
      .from('admins')
      .update({
        reset_token: token,
        reset_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.id);

    if (error) {
      throw new Error('Error al generar token de recuperación: ' + error.message);
    }

    return { admin: { name: admin.name, email: admin.email }, token };
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const { data: admin, error } = await supabaseAdmin
      .from('admins')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single();

    if (error || !admin) {
      throw new Error('TOKEN_INVALID');
    }

    const expiresAt = admin.reset_token_expires_at ? new Date(admin.reset_token_expires_at) : null;
    if (!expiresAt || expiresAt < new Date()) {
      throw new Error('TOKEN_EXPIRED');
    }

    if (newPassword.length < 8) {
      throw new Error('PASSWORD_TOO_SHORT');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({
        password: hashed,
        reset_token: null,
        reset_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.id);

    if (updateError) {
      throw new Error('Error al actualizar contraseña: ' + updateError.message);
    }
  }

  /**
   * Eliminar un admin (no puede eliminarse a sí mismo)
   */
  async deleteAdmin(adminId: string, requestingAdminId: string): Promise<void> {
    if (adminId === requestingAdminId) throw new Error('No puedes eliminarte a ti mismo');

    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', adminId);

    if (error) throw new Error('Error al eliminar admin: ' + error.message);
  }


  /**
   * Obtener todas las marcas con estadísticas (optimizado)
   */
  async getAllBrandsWithStats(): Promise<any[]> {
    try {
      // 1. Obtener todas las marcas
      const { data: brands, error } = await supabaseAdmin
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !brands) {
        throw new Error('Error al obtener marcas: ' + error?.message);
      }

      // 2. Obtener todos los IDs de marcas
      const brandIds = brands.map(b => b.id);

      // 3. Obtener todas las estadísticas en una sola consulta por tipo
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [productsData, generationsData, monthlyData, successData, failedData] = await Promise.all([
        // Productos por marca
        supabaseAdmin
          .from('products')
          .select('brand_id')
          .in('brand_id', brandIds)
          .eq('is_active', true),
        // Generaciones totales por marca
        supabaseAdmin
          .from('generations')
          .select('brand_id')
          .in('brand_id', brandIds),
        // Generaciones del mes por marca
        supabaseAdmin
          .from('generations')
          .select('brand_id')
          .in('brand_id', brandIds)
          .gte('generated_at', startOfMonth.toISOString()),
        // Exitosas
        supabaseAdmin
          .from('generations')
          .select('brand_id')
          .in('brand_id', brandIds)
          .eq('status', 'SUCCESS'),
        // Fallidas
        supabaseAdmin
          .from('generations')
          .select('brand_id')
          .in('brand_id', brandIds)
          .eq('status', 'FAILED'),
      ]);

      // 4. Contar por marca
      const productCounts: Record<string, number> = {};
      const generationCounts: Record<string, number> = {};
      const monthlyCounts: Record<string, number> = {};
      const successCounts: Record<string, number> = {};
      const failedCounts: Record<string, number> = {};

      productsData.data?.forEach(p => {
        productCounts[p.brand_id] = (productCounts[p.brand_id] || 0) + 1;
      });

      generationsData.data?.forEach(g => {
        generationCounts[g.brand_id] = (generationCounts[g.brand_id] || 0) + 1;
      });

      monthlyData.data?.forEach(m => {
        monthlyCounts[m.brand_id] = (monthlyCounts[m.brand_id] || 0) + 1;
      });

      successData.data?.forEach(s => {
        successCounts[s.brand_id] = (successCounts[s.brand_id] || 0) + 1;
      });

      failedData.data?.forEach(f => {
        failedCounts[f.brand_id] = (failedCounts[f.brand_id] || 0) + 1;
      });

      // 5. Combinar datos
      const brandsWithStats = brands.map(brand => {
        const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
        const now = new Date();
        const isInTrial =
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
          // Propiedades aplanadas para el frontend (AdminAnalyticsPage)
          totalGenerations: generationCounts[brand.id] || 0,
          successfulGenerations: successCounts[brand.id] || 0,
          failedGenerations: failedCounts[brand.id] || 0,
          generationsThisMonth: monthlyCounts[brand.id] || 0,
          productsCount: productCounts[brand.id] || 0,
          // Mantener objeto stats por retrocompatibilidad
          stats: {
            productsCount: productCounts[brand.id] || 0,
            generationsCount: generationCounts[brand.id] || 0,
            generationsThisMonth: monthlyCounts[brand.id] || 0,
          },
        };
      });

      return brandsWithStats;
    } catch (error) {
      console.error('Error in getAllBrandsWithStats:', error);
      throw error;
    }
  }

  /**
   * Cambiar plan de una marca
   */
  async changeBrandPlan(brandId: string, newPlan: 'BASIC' | 'PRO'): Promise<void> {
    // Leer fechas actuales para no pisarlas si ya existen
    const { data: current } = await supabaseAdmin
      .from('brands')
      .select('subscription_start_date, subscription_end_date, subscription_status, trial_end_date')
      .eq('id', brandId)
      .single();

    const updatePayload: Record<string, any> = { plan: newPlan };
    const now = new Date();
    const hasActiveTrial =
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

    // Solo activar si estaba suspendida/expirada o sin estado
    const status = current?.subscription_status;
    if (!status || status === 'suspended' || status === 'expired') {
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
      updatePayload.subscription_status = 'active';
      // Solo poner fechas si no existían
      if (!current?.subscription_start_date) updatePayload.subscription_start_date = now.toISOString();
      if (!current?.subscription_end_date) updatePayload.subscription_end_date = endDate.toISOString();
    }

    const { error } = await supabaseAdmin
      .from('brands')
      .update(updatePayload)
      .eq('id', brandId);

    if (error) {
      throw new Error('Error al cambiar plan: ' + error.message);
    }
  }

  /**
   * Obtener estadísticas globales del sistema
   */
  async getGlobalStats() {
    // Total de marcas
    const { count: totalBrands } = await supabaseAdmin
      .from('brands')
      .select('*', { count: 'exact', head: true });

    // Total de productos
    const { count: totalProducts } = await supabaseAdmin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Total de generaciones
    const { count: totalGenerations } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true });

    // Generaciones exitosas
    const { count: successfulGenerations } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUCCESS');

    // Generaciones del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { count: generationsThisMonth } = await supabaseAdmin
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .gte('generated_at', startOfMonth.toISOString());
    
    const { data: brandsForPlanStats, error: brandsForPlanStatsError } = await supabaseAdmin
      .from('brands')
      .select('plan, subscription_status, trial_end_date');

    if (brandsForPlanStatsError) {
      throw new Error('Error al obtener distribucion de planes: ' + brandsForPlanStatsError.message);
    }

    const brandsByPlan = (brandsForPlanStats || []).reduce(
      (acc, brand) => {
        const inTrial =
          !!brand.trial_end_date &&
          new Date(brand.trial_end_date) > now &&
          brand.subscription_status !== 'suspended';

        if (inTrial) {
          acc.TRIAL += 1;
        } else if (brand.plan === 'PRO') {
          acc.PRO += 1;
        } else {
          acc.BASIC += 1;
        }

        return acc;
      },
      { BASIC: 0, PRO: 0, TRIAL: 0 }
    );

    // Mini-landings: activas
    const { count: landingsActive } = await supabaseAdmin
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('has_landing_page', true);

    // Mini-landings: suspendidas
    const { count: landingsSuspended } = await supabaseAdmin
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .not('landing_suspended_at', 'is', null);

    // Mini-landings: sin activar (has_landing_page = false y landing_suspended_at = null)
    const { count: landingsInactive } = await supabaseAdmin
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('has_landing_page', false)
      .is('landing_suspended_at', null);

    // Generaciones por mes (últimos 6 meses)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const { data: recentGenerations, error: recentGenerationsError } = await supabaseAdmin
        .from('generations')
        .select('generated_at, status')
        .gte('generated_at', sixMonthsAgo.toISOString())
        .order('generated_at', { ascending: true });

      if (recentGenerationsError) {
        throw new Error(`Error al obtener generaciones recientes: ${recentGenerationsError.message}`);
      }

      const monthlyMap = new Map<string, { total: number; success: number; failed: number }>();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, { total: 0, success: 0, failed: 0 });
      }

      recentGenerations?.forEach(generation => {
        if (!generation.generated_at) return;

        const generatedAt = new Date(generation.generated_at);
        if (Number.isNaN(generatedAt.getTime())) return;

        const key = `${generatedAt.getFullYear()}-${String(generatedAt.getMonth() + 1).padStart(2, '0')}`;
        if (!monthlyMap.has(key)) return;

        const stats = monthlyMap.get(key)!;
        const normalizedStatus = String(generation.status || '').toUpperCase();

        stats.total++;
        if (normalizedStatus === 'SUCCESS') stats.success++;
        else if (normalizedStatus === 'FAILED') stats.failed++;
      });

    const generationsByMonth = Array.from(monthlyMap.entries())
      .map(([month, s]) => ({ month, ...s }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalBrands: totalBrands || 0,
      totalProducts: totalProducts || 0,
      totalGenerations: totalGenerations || 0,
      successfulGenerations: successfulGenerations || 0,
      failedGenerations: (totalGenerations || 0) - (successfulGenerations || 0),
      generationsThisMonth: generationsThisMonth || 0,
      successRate: totalGenerations ? ((successfulGenerations || 0) / totalGenerations) * 100 : 0,
      brandsByPlan,
      landingStats: {
        active: landingsActive || 0,
        suspended: landingsSuspended || 0,
        inactive: landingsInactive || 0,
      },
      generationsByMonth,
    };
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

    if (error) {
      throw new Error('Error al obtener productos: ' + error.message);
    }

    return data || [];
  }

  /**
   * Elimina permanentemente un producto inactivo de una marca.
   * Solo permite eliminar productos con is_active = false.
   *
   * @param brandId - ID de la marca propietaria
   * @param productId - ID del producto a eliminar
   */
  /**
   * Eliminar una marca y todos sus datos relacionados (productos, generaciones, pagos)
   */
  async deleteBrand(brandId: string): Promise<void> {
    // Verificar que la marca existe
    const { data: brand, error: fetchError } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('id', brandId)
      .single();

    if (fetchError || !brand) {
      throw new Error('Marca no encontrada');
    }

    // Eliminar en cascada: generaciones, pagos, productos, preferencias de notificación
    const socialLinks = getBrandSocialLinks(brand as any);

    // Eliminar la marca
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

    if (deleteError) {
      throw new Error('Error al archivar marca: ' + deleteError.message);
    }
  }

  async deleteInactiveProduct(brandId: string, productId: string): Promise<void> {
    // Verificar que el producto existe, pertenece a la marca y está inactivo
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('products')
      .select('id, is_active, brand_id')
      .eq('id', productId)
      .eq('brand_id', brandId)
      .single();

    if (fetchError || !product) {
      throw new Error('Producto no encontrado o no pertenece a esta marca');
    }

    if (product.is_active) {
      throw new Error('Solo se pueden eliminar productos inactivos');
    }

    const { error: deleteError } = await supabaseAdmin
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('brand_id', brandId);

    if (deleteError) {
      throw new Error('Error al eliminar producto: ' + deleteError.message);
    }
  }

  /**
   * Activar plan de una marca que está en período de prueba.
   * Convierte el trial en suscripción activa pagada por 30 días.
   *
   * Requirement: 11 (Opción C)
   */
  async activateBrandPlan(
    brandId: string,
    options: {
      plan: 'BASIC' | 'PRO';
      amount: number;
      payment_method: string;
      notes: string;
    }
  ) {
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + 30);

    const { data: updatedBrand, error } = await supabaseAdmin
      .from('brands')
      .update({
        plan: options.plan,
        subscription_status: 'active',
        subscription_start_date: now.toISOString(),
        subscription_end_date: endDate.toISOString(),
        last_payment_date: now.toISOString(),
        next_payment_date: endDate.toISOString(),
      })
      .eq('id', brandId)
      .select()
      .single();

    if (error || !updatedBrand) {
      throw new Error('Error al activar plan: ' + error?.message);
    }

    // Registrar pago si hay monto
    if (options.amount > 0) {
      await supabaseAdmin.from('subscription_payments').insert({
        brand_id: brandId,
        amount: options.amount,
        currency: 'COP',
        payment_date: now.toISOString(),
        payment_method: options.payment_method,
        status: 'completed',
        notes: options.notes,
      });
    }

    return updatedBrand;
  }

  /**
   * Crear una nueva marca manualmente desde el panel admin.
   * La marca se crea con período de prueba activo (trial).
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
    // Validar email único
    const { data: existingEmail } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingEmail) {
      throw new Error('El email ya está registrado');
    }

    // Validar slug único
    const { data: existingSlug } = await supabaseAdmin
      .from('brands')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existingSlug) {
      throw new Error('El slug ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const trialDays = data.trial_days ?? 7;
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + trialDays);
    const requestedPlan = String(data.plan || 'TRIAL').toUpperCase();
    const persistedPlan = requestedPlan === 'TRIAL' ? 'BASIC' : requestedPlan;

    const { data: newBrand, error } = await supabaseAdmin
      .from('brands')
      .insert({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        slug: data.slug,
        plan: persistedPlan,
        phone: data.phone || null,
        contact_name: data.contact_name || null,
        subscription_status: null,
        trial_end_date: trialEndDate.toISOString(),
        trial_generations_limit: 30,
      })
      .select()
      .single();

    if (error || !newBrand) {
      throw new Error('Error al crear la marca: ' + error?.message);
    }

    return newBrand;
  }

  /**
   * Obtener marcas en período de prueba activo
   *
   * Requirement: 11 (Opción C)
   */
  async getTrialBrands() {
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, slug, plan, trial_end_date, subscription_status, created_at')
      .gt('trial_end_date', now)
      .neq('subscription_status', 'suspended')
      .order('trial_end_date', { ascending: true });

    if (error) {
      throw new Error('Error al obtener marcas en trial: ' + error.message);
    }

    return (data || []).map(brand => {
      const trialEnd = new Date(brand.trial_end_date);
      const diffMs = trialEnd.getTime() - new Date().getTime();
      const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { ...brand, trial_days_remaining: daysRemaining };
    });
  }

  /**
   * Métricas de conversión: marcas en trial, convertidas, tasa de conversión y conversiones por mes.
   * Requirement 29.2
   */
  async getConversionStats() {
    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, slug, plan, subscription_status, trial_end_date, created_at')
      .order('created_at', { ascending: true });

    if (error || !brands) {
      throw new Error('Error al obtener datos de conversión: ' + error?.message);
    }

    const now = new Date();

    // Marcas en trial activo: el modelo real se deriva por trial_end_date vigente.
    const inTrial = brands.filter(b => {
      if (!b.trial_end_date) return false;
      const trialEnd = new Date(b.trial_end_date);
      if (trialEnd <= now) return false;
      return b.subscription_status !== 'suspended';
    });

    // Marcas convertidas (tienen suscripción activa o por vencer)
    const converted = brands.filter(b =>
      b.subscription_status === 'active' || b.subscription_status === 'expiring_soon'
    );

    const totalBrands = brands.length;
    const conversionRate = totalBrands > 0
      ? Math.round((converted.length / totalBrands) * 100)
      : 0;
    const trialRate = totalBrands > 0
      ? Math.round((inTrial.length / totalBrands) * 100)
      : 0;

    // Conversiones por mes (últimos 6 meses) — basado en created_at de marcas convertidas
    const monthlyConversions: Record<string, number> = {};
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    // Inicializar los últimos 6 meses con 0
    for (let i = 0; i < 6; i++) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - (5 - i));
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyConversions[key] = 0;
    }

    // Contar conversiones por mes de registro de marcas convertidas
    converted.forEach(b => {
      const createdAt = new Date(b.created_at);
      if (createdAt >= sixMonthsAgo) {
        const key = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        if (key in monthlyConversions) {
          monthlyConversions[key]++;
        }
      }
    });

    const conversionsByMonth = Object.entries(monthlyConversions).map(([month, count]) => ({
      month,
      count,
    }));

    const activeTrials = inTrial
      .map((brand) => {
        const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
        const diffMs = trialEnd ? trialEnd.getTime() - now.getTime() : 0;
        const daysRemaining = trialEnd ? Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24))) : 0;

        return {
          id: brand.id,
          name: brand.name,
          email: brand.email,
          slug: brand.slug,
          plan: brand.plan,
          subscription_status: brand.subscription_status,
          trial_end_date: brand.trial_end_date,
          created_at: brand.created_at,
          trial_days_remaining: daysRemaining,
        };
      })
      .sort((a, b) => a.trial_days_remaining - b.trial_days_remaining);

    return {
      totalBrands,
      inTrial: inTrial.length,
      converted: converted.length,
      conversionRate,
      trialRate,
      conversionsByMonth,
      activeTrials,
    };
  }

  /**
   * Obtener historial de pagos global con filtros y estadísticas
   */
  async getPayments(filters: {
    brand_id?: string;
    status?: string;
    payment_method?: string;
    from?: string;
    to?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    // 1. Consulta para el total de ingresos (independiente de la paginación)
      const reportingTrm = await getReportingTrm();
      const trmCache = new Map<string, number | null>();

      let statsQuery = supabaseAdmin
        .from('subscription_payments')
        .select('amount, currency, notes')
        .eq('status', 'completed');

    if (filters.brand_id) statsQuery = statsQuery.eq('brand_id', filters.brand_id);
    if (filters.status === 'completed') statsQuery = statsQuery.eq('status', 'completed');
    if (filters.payment_method) statsQuery = statsQuery.eq('payment_method', filters.payment_method);
    if (filters.from) statsQuery = statsQuery.gte('payment_date', new Date(filters.from).toISOString());
    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      statsQuery = statsQuery.lte('payment_date', endDate.toISOString());
    }

      const { data: statsRows, error: statsError } = await statsQuery;
      if (statsError) throw new Error('Error al calcular ingresos: ' + statsError.message);

    // 2. Consulta paginada para la tabla (incluyendo plan)
    let query = supabaseAdmin
      .from('subscription_payments')
      .select('*, brands(name, email, slug, plan, social_links)', { count: 'exact' })
      .order('payment_date', { ascending: false });

    if (filters.brand_id) query = query.eq('brand_id', filters.brand_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.payment_method) query = query.eq('payment_method', filters.payment_method);
    if (filters.from) query = query.gte('payment_date', new Date(filters.from).toISOString());
    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('payment_date', endDate.toISOString());
    }

    if (typeof filters.limit === 'number' && filters.limit > 0) {
      const offset = filters.offset || 0;
      query = query.range(offset, offset + filters.limit - 1);
    }

    const { data, error, count } = await query;

    if (error) throw new Error('Error al obtener pagos: ' + error.message);

    const normalizedSearch = filters.search?.trim().toLowerCase();
    const filteredPayments = normalizedSearch
      ? (data || []).filter((payment: any) => {
          const displayBrand = getPaymentDisplayBrand(payment);
          const haystack = [
            displayBrand.name,
            displayBrand.email,
            displayBrand.slug,
            payment.reference,
            payment.transaction_id,
            payment.notes,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

          return haystack.includes(normalizedSearch);
        })
      : (data || []);

      const normalizedPayments = await Promise.all(
        filteredPayments.map(async (payment: any) => {
          const normalized = await normalizePaymentRecordToCop(payment, reportingTrm, trmCache);
          const displayBrand = getPaymentDisplayBrand(payment);
          return {
            ...payment,
            brands: {
              name: displayBrand.name,
              email: displayBrand.email,
              slug: displayBrand.slug,
              plan: displayBrand.plan,
            },
            billing_type: inferBillingType(payment),
            includes_landing: inferIncludesLanding(payment),
            archived: Boolean(payment.brands?.social_links?.account_archived_at),
            amount: normalized.amountCop,
            amount_original: normalized.originalAmount,
            amount_cop: normalized.amountCop,
            exchange_rate_used: normalized.exchangeRateUsed,
            currency: normalized.currency,
            reference_used: normalized.referenceUsed,
          };
        })
      );

      const completedPayments = normalizedPayments.filter((payment: any) => payment.status === 'completed');
      const normalizedStatsRows = await Promise.all(
        (statsRows || []).map((payment: any) => normalizePaymentRecordToCop(payment, reportingTrm, trmCache))
      );
      const totalRevenue = normalizedStatsRows.reduce((sum: number, payment) => sum + payment.amountCop, 0);

      return {
        payments: normalizedPayments,
        count: normalizedSearch ? normalizedPayments.length : (count || 0),
        stats: {
          total_revenue: totalRevenue,
          completed_count: completedPayments.length
      }
    };
  }

  async getAdminMeta(): Promise<PricingMetaData> {
    const { data, error } = await supabaseAdmin
      .from('pricing_config')
      .select('data')
      .eq('id', 'meta')
      .maybeSingle();

    if (error) {
      throw new Error('Error al obtener metadata administrativa: ' + error.message);
    }

    return (data?.data || {}) as PricingMetaData;
  }
}
