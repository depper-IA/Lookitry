import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../config/supabase';

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Falta la variable requerida ${name}`);
  }
  return value;
}

async function main() {
  const email = getRequiredEnv('ADMIN_EMAIL').toLowerCase();
  const password = getRequiredEnv('ADMIN_PASSWORD');
  const name = getRequiredEnv('ADMIN_NAME');
  const permissionsRaw = process.env.ADMIN_PERMISSIONS?.trim() || '';
  const permissions = permissionsRaw
    ? permissionsRaw.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD debe tener al menos 8 caracteres');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const payload = {
    email,
    password: hashedPassword,
    name,
    role: 'admin',
    permissions,
    updated_at: new Date().toISOString(),
  };

  const { data: existingAdmin, error: fetchError } = await supabaseAdmin
    .from('admins')
    .select('id, email')
    .eq('email', email)
    .maybeSingle();

  if (fetchError) {
    throw new Error(`Error consultando admin existente: ${fetchError.message}`);
  }

  if (existingAdmin) {
    const { error: updateError } = await supabaseAdmin
      .from('admins')
      .update(payload)
      .eq('id', existingAdmin.id);

    if (updateError) {
      throw new Error(`Error actualizando admin: ${updateError.message}`);
    }

    console.log(`Admin actualizado correctamente: ${email}`);
    return;
  }

  const { error: insertError } = await supabaseAdmin
    .from('admins')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    throw new Error(`Error creando admin: ${insertError.message}`);
  }

  console.log(`Admin creado correctamente: ${email}`);
}

main().catch((error) => {
  console.error('[create-admin] Error:', error.message);
  process.exit(1);
});
