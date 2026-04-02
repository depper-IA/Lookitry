import { supabaseAdmin } from '../../config/supabase';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

interface Admin {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  permissions?: string[];
  reset_token?: string | null;
  reset_token_expires_at?: string | null;
}

/**
 * Auth Admin Service - Maneja autenticación de administradores
 * Extraído de AdminService para mejorar mantenibilidad
 */
export class AuthAdminService {
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
    
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra mayúscula' };
    }
    
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos una letra minúscula' };
    }
    
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un número' };
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return { isValid: false, message: 'La contraseña debe contener al menos un carácter especial (!@#$%^&*...)' };
    }
    
    return { isValid: true };
  }

  /**
   * Solicitar token de recuperación de contraseña
   */
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

  /**
   * Restablecer contraseña con token
   */
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
}

export const authAdminService = new AuthAdminService();