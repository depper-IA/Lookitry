/**
 * Script para ejecutar la migración de campos de suscripción
 * 
 * Este script lee el archivo SQL de migración y lo ejecuta en Supabase
 * 
 * Uso:
 *   npm run migration:subscription
 *   o
 *   npx ts-node src/scripts/run-subscription-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY son requeridos en .env');
  process.exit(1);
}

// Crear cliente de Supabase con service key (permisos de admin)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Iniciando migración de campos de suscripción...\n');

  try {
    // Leer archivo SQL
    const sqlFilePath = path.join(__dirname, 'add-subscription-fields.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

    console.log('📄 Archivo SQL cargado:', sqlFilePath);
    console.log('📏 Tamaño:', sqlContent.length, 'caracteres\n');

    // Nota: Supabase no permite ejecutar SQL directamente desde el cliente
    // Este script es principalmente para documentación y verificación
    console.log('⚠️  IMPORTANTE:');
    console.log('   Supabase no permite ejecutar SQL arbitrario desde el cliente por seguridad.');
    console.log('   Debes ejecutar la migración manualmente en Supabase SQL Editor.\n');

    console.log('📋 Pasos para ejecutar la migración:');
    console.log('   1. Accede a: https://vkdooutklowctuudjnkl.supabase.co');
    console.log('   2. Ve a "SQL Editor"');
    console.log('   3. Crea una nueva query');
    console.log('   4. Copia el contenido de: backend/src/scripts/add-subscription-fields.sql');
    console.log('   5. Ejecuta la query');
    console.log('   6. Verifica los resultados\n');

    // Verificar si las columnas ya existen
    console.log('🔍 Verificando estado actual de la base de datos...\n');

    const { data: brands, error } = await supabase
      .from('brands')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar tabla brands:', error.message);
      return;
    }

    if (brands && brands.length > 0) {
      const brand = brands[0];
      const hasSubscriptionFields = 
        'subscription_start_date' in brand &&
        'subscription_end_date' in brand &&
        'subscription_status' in brand &&
        'last_payment_date' in brand &&
        'next_payment_date' in brand;

      if (hasSubscriptionFields) {
        console.log('✅ Los campos de suscripción YA EXISTEN en la tabla brands');
        console.log('   La migración ya fue ejecutada anteriormente.\n');

        // Mostrar estadísticas
        const { data: stats } = await supabase
          .from('brands')
          .select('subscription_status');

        if (stats) {
          const statusCount = stats.reduce((acc: any, brand: any) => {
            acc[brand.subscription_status] = (acc[brand.subscription_status] || 0) + 1;
            return acc;
          }, {});

          console.log('📊 Estadísticas de suscripciones:');
          Object.entries(statusCount).forEach(([status, count]) => {
            console.log(`   - ${status}: ${count}`);
          });
        }
      } else {
        console.log('⚠️  Los campos de suscripción NO EXISTEN en la tabla brands');
        console.log('   Debes ejecutar la migración en Supabase SQL Editor.\n');
      }
    }

    console.log('\n✨ Verificación completada');

  } catch (error: any) {
    console.error('❌ Error durante la verificación:', error.message);
    process.exit(1);
  }
}

// Ejecutar migración
runMigration()
  .then(() => {
    console.log('\n✅ Script completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error fatal:', error);
    process.exit(1);
  });
