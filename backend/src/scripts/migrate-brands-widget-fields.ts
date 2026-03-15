/**
 * Migración: Agregar campos de personalización del widget a la tabla brands
 * Ejecutar: npx ts-node src/scripts/migrate-brands-widget-fields.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrate() {
  console.log('🔄 Iniciando migración: campos de widget en tabla brands...\n');

  // Verificar columnas actuales
  const { data: sample, error: sampleError } = await supabase
    .from('brands')
    .select('*')
    .limit(1)
    .single();

  if (sampleError && sampleError.code !== 'PGRST116') {
    console.error('❌ Error al consultar tabla brands:', sampleError.message);
    process.exit(1);
  }

  const existingColumns = sample ? Object.keys(sample) : [];
  console.log('📋 Columnas actuales:', existingColumns.join(', '));

  const missingColumns: string[] = [];
  if (!existingColumns.includes('widget_template')) missingColumns.push('widget_template');
  if (!existingColumns.includes('button_text')) missingColumns.push('button_text');
  if (!existingColumns.includes('welcome_message')) missingColumns.push('welcome_message');

  if (missingColumns.length === 0) {
    console.log('\n✅ Todos los campos ya existen. No se requiere migración.');
    process.exit(0);
  }

  console.log('\n⚠️  Columnas faltantes:', missingColumns.join(', '));
  console.log('\n📝 SQL para ejecutar en Supabase Dashboard > SQL Editor:\n');
  console.log('─'.repeat(60));
  console.log(`ALTER TABLE public.brands`);
  if (missingColumns.includes('widget_template')) {
    console.log(`  ADD COLUMN IF NOT EXISTS widget_template VARCHAR(50) DEFAULT 'minimal',`);
  }
  if (missingColumns.includes('button_text')) {
    console.log(`  ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Probarme esto',`);
  }
  if (missingColumns.includes('welcome_message')) {
    console.log(`  ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';`);
  }
  console.log('─'.repeat(60));
  console.log('\n👆 Copia y ejecuta ese SQL en: https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/sql/new');
  console.log('\nDespués de ejecutar el SQL, reinicia el backend.');
}

migrate().catch(console.error);
