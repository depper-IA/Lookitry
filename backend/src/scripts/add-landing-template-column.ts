import { supabaseAdmin } from '../config/supabase';

async function addLandingTemplateColumn() {
  try {
    console.log('🚀 Agregando columna landing_template a la tabla brands...');

    // Ejecutar la migración directamente
    const { error } = await supabaseAdmin.rpc('exec', {
      query: `
        ALTER TABLE brands
        ADD COLUMN IF NOT EXISTS landing_template VARCHAR(20) DEFAULT 'classic';

        UPDATE brands
        SET landing_template = 'moderno'
        WHERE landing_template = 'probador';

        COMMENT ON COLUMN brands.landing_template IS 'Template de la mini-landing: classic, editorial, moderno';
      `
    });

    if (error) {
      console.error('❌ Error al ejecutar migración:', error);
      console.log('\n💡 Intentando método alternativo...');
      
      // Método alternativo: ejecutar cada statement por separado
      const statements = [
        "ALTER TABLE brands ADD COLUMN IF NOT EXISTS landing_template VARCHAR(20) DEFAULT 'classic'",
        "UPDATE brands SET landing_template = 'moderno' WHERE landing_template = 'probador'",
      ];

      for (const stmt of statements) {
        console.log(`Ejecutando: ${stmt}`);
        const { error: stmtError } = await (supabaseAdmin as any).rpc('exec', { query: stmt });
        if (stmtError) {
          console.error(`❌ Error en statement:`, stmtError);
        }
      }
    } else {
      console.log('✅ Migración ejecutada correctamente');
    }

    // Verificar que la columna existe
    console.log('\n🔍 Verificando columna...');
    const { data: brands, error: selectError } = await supabaseAdmin
      .from('brands')
      .select('id, name, landing_template')
      .limit(3);

    if (selectError) {
      console.error('❌ Error al verificar:', selectError);
      console.log('\n💡 La columna probablemente ya existe. Verifica manualmente en Supabase Dashboard.');
    } else {
      console.log('✅ Columna verificada. Primeras 3 marcas:');
      console.table(brands);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

addLandingTemplateColumn();
