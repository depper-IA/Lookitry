/**
 * Ejecuta la migración de campos de widget usando Supabase Admin API
 * Ejecutar: npx ts-node src/scripts/run-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

async function runMigration() {
  console.log('🔄 Ejecutando migración...\n');

  // Intentar actualizar un registro con los nuevos campos para forzar el error
  // y confirmar si las columnas existen
  const { error: testError } = await supabase
    .from('brands')
    .update({ widget_template: 'minimal' } as any)
    .eq('id', '00000000-0000-0000-0000-000000000000'); // ID que no existe

  if (testError && testError.message.includes('widget_template')) {
    console.log('❌ Columna widget_template NO existe en la tabla brands');
    console.log('\n📋 INSTRUCCIONES PARA EJECUTAR LA MIGRACIÓN:\n');
    console.log('1. Ve a: https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/sql/new');
    console.log('2. Pega y ejecuta el siguiente SQL:\n');
    console.log('─'.repeat(60));
    console.log(`ALTER TABLE public.brands
  ADD COLUMN IF NOT EXISTS widget_template VARCHAR(50) DEFAULT 'minimal',
  ADD COLUMN IF NOT EXISTS button_text VARCHAR(100) DEFAULT 'Probarme esto',
  ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT '';`);
    console.log('─'.repeat(60));
    console.log('\n3. Haz clic en "Run" (o Ctrl+Enter)');
    console.log('4. Reinicia el backend\n');
  } else {
    console.log('✅ Las columnas ya existen o la migración fue exitosa');
  }
}

runMigration().catch(console.error);
