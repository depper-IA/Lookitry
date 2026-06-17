import { supabaseAdmin } from '../../config/supabase';
import { redis } from '../../config/redis';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

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

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const LOCKOUT_KEY_PREFIX = 'admin:lockout:';
const FAILED_KEY_PREFIX = 'admin:failed:';

/**
 * Auth Admin Service — Autenticación y gestión de administradores.
 * Extraído de AdminService para mejorar mantenibilidad.
 */
export class AuthAdminService {
  // ———————————————————— Helpers privados —

  private isValidBcryptHash(value: string | null | undefined): boolean {
    if (!value) return false;
    return /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value);
  }

  private validatePasswordComplexity(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) return { isValid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    if (!/[A-Z]/.test(password)) return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    if (!/[a-z]/.test(password)) return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    if (!/[0-9]/.test(password)) return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
    }
    return { isValid: true };
  }

  private async recordFailedAttemptDB(adminId: string): Promise<void> {
    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('failed_login_attempts')
      .eq('id', adminId)
      .single();

    const currentAttempts = admin?.failed_login_attempts || 0;
    const newAttempts = currentAttempts + 1;

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
      await supabaseAdmin
        .from('admins')
        .update({
          failed_login_attempts: 0,
          locked_until: lockedUntil.toISOString(),
        })
        .eq('id', adminId);
    } else {
      await supabaseAdmin
        .from('admins')
        .update({ failed_login_attempts: newAttempts })
        .eq('id', adminId);
    }
  }

  // ———————————————————— Account Lockout —

  async isLockedOut(adminId: string): Promise<{ locked: boolean; reason?: string }> {
    const redisKey = `${LOCKOUT_KEY_PREFIX}${adminId}`;

    try {
      const ttl = await redis.ttl(redisKey);
      if (ttl > 0) {
        const minutesLeft = Math.ceil(ttl / 60);
        return {
          locked: true,
          reason: `Cuenta bloqueada por exceso de intentos fallidos. Intenta de nuevo en ${minutesLeft} minuto(s).`,
        };
      }
    } catch {
      // Fallback a DB
    }

    const { data: admin } = await supabaseAdmin
      .from('admins')
      .select('locked_until')
      .eq('id', adminId)
      .single();

    if (admin?.locked_until) {
      const lockedUntil = new Date(admin.locked_until);
      if (lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
        return {
          locked: true,
          reason: `Cuenta bloqueada por exceso de intentos fallidos. Intenta de nuevo en ${minutesLeft} minuto(s).`,
        };
      }
    }

    return { locked: false };
  }

  async recordFailedAttempt(adminId: string, ip: string): Promise<void> {
    const redisKey = `${FAILED_KEY_PREFIX}${adminId}`;

    try {
      const attempts = await redis.incr(redisKey);
      await redis.expire(redisKey, LOCKOUT_DURATION_MINUTES * 60);

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await redis.setex(`${LOCKOUT_KEY_PREFIX}${adminId}`, LOCKOUT_DURATION_MINUTES * 60, '1');
        await redis.del(redisKey);
        console.warn(`[AuthAdmin] Admin ${adminId} bloqueado por ${LOCKOUT_DURATION_MINUTES} minutos (IP: ${ip})`);
      }
    } catch {
      await this.recordFailedAttemptDB(adminId);
    }
  }

  async resetFailedAttempts(adminId: string): Promise<void> {
    const redisKey = `${FAILED_KEY_PREFIX}${adminId}`;

    try {
      await redis.del(redisKey);
      await redis.del(`${LOCKOUT_KEY_PREFIX}${adminId}`);
    } catch {
      // Ignorar
    }

    await supabaseAdmin
      .from('admins')
      .update({
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', adminId);
  }

  // ———————————————————— Lookup —

  async getAdminByEmail(email: string): Promise<Admin | null> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*')
      .ilike('email', email.trim())
      .single();
    if (error || !data) return null;
    return data as Admin;
  }

  async getAdminById(adminId: string): Promise<Admin | null> {
    const { data, error } = await supabaseAdmin.from('admins').select('*').eq('id', adminId).single();
    if (error || !data) return null;
    return data as Admin;
  }

  async getAdminByGoogleId(googleId: string): Promise<Admin | null> {
    const { data, error } = await supabaseAdmin.from('admins').select('*').eq('google_id', googleId).single();
    if (error || !data) return null;
    return data as Admin;
  }

  async updateAdminGoogleId(adminId: string, googleId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('admins')
      .update({ google_id: googleId, updated_at: new Date().toISOString() })
      .eq('id', adminId);

    if (error) throw new Error('Error al vincular ID de Google: ' + error.message);
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // ———————————————————— CRUD de Admins —

  async listAdmins(): Promise<Omit<Admin, 'password'>[]> {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('id, email, name, role, permissions, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) throw new Error('Error al obtener admins: ' + error.message);
    return (data || []) as any;
  }

  async createAdmin(data: {
    email: string;
    password: string;
    name: string;
    permissions?: string[];
  }): Promise<Omit<Admin, 'password'>> {
    const { data: existing } = await supabaseAdmin.from('admins').select('id').eq('email', data.email).single();
    if (existing) throw new Error('El email ya está registrado como admin');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const { data: newAdmin, error } = await supabaseAdmin
      .from('admins')
      .insert({ email: data.email, password: hashedPassword, name: data.name, role: 'admin', permissions: data.permissions || [] })
      .select('id, email, name, role, permissions, created_at, updated_at')
      .single();

    if (error || !newAdmin) throw new Error('Error al crear admin: ' + error?.message);
    return newAdmin as any;
  }

  async updateAdminPermissions(adminId: string, permissions: string[]): Promise<void> {
    const { error } = await supabaseAdmin.from('admins').update({ permissions }).eq('id', adminId);
    if (error) throw new Error('Error al actualizar permisos: ' + error.message);
  }

  async deleteAdmin(adminId: string, requestingAdminId: string): Promise<void> {
    if (adminId === requestingAdminId) throw new Error('No puedes eliminarte a ti mismo');
    const { error } = await supabaseAdmin.from('admins').delete().eq('id', adminId);
    if (error) throw new Error('Error al eliminar admin: ' + error.message);
  }

  // ———————————————————— Gestión de Contraseñas —

  async changeAdminPassword(adminId: string, newPassword: string): Promise<void> {
    if (newPassword.length < 8) throw new Error('La nueva contraseña debe tener al menos 8 caracteres');

    const { data: admin, error } = await supabaseAdmin.from('admins').select('id').eq('id', adminId).single();
    if (error || !admin) throw new Error('Admin no encontrado');

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password: hashed, reset_token: null, reset_token_expires_at: null, updated_at: new Date().toISOString() })
      .eq('id', adminId);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);
  }

  async resetAdminPassword(adminId: string): Promise<{ admin: Omit<Admin, 'password'>; newPassword: string }> {
    const { data: admin, error: fetchError } = await supabaseAdmin
      .from('admins')
      .select('id, email, name, role, permissions, created_at, updated_at')
      .eq('id', adminId)
      .single();

    if (fetchError || !admin) throw new Error('Admin no encontrado');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let newPassword = '';
    for (let i = 0; i < 12; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin.from('admins').update({ password: hashedPassword }).eq('id', adminId);
    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);

    return { admin: admin as any, newPassword };
  }

  async changeOwnPassword(adminId: string, currentPassword: string, newPassword: string): Promise<void> {
    const { data: admin, error } = await supabaseAdmin.from('admins').select('id, password').eq('id', adminId).single();
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
      .update({ password: hashed, reset_token: null, reset_token_expires_at: null, updated_at: new Date().toISOString() })
      .eq('id', adminId);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);
  }

  async requestPasswordResetGetToken(email: string): Promise<{ admin: { name: string; email: string } | null; token: string | null }> {
    const { data: admin } = await supabaseAdmin.from('admins').select('id, name, email').eq('email', email).single();
    if (!admin) return { admin: null, token: null };

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const { error } = await supabaseAdmin
      .from('admins')
      .update({ reset_token: token, reset_token_expires_at: expiresAt.toISOString(), updated_at: new Date().toISOString() })
      .eq('id', admin.id);

    if (error) throw new Error('Error al generar token de recuperación: ' + error.message);
    return { admin: { name: admin.name, email: admin.email }, token };
  }

  async resetPasswordWithToken(token: string, newPassword: string): Promise<void> {
    const { data: admin, error } = await supabaseAdmin.from('admins').select('id, reset_token_expires_at').eq('reset_token', token).single();
    if (error || !admin) throw new Error('TOKEN_INVALID');

    const expiresAt = admin.reset_token_expires_at ? new Date(admin.reset_token_expires_at) : null;
    if (!expiresAt || expiresAt < new Date()) throw new Error('TOKEN_EXPIRED');

    const complexityCheck = this.validatePasswordComplexity(newPassword);
    if (!complexityCheck.isValid) throw new Error('PASSWORD_TOO_SHORT');

    const hashed = await bcrypt.hash(newPassword, 10);
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update({ password: hashed, reset_token: null, reset_token_expires_at: null, updated_at: new Date().toISOString() })
      .eq('id', admin.id);

    if (updateError) throw new Error('Error al actualizar contraseña: ' + updateError.message);
  }
}

export const authAdminService = new AuthAdminService();