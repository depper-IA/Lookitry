import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

dotenv.config();

/**
 * Script para crear el administrador WilkieDevs
 * Email: info.samwilkie@gmail.com
 * Nombre: WilkieDevs
 * Contraseña: Travis2305*
 */
async function createWilkieDevsAdmin() {
  console.log('🔐 Creando administrador WilkieDevs...\n');

  try {
    const adminData = {
      email: 'info.samwilkie@gmail.com',
      name: 'WilkieDevs',
      password: 'Travis2305*',
      role: 'admin',
    };

    // Hashear contraseña
    console.log('🔄 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Insertar en base de datos
    console.log('💾 Guardando en base de datos...');
    const { data, error } = await supabase
      .from('admins')
      .insert({
        email: adminData.email,
        password: hashedPassword,
        name: adminData.name,
        role: adminData.role,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        console.log('⚠️  El administrador WilkieDevs ya existe');
        console.log('   Si necesitas actualizar la contraseña, usa el script update-admin-password.ts\n');
      } else {
        console.log('❌ Error al crear administrador:', error.message);
      }
      return;
    }

    console.log('\n✅ Administrador WilkieDevs creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID: ${data.id}`);
    console.log(`   Email: ${data.email}`);
    console.log(`   Nombre: ${data.name}`);
    console.log(`   Rol: ${data.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n📝 Credenciales de acceso:');
    console.log(`   Email: ${adminData.email}`);
    console.log(`   Contraseña: ${adminData.password}`);
    console.log('\n🔒 IMPORTANTE: Guarda estas credenciales en un lugar seguro\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

createWilkieDevsAdmin();
