/**
 * Run Rebecca Ratings Migration
 * 
 * Ejecuta la migración de rebecca_message_ratings via el backend API.
 * El backend ya tiene supabaseAdmin configurado.
 * 
 * Usage: node scripts/run-rebecca-migration.js
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan SUPABASE_URL o SUPABASE_SERVICE_KEY en .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists() {
  const { data, error } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_name', 'rebecca_message_ratings');
  
  return data && data.length > 0;
}

async function createTable() {
  // Crear la tabla directamente usando supabase-admin
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
  `;

  // Supabase no permite ejecutar DDL directamente desde el cliente JS
  // Necesitamos usar el Management API o un endpoint de admin
  console.log('⚠️ No se puede ejecutar DDL directamente desde el cliente.');
  console.log('📋 Opciones:');
  console.log('1. Ejecutar desde Supabase Dashboard (SQL Editor)');
  console.log('2. Usar el Management API con access token');
  console.log('3. Deployar el backend que tiene el endpoint de migración');
  
  return false;
}

async function run() {
  console.log('🔍 Verificando si la tabla rebecca_message_ratings existe...\n');
  
  const exists = await checkTableExists();
  
  if (exists) {
    console.log('✅ Tabla rebecca_message_ratings ya existe');
    
    // Verificar estructura
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'rebecca_message_ratings')
      .order('ordinal_position');
    
    console.log('\n📋 Estructura actual:');
    columns?.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    
    return;
  }
  
  console.log('📋 La tabla no existe. Para crearla, ejecutar este SQL en Supabase Dashboard:\n');
  console.log(`
-- Migration: Add rebecca_message_ratings table
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ratings_session ON rebecca_message_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON rebecca_message_ratings(created_at);
CREATE INDEX IF NOT EXISTS idx_ratings_admin_reviewed ON rebecca_message_ratings(admin_reviewed) WHERE admin_reviewed = FALSE;
CREATE INDEX IF NOT EXISTS idx_ratings_rating ON rebecca_message_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_ratings_brand ON rebecca_message_ratings(brand_id);

-- Trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_rebecca_message_ratings_updated_at
    BEFORE UPDATE ON rebecca_message_ratings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
}

run().catch(console.error);