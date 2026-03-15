import dotenv from 'dotenv';
import { supabase } from '../config/supabase';

dotenv.config();

/**
 * Script para crear la tabla de administradores en Supabase
 * y configurar todo lo necesario
 */
async function setupAdminDatabase() {
  console.log('🔧 Configurando base de datos de administradores...\n');

  try {
    // SQL para crear la tabla de admins
    const createTableSQL = `
      -- Crear tabla admins
      CREATE TABLE IF NOT EXISTS admins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Crear índice para email
      CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

      -- Crear trigger para updated_at
      CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `;

    console.log('📋 Ejecutando SQL para crear tabla admins...');
    
    // Ejecutar el SQL usando la función rpc de Supabase
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (error) {
      console.log('⚠️  No se pudo ejecutar SQL directamente.');
      console.log('   Esto es normal si no tienes una función exec_sql configurada.\n');
      
      console.log('📝 Por favor, ejecuta el siguiente SQL manualmente en Supabase SQL Editor:\n');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(createTableSQL);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      console.log('📍 Pasos:');
      console.log('   1. Ve a https://supabase.com/dashboard');
      console.log('   2. Selecciona tu proyecto');
      console.log('   3. Ve a SQL Editor');
      console.log('   4. Copia y pega el SQL de arriba');
      console.log('   5. Haz clic en "Run"');
      console.log('   6. Ejecuta de nuevo este script\n');
      
      return;
    }

    console.log('✅ Tabla admins creada exitosamente!\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

setupAdminDatabase();
