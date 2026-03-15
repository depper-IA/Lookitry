import { supabase } from '../config/supabase';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script para ejecutar la migración de notification_preferences
 * 
 * Ejecutar con: npx ts-node src/scripts/run-notification-preferences-migration.ts
 */
async function runMigration() {
  console.log('🚀 Iniciando migración de notification_preferences...\n');

  try {
    // Leer el archivo SQL de migración
    const migrationPath = path.join(__dirname, '../../migrations/create-notification-preferences-table.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    // Dividir el SQL en statements individuales (separados por punto y coma)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📄 Ejecutando ${statements.length} statements SQL...\n`);

    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Saltar comentarios y líneas vacías
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }

      console.log(`[${i + 1}/${statements.length}] Ejecutando statement...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        // Algunos errores son esperados (ej: tabla ya existe)
        if (error.message.includes('already exists')) {
          console.log(`⚠️  Statement ${i + 1}: Ya existe (omitiendo)`);
        } else {
          console.error(`❌ Error en statement ${i + 1}:`, error.message);
          throw error;
        }
      } else {
        console.log(`✅ Statement ${i + 1} ejecutado correctamente`);
      }
    }

    console.log('\n✅ Migración completada exitosamente!\n');

    // Verificar que la tabla se creó correctamente
    console.log('🔍 Verificando tabla notification_preferences...\n');

    const { error: tableError } = await supabase
      .from('notification_preferences')
      .select('*')
      .limit(1);

    if (tableError) {
      console.error('❌ Error al verificar tabla:', tableError.message);
    } else {
      console.log('✅ Tabla notification_preferences verificada correctamente');
    }

    // Contar registros
    const { count, error: countError } = await supabase
      .from('notification_preferences')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error al contar registros:', countError.message);
    } else {
      console.log(`📊 Total de preferencias creadas: ${count}`);
    }

    console.log('\n🎉 Migración finalizada!\n');

  } catch (error: any) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration();
