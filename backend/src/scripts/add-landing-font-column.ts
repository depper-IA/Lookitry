import { supabaseAdmin } from '../config/supabase';

async function migrate() {
  console.log('🚀 Iniciando migración: Añadiendo columna landing_font a brands...');

  try {
    // Intentar añadir la columna usando SQL directo via rpc o asumiendo que el cliente tiene permisos
    // Como Supabase JS no tiene un comando directo para ALTER TABLE, usamos una consulta de muestra para ver si falla
    const { error } = await supabaseAdmin
      .from('brands')
      .select('landing_font')
      .limit(1);

    if (!error) {
      console.log('✅ La columna landing_font ya existe.');
      return;
    }

    if (error && error.code === '42703') { // Undefined column
      console.log('⏳ La columna no existe. Por favor, ejecuta este SQL en tu panel de Supabase:');
      console.log(`
        ALTER TABLE brands ADD COLUMN landing_font TEXT DEFAULT 'font-jakarta';
      `);
      
      // Intentamos ejecutarlo via RPC si existe una función para ello, 
      // pero por ahora lo dejamos como instrucción clara.
    } else {
      console.error('❌ Error al verificar columna:', error);
    }
  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

migrate();
