/**
 * Script para crear un administrador en la base de datos
 * 
 * Uso: npm run create-admin
 */

import { supabaseAdmin } from '../config/supabase';
import bcrypt from 'bcryptjs';

async function createAdmin() {
  console.log('🔧 Creando administrador...\n');

  const adminEmail = 'info.samwilkie@gmail.com';
  const adminPassword = 'Travis2305*';
  const adminName = 'Sam Wilkie';

  try {
    // Verificar si el admin ya existe
    const { data: existingAdmin } = await supabaseAdmin
      .from('admins')
      .select('*')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      console.log('✅ El administrador ya existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}`);
      console.log(`   ID: ${existingAdmin.id}`);
      console.log('\n💡 Puedes usar estas credenciales para iniciar sesión:');
      console.log(`   Email: ${adminEmail}`);
      console.log(`   Password: ${adminPassword}`);
      return;
    }

    // Hashear contraseña
    console.log('🔐 Hasheando contraseña...');
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Crear admin
    console.log('📝 Insertando administrador en la base de datos...');
    const { data: newAdmin, error: insertError } = await supabaseAdmin
      .from('admins')
      .insert([
        {
          email: adminEmail,
          password: hashedPassword,
          name: adminName,
          role: 'super_admin',
        },
      ])
      .select()
      .single();

    if (insertError) {
      throw new Error('Error al crear administrador: ' + insertError.message);
    }

    console.log('\n✅ Administrador creado exitosamente:');
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Nombre: ${newAdmin.name}`);
    console.log(`   Rol: ${newAdmin.role}`);
    console.log(`   ID: ${newAdmin.id}`);
    console.log('\n💡 Credenciales de acceso:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n🌐 URL de login:');
    console.log(`   https://pruebalo.wilkiedevs.com/admin/login`);
  } catch (error: any) {
    console.error('\n❌ Error al crear administrador:');
    console.error(error.message);
    
    if (error.message.includes('relation "admins" does not exist')) {
      console.error('\n⚠️  La tabla "admins" no existe en la base de datos.');
      console.error('   Necesitas crear la tabla primero. Ejecuta este SQL en Supabase:');
      console.error('\n   CREATE TABLE admins (');
      console.error('     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),');
      console.error('     email VARCHAR(255) UNIQUE NOT NULL,');
      console.error('     password VARCHAR(255) NOT NULL,');
      console.error('     name VARCHAR(255) NOT NULL,');
      console.error('     role VARCHAR(50) NOT NULL DEFAULT \'admin\',');
      console.error('     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
      console.error('     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
      console.error('   );');
    }
    
    process.exit(1);
  }
}

// Ejecutar el script
createAdmin()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
