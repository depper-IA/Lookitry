import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase';

dotenv.config();

async function checkAndSetupAdmin() {
  console.log('🔍 Verificando configuración de administrador...\n');

  try {
    // 1. Verificar si la tabla admins existe
    console.log('1️⃣  Verificando si la tabla admins existe...');
    const { error: tablesError } = await supabase
      .from('admins')
      .select('id')
      .limit(1);

    if (tablesError) {
      if (tablesError.code === 'PGRST205' ||
          tablesError.message.includes('does not exist') || 
          tablesError.message.includes('not found') ||
          tablesError.message.includes('schema cache')) {
        console.log('❌ La tabla admins NO existe\n');
        console.log('📝 Necesitas crear la tabla en Supabase SQL Editor:\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📍 Pasos:');
        console.log('   1. Ve a https://supabase.com/dashboard');
        console.log('   2. Selecciona tu proyecto');
        console.log('   3. Ve a "SQL Editor"');
        console.log('   4. Copia y pega el SQL de arriba');
        console.log('   5. Haz clic en "Run"');
        console.log('   6. Ejecuta de nuevo este script\n');
        return;
      }
      throw tablesError;
    }

    console.log('✅ La tabla admins existe\n');

    // 2. Verificar si el admin WilkieDevs existe
    console.log('2️⃣  Verificando si el admin WilkieDevs existe...');
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id, email, name')
      .eq('email', 'info.samwilkie@gmail.com')
      .single();

    if (existingAdmin) {
      console.log('✅ El admin WilkieDevs ya existe');
      console.log(`   ID: ${existingAdmin.id}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}\n`);
      console.log('✅ Todo está configurado correctamente!\n');
      return;
    }

    console.log('⚠️  El admin WilkieDevs NO existe\n');

    // 3. Crear el admin WilkieDevs
    console.log('3️⃣  Creando admin WilkieDevs...');
    const password = 'Travis2305*';
    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newAdmin, error: createError } = await supabase
      .from('admins')
      .insert({
        email: 'info.samwilkie@gmail.com',
        password: hashedPassword,
        name: 'WilkieDevs',
        role: 'admin',
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    console.log('✅ Admin WilkieDevs creado exitosamente!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Nombre: ${newAdmin.name}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🔐 Credenciales de acceso:');
    console.log(`   Email: info.samwilkie@gmail.com`);
    console.log(`   Contraseña: Travis2305*\n`);
    console.log('✅ Todo está configurado correctamente!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error('   Detalles:', error);
  }
}

checkAndSetupAdmin();
