import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getReportingTrm, normalizePaymentRecordToCop } from '../utils/paymentNormalization';
import {
  getPaymentDisplayBrand,
  inferBillingType,
  inferIncludesLanding,
  inferPlanPurchased,
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

  private validatePasswordComplexity(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    
    // Al menos una mayúscula
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    
    // Al menos una minúscula
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    
    // Al menos un número
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    }
    
    // Al menos un carácter especial
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
    }
    
    return { isValid: true };
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

    const complexityCheck = this.validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) throw new Error(complexityCheck.message);
    
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

    const complexityCheck = this.validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) {
      throw new Error('PASSWORD_TOO_SHORT'); // Mantenemos el mismo error para no romper el frontend
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
        if (brand.plan === 'TRIAL') {
          acc.TRIAL += 1;
        } else if (brand.plan === 'PRO') {
          acc.PRO += 1;
        } else if (brand.plan === 'ENTERPRISE') {
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
        trial_end_date: null,
        trial_payment_status: null,
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
      .eq('plan', 'TRIAL')
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
      .select('id, name, email, slug, plan, subscription_status, trial_end_date, trial_payment_status, created_at, social_links')
      .order('created_at', { ascending: true });

    if (error || !brands) {
      throw new Error('Error al obtener datos de conversión: ' + error?.message);
    }

    const { data: completedPayments, error: paymentsError } = await supabaseAdmin
      .from('subscription_payments')
      .select('amount, currency, notes, status') // Note: reference removed to avoid missing column error if not yet migrated
      .eq('status', 'completed');

    if (paymentsError) {
      throw new Error('Error al obtener pagos: ' + paymentsError.message);
    }

    const now = new Date();

    const inTrial = brands.filter(b =>
      b.plan === 'TRIAL' &&
      !!b.trial_end_date &&
      new Date(b.trial_end_date) > now &&
      b.subscription_status !== 'suspended'
    );

    const paidTrialPayments = completedPayments || [];
    const reportingTrm = await getReportingTrm();
    const trmCache = new Map<string, number | null>();

    const trialActivationPayments = paidTrialPayments.filter((payment) => {
      const planPurchased = inferPlanPurchased(payment);
      const billingType = inferBillingType(payment);
      return planPurchased === 'TRIAL' || billingType === 'trial_activation';
    });

    let trialRevenueCOP = 0;
    for (const payment of trialActivationPayments) {
      const normalized = await normalizePaymentRecordToCop(payment, reportingTrm, trmCache);
      trialRevenueCOP += (normalized?.amountCop || 0);
    }

    // Marcas convertidas: solo planes pagos reales, excluyendo TRIAL.
    const converted = brands.filter(b =>
      b.plan !== 'TRIAL' &&
      (b.subscription_status === 'active' || b.subscription_status === 'expiring_soon')
    );

    const trialConversionEvents = brands.flatMap((brand) => {
      // SAFE CHECK: Ensure social_links exists
      if (!brand?.social_links) return [];
      const socialLinks: any = brand.social_links;
      
      const events = Array.isArray(socialLinks?.trial_events) ? socialLinks.trial_events : [];

      return events
        .filter((event: any) => event && typeof event === 'object' && event.type === 'trial_converted')
        .map((event: any) => ({
          brandId: brand.id,
          created_at: event.created_at || brand.created_at, // Fallback if internal event lacks date
          planPurchased: String(event?.payload?.planPurchased || '').toUpperCase(),
        }));
    });

    const trialToBasic = trialConversionEvents.filter((event) => event.planPurchased === 'BASIC').length;
    const trialToPro = trialConversionEvents.filter((event) => event.planPurchased === 'PRO').length;
    const trialToEnterprise = trialConversionEvents.filter((event) => event.planPurchased === 'ENTERPRISE').length;
    const trialToPaid = trialToBasic + trialToPro + trialToEnterprise;

    const totalBrands = brands.length;
    const conversionRate = totalBrands > 0
      ? Math.round((converted.length / totalBrands) * 100)
      : 0;
    const trialRate = totalBrands > 0
      ? Math.round((inTrial.length / totalBrands) * 100)
      : 0;

    // Conversiones desde trial por mes (ultimos 6 meses)
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

    trialConversionEvents.forEach((event) => {
      const eventDate = new Date(event.created_at);
      if (eventDate >= sixMonthsAgo) {
        const key = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, '0')}`;
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
      paidTrials: trialActivationPayments.length,
      trialRevenueCOP: Math.round(trialRevenueCOP),
      trialToBasic,
      trialToPro,
      trialToEnterprise,
      trialToPaid,
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
          // SAFE CHECK: Ensure brand data exists even if fetch returned null (e.g. orphan payment)
          if (!payment.brands) {
             payment.brands = { name: 'Marca Desconocida', email: 'N/A', slug: 'unknown', plan: 'N/A' };
          }

          const normalized = await normalizePaymentRecordToCop(payment, reportingTrm, trmCache);
          const displayBrand = getPaymentDisplayBrand(payment);
          return {
            ...payment,
            brands: {
              name: displayBrand?.name || 'N/A',
              email: displayBrand?.email || 'N/A',
              slug: displayBrand?.slug || 'unknown',
              plan: displayBrand?.plan || 'N/A',
            },
            billing_type: inferBillingType(payment),
            includes_landing: inferIncludesLanding(payment),
            archived: Boolean(payment.brands?.social_links?.account_archived_at),
            amount: normalized?.amountCop || 0,
            amount_original: normalized?.originalAmount || 0,
            amount_cop: normalized?.amountCop || 0,
            exchange_rate_used: normalized?.exchangeRateUsed || 0,
            currency: normalized?.currency || 'COP',
            reference_used: normalized?.referenceUsed || false,
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

  async getMissionControl() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [brandsRes, paymentsRes, feedbackRes, generationsRes] = await Promise.all([
      supabaseAdmin.from('brands').select('id, name, email, plan, subscription_status, trial_end_date, subscription_end_date, has_landing_page, landing_suspended_at, created_at'),
      supabaseAdmin.from('subscription_payments').select('id, brand_id, amount, status, payment_date, payment_method, brands(name, email, plan)').eq('status', 'failed').order('payment_date', { ascending: false }).limit(20),
      supabaseAdmin.from('generation_feedback').select('id, brand_id, error_type, created_at, resolved').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('generations').select('id, brand_id, status, generated_at, error_message').eq('status', 'FAILED').gte('generated_at', startOfMonth.toISOString()).order('generated_at', { ascending: false }).limit(50),
    ]);

    const brands = brandsRes.data || [];
    const failedPayments = paymentsRes.data || [];
    const unresolvedFeedback = feedbackRes.data || [];
    const failedGenerations = generationsRes.data || [];

    const trialsExpiringSoon = brands.filter(b => {
      if (b.plan !== 'TRIAL' || !b.trial_end_date) return false;
      const trialEnd = new Date(b.trial_end_date);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 3;
    }).map(b => {
      const trialEnd = new Date(b.trial_end_date!);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { id: b.id, name: b.name, email: b.email, days_left: daysLeft, trial_end_date: b.trial_end_date };
    });

    const trialsStalled = brands.filter(b => {
      if (b.plan !== 'TRIAL' || !b.trial_end_date) return false;
      const trialEnd = new Date(b.trial_end_date);
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft > 3;
    });

    const suspendedLandings = brands.filter(b => b.landing_suspended_at).map(b => ({
      id: b.id, name: b.name, email: b.email, suspended_at: b.landing_suspended_at,
    }));

    const expiringSubscriptions = brands.filter(b => {
      if (!b.subscription_end_date) return false;
      if (b.subscription_status !== 'active' && b.subscription_status !== 'expiring_soon') return false;
      const subEnd = new Date(b.subscription_end_date);
      const daysLeft = Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysLeft >= 0 && daysLeft <= 7;
    }).map(b => {
      const subEnd = new Date(b.subscription_end_date!);
      const daysLeft = Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { id: b.id, name: b.name, email: b.email, plan: b.plan, days_left: daysLeft, subscription_end_date: b.subscription_end_date };
    });

    const brandsWithFailedPayments = new Set(failedPayments.map(p => p.brand_id));

    const criticalAlerts: Array<{ type: string; message: string; severity: 'critical' | 'warning'; count?: number }> = [];

    if (failedPayments.length > 0) {
      criticalAlerts.push({ type: 'failed_payments', message: `${failedPayments.length} pagos fallidos recientes`, severity: 'critical', count: failedPayments.length });
    }
    if (trialsExpiringSoon.length > 0) {
      criticalAlerts.push({ type: 'trials_expiring', message: `${trialsExpiringSoon.length} trials expiran en 3 días o menos`, severity: 'warning', count: trialsExpiringSoon.length });
    }
    if (unresolvedFeedback.length > 5) {
      criticalAlerts.push({ type: 'feedback_backlog', message: `${unresolvedFeedback.length} feedbacks sin resolver`, severity: 'warning', count: unresolvedFeedback.length });
    }
    if (expiringSubscriptions.length > 0) {
      criticalAlerts.push({ type: 'subscriptions_expiring', message: `${expiringSubscriptions.length} suscripciones expiran en 7 días`, severity: 'warning', count: expiringSubscriptions.length });
    }

    const operationalQueue: Array<{ type: string; label: string; brand_id?: string; priority: 'high' | 'medium' | 'low' }> = [];

    for (const trial of trialsExpiringSoon) {
      operationalQueue.push({ type: 'trial_expiring', label: `Trial de ${trial.name} expira en ${trial.days_left}d`, brand_id: trial.id, priority: 'high' });
    }
    for (const sub of expiringSubscriptions) {
      operationalQueue.push({ type: 'subscription_expiring', label: `Suscripción de ${sub.name} (${sub.plan}) expira en ${sub.days_left}d`, brand_id: sub.id, priority: 'high' });
    }
    for (const brandId of brandsWithFailedPayments) {
      const brand = brands.find(b => b.id === brandId);
      if (brand) {
        operationalQueue.push({ type: 'failed_payment', label: `Pago fallido de ${brand.name}`, brand_id: brandId, priority: 'high' });
      }
    }

    return {
      alerts: criticalAlerts,
      operational_queue: operationalQueue,
      trials_expiring_soon: trialsExpiringSoon,
      trials_stalled: trialsStalled.map(b => ({ id: b.id, name: b.name, email: b.email, trial_end_date: b.trial_end_date })),
      subscriptions_expiring: expiringSubscriptions,
      failed_payments_recent: failedPayments.slice(0, 10),
      unresolved_feedback_count: unresolvedFeedback.length,
      failed_generations_recent: failedGenerations.slice(0, 10),
      suspended_landings: suspendedLandings,
      summary: {
        total_brands: brands.length,
        total_trials: brands.filter(b => b.plan === 'TRIAL').length,
        total_active_subscriptions: brands.filter(b => b.subscription_status === 'active' || b.subscription_status === 'expiring_soon').length,
        critical_alerts_count: criticalAlerts.filter(a => a.severity === 'critical').length,
        queue_items_count: operationalQueue.length,
      },
    };
  }

  async getRiskData() {
    const now = new Date();

    const { data: brands, error } = await supabaseAdmin
      .from('brands')
      .select('id, name, email, plan, subscription_status, trial_end_date, subscription_end_date, created_at, has_landing_page');

    if (error || !brands) {
      throw new Error('Error al obtener datos de riesgo: ' + error?.message);
    }

    const { data: generations, error: genError } = await supabaseAdmin
      .from('generations')
      .select('brand_id, status, generated_at')
      .gte('generated_at', new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (genError) {
      console.error('Error getting generations for risk:', genError);
    }

    const genByBrand = new Map<string, { total: number; failed: number; last_at: string | null }>();
    for (const g of generations || []) {
      const existing = genByBrand.get(g.brand_id) || { total: 0, failed: 0, last_at: null };
      existing.total += 1;
      if (g.status === 'FAILED') existing.failed += 1;
      if (!existing.last_at || g.generated_at > existing.last_at) existing.last_at = g.generated_at;
      genByBrand.set(g.brand_id, existing);
    }

    const { data: failedPayments, error: payError } = await supabaseAdmin
      .from('subscription_payments')
      .select('brand_id, payment_date, amount')
      .eq('status', 'failed')
      .gte('payment_date', new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString());

    if (payError) {
      console.error('Error getting failed payments for risk:', payError);
    }

    const failedPayByBrand = new Map<string, number>();
    for (const p of failedPayments || []) {
      failedPayByBrand.set(p.brand_id, (failedPayByBrand.get(p.brand_id) || 0) + 1);
    }

    const riskBrands: Array<{
      id: string; name: string; email: string; plan: string;
      risk_score: number; risk_factors: string[];
      subscription_status: string | null; trial_end_date: string | null;
      generations_30d: number; failed_generations_30d: number;
      failed_payments_60d: number; last_generation: string | null;
    }> = [];

    for (const brand of brands) {
      const riskFactors: string[] = [];
      let riskScore = 0;

      const genStats = genByBrand.get(brand.id) || { total: 0, failed: 0, last_at: null };
      const failedPayCount = failedPayByBrand.get(brand.id) || 0;

      if (brand.plan === 'TRIAL' && brand.trial_end_date) {
        const trialEnd = new Date(brand.trial_end_date);
        const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft <= 3 && daysLeft >= 0) {
          riskFactors.push(`Trial expira en ${daysLeft} días`);
          riskScore += 30;
        } else if (daysLeft < 0) {
          riskFactors.push('Trial vencido sin conversión');
          riskScore += 50;
        }
      }

      if (brand.plan !== 'TRIAL' && genStats.total === 0) {
        riskFactors.push('Sin generaciones registradas');
        riskScore += 25;
      }

      if (genStats.total > 0 && genStats.total <= 2) {
        riskFactors.push('Uso muy bajo (1-2 generaciones en 30 días)');
        riskScore += 20;
      }

      if (genStats.total > 0 && genStats.failed / genStats.total > 0.5) {
        riskFactors.push(`Alta tasa de error (${Math.round((genStats.failed / genStats.total) * 100)}%)`);
        riskScore += 25;
      }

      if (failedPayCount >= 2) {
        riskFactors.push(`${failedPayCount} pagos fallidos en 60 días`);
        riskScore += 30;
      }

      if (brand.subscription_status === 'suspended') {
        riskFactors.push('Suscripción suspendida');
        riskScore += 40;
      }

      if (brand.has_landing_page === false && brand.plan !== 'TRIAL') {
        riskFactors.push('Sin mini-landing activada');
        riskScore += 10;
      }

      if (genStats.last_at) {
        const lastGen = new Date(genStats.last_at);
        const daysSinceLastGen = Math.floor((now.getTime() - lastGen.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastGen > 14 && (brand.plan === 'PRO' || brand.plan === 'BASIC')) {
          riskFactors.push(`Sin uso hace ${daysSinceLastGen} días`);
          riskScore += 20;
        }
      }

      if (riskScore > 0) {
        riskBrands.push({
          id: brand.id,
          name: brand.name,
          email: brand.email,
          plan: brand.plan,
          risk_score: Math.min(riskScore, 100),
          risk_factors: riskFactors,
          subscription_status: brand.subscription_status,
          trial_end_date: brand.trial_end_date,
          generations_30d: genStats.total,
          failed_generations_30d: genStats.failed,
          failed_payments_60d: failedPayCount,
          last_generation: genStats.last_at,
        });
      }
    }

    riskBrands.sort((a, b) => b.risk_score - a.risk_score);

    return {
      risk_brands: riskBrands,
      summary: {
        total_at_risk: riskBrands.length,
        high_risk: riskBrands.filter(b => b.risk_score >= 50).length,
        medium_risk: riskBrands.filter(b => b.risk_score >= 25 && b.risk_score < 50).length,
        low_risk: riskBrands.filter(b => b.risk_score < 25).length,
      },
    };
  }

  async getEconomics() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: brands, error: brandsError } = await supabaseAdmin
      .from('brands')
      .select('id, name, plan, subscription_status, created_at');

    if (brandsError || !brands) {
      throw new Error('Error al obtener datos de economía: ' + brandsError?.message);
    }

    const { data: payments, error: payError } = await supabaseAdmin
      .from('subscription_payments')
      .select('brand_id, amount, currency, status, payment_date, payment_method, notes');

    if (payError) {
      console.error('Error getting payments for economics:', payError);
    }

    const completedPayments = (payments || []).filter(p => p.status === 'completed');

    const revenueByPlan: Record<string, { total: number; count: number }> = { BASIC: { total: 0, count: 0 }, PRO: { total: 0, count: 0 }, TRIAL: { total: 0, count: 0 }, ENTERPRISE: { total: 0, count: 0 } };
    for (const payment of completedPayments) {
      const brand = brands.find(b => b.id === payment.brand_id);
      const plan = brand?.plan || 'BASIC';
      const amount = Number(payment.amount) || 0;
      if (!revenueByPlan[plan]) revenueByPlan[plan] = { total: 0, count: 0 };
      revenueByPlan[plan].total += amount;
      revenueByPlan[plan].count += 1;
    }

    const { data: generations, error: genError } = await supabaseAdmin
      .from('generations')
      .select('brand_id, status, generated_at')
      .gte('generated_at', startOfMonth.toISOString());

    if (genError) {
      console.error('Error getting generations for economics:', genError);
    }

    const genByPlan: Record<string, number> = { BASIC: 0, PRO: 0, TRIAL: 0, ENTERPRISE: 0 };
    for (const g of generations || []) {
      const brand = brands.find(b => b.id === g.brand_id);
      const plan = brand?.plan || 'BASIC';
      if (g.status === 'SUCCESS') {
        genByPlan[plan] = (genByPlan[plan] || 0) + 1;
      }
    }

    const COST_PER_GEN_OPENROUTER = 0.039;
    const COST_PER_GEN_REPLICATE = 0.05;
    const estimatedCostPerGen = (COST_PER_GEN_OPENROUTER + COST_PER_GEN_REPLICATE) / 2;

    const economicsByPlan = Object.entries(revenueByPlan).map(([plan, rev]) => {
      const genCount = genByPlan[plan] || 0;
      const estimatedCost = genCount * estimatedCostPerGen;
      const margin = rev.total - estimatedCost;
      const marginPct = rev.total > 0 ? (margin / rev.total) * 100 : 0;
      return {
        plan,
        revenue: rev.total,
        payment_count: rev.count,
        generations_this_month: genCount,
        estimated_ia_cost: estimatedCost,
        margin,
        margin_percent: Math.round(marginPct * 10) / 10,
        avg_revenue_per_brand: rev.count > 0 ? rev.total / rev.count : 0,
      };
    });

    const totalRevenue = economicsByPlan.reduce((sum, e) => sum + e.revenue, 0);
    const totalCost = economicsByPlan.reduce((sum, e) => sum + e.estimated_ia_cost, 0);
    const totalMargin = totalRevenue - totalCost;
    const totalMarginPct = totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0;

    const cohortData: Array<{ month: string; brands: number; revenue: number }> = [];
    const brandByCohort = new Map<string, { brands: Set<string>; revenue: number }>();
    for (const brand of brands) {
      const cohortMonth = brand.created_at ? new Date(brand.created_at).toISOString().slice(0, 7) : 'unknown';
      if (!brandByCohort.has(cohortMonth)) {
        brandByCohort.set(cohortMonth, { brands: new Set(), revenue: 0 });
      }
      brandByCohort.get(cohortMonth)!.brands.add(brand.id);
    }
    for (const payment of completedPayments) {
      const brand = brands.find(b => b.id === payment.brand_id);
      if (brand?.created_at) {
        const cohortMonth = new Date(brand.created_at).toISOString().slice(0, 7);
        if (brandByCohort.has(cohortMonth)) {
          brandByCohort.get(cohortMonth)!.revenue += Number(payment.amount) || 0;
        }
      }
    }
    for (const [month, data] of brandByCohort.entries()) {
      cohortData.push({ month, brands: data.brands.size, revenue: data.revenue });
    }
    cohortData.sort((a, b) => a.month.localeCompare(b.month));

    return {
      by_plan: economicsByPlan,
      summary: {
        total_revenue: totalRevenue,
        total_estimated_ia_cost: totalCost,
        total_margin: totalMargin,
        total_margin_percent: Math.round(totalMarginPct * 10) / 10,
        total_generations_this_month: Object.values(genByPlan).reduce((s, v) => s + v, 0),
      },
      cohorts: cohortData.slice(-12),
    };
  }

  async getAuditLog(filters: {
    limit?: number;
    offset?: number;
    action?: string;
    admin_email?: string;
    from?: string;
    to?: string;
  }) {
    let query = supabaseAdmin
      .from('admin_audit_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (filters.action) {
      query = query.eq('action', filters.action);
    }
    if (filters.admin_email) {
      query = query.ilike('admin_email', `%${filters.admin_email}%`);
    }
    if (filters.from) {
      query = query.gte('created_at', new Date(filters.from).toISOString());
    }
    if (filters.to) {
      const endDate = new Date(filters.to);
      endDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDate.toISOString());
    }

    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      if (error.code === 'PGRST200' || error.message.includes('admin_audit_log')) {
        return { entries: [], count: 0, message: 'Tabla de auditoría no disponible aún' };
      }
      throw new Error('Error al obtener audit log: ' + error.message);
    }

    return {
      entries: data || [],
      count: count || 0,
    };
  }

  async getBrandFull(brandId: string) {
    const { data: brand, error } = await supabaseAdmin
      .from('brands')
      .select('*')
      .eq('id', brandId)
      .single();

    if (error || !brand) {
      throw new Error('Marca no encontrada');
    }

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
    if (isInTrial && trialDaysRemaining !== null && trialDaysRemaining <= 3) {
      riskFactors.push(`Trial expira en ${trialDaysRemaining} días`);
      riskScore += 30;
    }
    if (totalGenerations === 0) {
      riskFactors.push('Sin uso en 30 días');
      riskScore += 25;
    }
    if (totalGenerations > 0 && failedGenerations / totalGenerations > 0.5) {
      riskFactors.push('Alta tasa de error en generaciones');
      riskScore += 25;
    }
    if (brand.subscription_status === 'suspended') {
      riskFactors.push('Suscripción suspendida');
      riskScore += 40;
    }

    return {
      brand: {
        id: brand.id,
        name: brand.name,
        email: brand.email,
        slug: brand.slug,
        plan: brand.plan,
        subscription_status: brand.subscription_status,
        trial_end_date: brand.trial_end_date,
        subscription_end_date: brand.subscription_end_date,
        created_at: brand.created_at,
        has_landing_page: brand.has_landing_page,
        landing_suspended_at: brand.landing_suspended_at,
        phone: brand.phone,
        contact_name: brand.contact_name,
        is_in_trial: isInTrial,
        trial_days_remaining: trialDaysRemaining,
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
        payments: payments,
        payment_count: payments.length,
        failed_payments: payments.filter(p => p.status === 'failed').length,
      },
      support: {
        feedback_count: feedback.length,
        unresolved_feedback: feedback.filter(f => !f.resolved).length,
        feedback,
      },
      risk: {
        score: Math.min(riskScore, 100),
        factors: riskFactors,
      },
      products,
      recent_generations: generations,
    };
  }
}
