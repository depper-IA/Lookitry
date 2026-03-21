// Script para agregar la columna landing_template a la tabla brands
// Ejecutar con: node src/scripts/run-landing-template-migration.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_URL y SUPABASE_SERVICE_KEY deben estar configurados en .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function runMigration() {
  console.log('🚀 Ejecutando migración: agregar columna landing_template...\n');

  try {
    // Verificar si la columna ya existe
    console.log('🔍 Verificando si la columna ya existe...');
    const { data: testData, error: testError } = await supabase
      .from('brands')
      .select('id, landing_template')
      .limit(1);

    if (!testError) {
      console.log('✅ La columna landing_template ya existe!');
      console.log('📊 Datos de prueba:', testData);
      
      // Mostrar algunas marcas con sus templates
      const { data: brands } = await supabase
        .from('brands')
        .select('id, name, landing_template')
        .limit(5);
      
      console.log('\n📋 Primeras 5 marcas:');
      console.table(brands);
      
      process.exit(0);
    }

    console.log('⚠️  La columna no existe. Procediendo con la migración...\n');

    // Ejecutar ALTER TABLE usando SQL directo
    // Nota: Supabase no permite ALTER TABLE desde el cliente JS directamente
    // Necesitamos usar una función PostgreSQL o el dashboard
    
    console.log('❌ No se puede ejecutar ALTER TABLE desde el cliente JS de Supabase.');
    console.log('\n📝 Por favor, ejecuta el siguiente SQL en el dashboard de Supabase:');
    console.log('   https://supabase.com/dashboard/project/vkdooutklowctuudjnkl/editor\n');
    console.log('```sql');
    console.log('ALTER TABLE brands');
    console.log("ADD COLUMN IF NOT EXISTS landing_template VARCHAR(20) DEFAULT 'classic';");
    console.log('```\n');
    
    process.exit(1);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

runMigration();
