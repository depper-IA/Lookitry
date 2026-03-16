import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';
import * as readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function updateAdminPassword() {
  console.log('🔐 Actualizar Contraseña de Administrador\n');

  try {
    // Solicitar email
    const email = await question('Email del administrador: ');
    
    if (!email) {
      console.log('❌ Email es requerido');
      rl.close();
      return;
    }

    // Verificar que el admin existe
    const { data: admin, error: findError } = await supabase
      .from('admins')
      .select('id, email, name')
      .eq('email', email)
      .single();

    if (findError || !admin) {
      console.log('❌ Administrador no encontrado');
      rl.close();
      return;
    }

    console.log(`\n✅ Administrador encontrado: ${admin.name} (${admin.email})\n`);

    // Solicitar nueva contraseña
    const newPassword = await question('Nueva contraseña: ');
    
    if (!newPassword) {
      console.log('❌ Contraseña es requerida');
      rl.close();
      return;
    }

    // Confirmar
    const confirm = await question('\n¿Estás seguro de cambiar la contraseña? (si/no): ');
    
    if (confirm.toLowerCase() !== 'si' && confirm.toLowerCase() !== 's') {
      console.log('❌ Operación cancelada');
      rl.close();
      return;
    }

    // Hashear nueva contraseña
    console.log('\n🔄 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar en base de datos
    console.log('💾 Actualizando en base de datos...');
    const { error: updateError } = await supabase
      .from('admins')
      .update({ password: hashedPassword })
      .eq('id', admin.id);

    if (updateError) {
      console.log('❌ Error al actualizar contraseña:', updateError.message);
      rl.close();
      return;
    }

    console.log('\n✅ Contraseña actualizada exitosamente!');
    console.log(`   Admin: ${admin.name}`);
    console.log(`   Email: ${admin.email}\n`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }

  rl.close();
}

updateAdminPassword();
