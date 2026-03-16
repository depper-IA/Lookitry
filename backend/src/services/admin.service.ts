import { supabase, supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';

export interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
  updated_at: string;
}

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
   * Verificar contraseña de admin
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
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
      .select('id')
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

    const valid = await bcrypt.compare(currentPassword, admin.password);
    if (!valid) throw new Error('La contraseña actual es incorrecta');

    if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password: hashed })
      .eq('id', adminId);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);
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
      const { data: brands, error } = await supabase
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

      const [productsData, generationsData, monthlyData] = await Promise.all([
        // Productos por marca
        supabase
          .from('products')
          .select('brand_id')
          .in('brand_id', brandIds)
          .eq('is_active', true),
        // Generaciones totales por marca
        supabase
          .from('generations')
          .select('brand_id')
          .in('brand_id', brandIds),
        // Generaciones del mes por marca
        supabase
          .from('generations')
          .select('brand_id')
          .in('brand_id', brandIds)
          .gte('generated_at', startOfMonth.toISOString()),
      ]);

      // 4. Contar por marca
      const productCounts: Record<string, number> = {};
      const generationCounts: Record<string, number> = {};
      const monthlyCounts: Record<string, number> = {};

      productsData.data?.forEach(p => {
        productCounts[p.brand_id] = (productCounts[p.brand_id] || 0) + 1;
      });

      generationsData.data?.forEach(g => {
        generationCounts[g.brand_id] = (generationCounts[g.brand_id] || 0) + 1;
      });

      monthlyData.data?.forEach(m => {
        monthlyCounts[m.brand_id] = (monthlyCounts[m.brand_id] || 0) + 1;
      });

      // 5. Combinar datos
      const brandsWithStats = brands.map(brand => {
        const trialEnd = brand.trial_end_date ? new Date(brand.trial_end_date) : null;
        const now = new Date();
        const isInTrial =
          trialEnd !== null &&
          trialEnd > now &&
          brand.subscription_status !== 'active' &&
          brand.subscription_status !== 'expiring_soon';
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
    const { data: current } = await supabase
      .from('brands')
      .select('subscription_start_date, subscription_end_date, subscription_status')
      .eq('id', brandId)
      .single();

    const updatePayload: Record<string, any> = { plan: newPlan };

    // Solo activar si estaba suspendida/expirada o sin estado
    const status = current?.subscription_status;
    if (!status || status === 'suspended' || status === 'expired') {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 30);
      updatePayload.subscription_status = 'active';
      // Solo poner fechas si no existían
      if (!current?.subscription_start_date) updatePayload.subscription_start_date = now.toISOString();
      if (!current?.subscription_end_date) updatePayload.subscription_end_date = endDate.toISOString();
    }

    const { error } = await supabase
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
    const { count: totalBrands } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true });

    // Total de productos
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Total de generaciones
    const { count: totalGenerations } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true });

    // Generaciones exitosas
    const { count: successfulGenerations } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'SUCCESS');

    // Generaciones del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { count: monthlyGenerations } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .gte('generated_at', startOfMonth.toISOString());

    // Marcas por plan
    const { count: basicBrands } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'BASIC');

    const { count: proBrands } = await supabase
      .from('brands')
      .select('*', { count: 'exact', head: true })
      .eq('plan', 'PRO');

    return {
      totalBrands: totalBrands || 0,
      totalProducts: totalProducts || 0,
      totalGenerations: totalGenerations || 0,
      successfulGenerations: successfulGenerations || 0,
      failedGenerations: (totalGenerations || 0) - (successfulGenerations || 0),
      generationsThisMonth: monthlyGenerations || 0,
      successRate: totalGenerations ? ((successfulGenerations || 0) / totalGenerations) * 100 : 0,
      brandsByPlan: {
        BASIC: basicBrands || 0,
        PRO: proBrands || 0,
      },
    };
  }

  /**
   * Obtener productos de una marca específica
   */
  async getBrandProducts(brandId: string) {
    const { data, error } = await supabase
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
    await supabaseAdmin.from('generations').delete().eq('brand_id', brandId);
    await supabaseAdmin.from('subscription_payments').delete().eq('brand_id', brandId);
    await supabaseAdmin.from('notification_preferences').delete().eq('brand_id', brandId);
    await supabaseAdmin.from('products').delete().eq('brand_id', brandId);

    // Eliminar la marca
    const { error: deleteError } = await supabaseAdmin
      .from('brands')
      .delete()
      .eq('id', brandId);

    if (deleteError) {
      throw new Error('Error al eliminar marca: ' + deleteError.message);
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

    const { data: updatedBrand, error } = await supabase
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
      await supabase.from('subscription_payments').insert({
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
    plan?: 'BASIC' | 'PRO';
    trial_days?: number;
    phone?: string;
    contact_name?: string;
  }) {
    // Validar email único
    const { data: existingEmail } = await supabase
      .from('brands')
      .select('id')
      .eq('email', data.email)
      .single();

    if (existingEmail) {
      throw new Error('El email ya está registrado');
    }

    // Validar slug único
    const { data: existingSlug } = await supabase
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

    const { data: newBrand, error } = await supabase
      .from('brands')
      .insert({
        email: data.email,
        password: hashedPassword,
        name: data.name,
        slug: data.slug,
        plan: data.plan || 'BASIC',
        phone: data.phone || null,
        contact_name: data.contact_name || null,
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

    const { data, error } = await supabase
      .from('brands')
      .select('id, name, email, slug, plan, trial_end_date, subscription_status, created_at')
      .gt('trial_end_date', now)
      .not('subscription_status', 'in', '("active","expiring_soon")')
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
    const { data: brands, error } = await supabase
      .from('brands')
      .select('id, plan, subscription_status, trial_end_date, created_at')
      .order('created_at', { ascending: true });

    if (error || !brands) {
      throw new Error('Error al obtener datos de conversión: ' + error?.message);
    }

    const now = new Date();

    // Marcas en trial activo
    const inTrial = brands.filter(b => {
      if (!b.trial_end_date) return false;
      const trialEnd = new Date(b.trial_end_date);
      return trialEnd > now &&
        b.subscription_status !== 'active' &&
        b.subscription_status !== 'expiring_soon';
    });

    // Marcas convertidas (tienen suscripción activa o por vencer)
    const converted = brands.filter(b =>
      b.subscription_status === 'active' || b.subscription_status === 'expiring_soon'
    );

    const totalBrands = brands.length;
    const conversionRate = totalBrands > 0
      ? Math.round((converted.length / totalBrands) * 100)
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

    return {
      totalBrands,
      inTrial: inTrial.length,
      converted: converted.length,
      conversionRate,
      conversionsByMonth,
    };
  }
}
