/**
 * Script para ejecutar la migración de ratings de Rebecca
 * Uso: node scripts/run-migration.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Ejecutando migración: rebecca_message_ratings');
  
  const sql = `
    CREATE TABLE IF NOT EXISTS rebecca_message_ratings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      session_id TEXT NOT NULL,
      brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
      message_index INTEGER NOT NULL,
      message_content TEXT NOT NULL,
      rebecca_response TEXT,
      rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
      rating_label TEXT CHECK (rating_label IN ('thumbs_up', 'thumbs_down')),
      lead_intent TEXT,
      conversation_outcome TEXT CHECK (conversation_outcome IN ('converted', 'abandoned', 'pending')),
      admin_reviewed BOOLEAN DEFAULT FALSE,
      admin_notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_ratings_session ON rebecca_message_ratings(session_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_created ON rebecca_message_ratings(created_at);
    CREATE INDEX IF NOT EXISTS idx_ratings_admin_reviewed ON rebecca_message_ratings(admin_reviewed) WHERE admin_reviewed = FALSE;
    CREATE INDEX IF NOT EXISTS idx_ratings_rating ON rebecca_message_ratings(rating);
    CREATE INDEX IF NOT EXISTS idx_ratings_brand ON rebecca_message_ratings(brand_id);

    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';

    DROP TRIGGER IF EXISTS update_rebecca_message_ratings_updated_at ON rebecca_message_ratings;
    CREATE TRIGGER update_rebecca_message_ratings_updated_at
      BEFORE UPDATE ON rebecca_message_ratings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  `;

  try {
    // Usamos rpc para ejecutar SQL raw - primero verificamos si la tabla existe
    const { error } = await supabase.rpc('exec', { sql_query: sql });
    
    if (error) {
      // Si rpc no existe, intentamos otra forma
      console.log('Intentando via API alternativa...');
      
      // Verificar si la tabla ya existe
      const { data: tableExists } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'rebecca_message_ratings')
        .single();
      
      if (tableExists) {
        console.log('✅ Tabla rebecca_message_ratings ya existe');
        return;
      }
      
      throw error;
    }
    
    console.log('✅ Migración ejecutada exitosamente');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
    
    // Verificar si la tabla se creó parcialmente
    const { data: check } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'rebecca_message_ratings');
    
    if (check && check.length > 0) {
      console.log('✅ Tabla rebecca_message_ratings ya existe');
    } else {
      console.log('⚠️ La tabla no existe. Ejecuta manualmente:');
      console.log('psql $DATABASE_URL -f backend/migrations/20260523_add_rebecca_message_ratings.sql');
    }
  }
}

runMigration();