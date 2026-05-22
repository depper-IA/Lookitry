-- ============================================================
-- MIGRACIÓN: biometric-storage-audit - Aplicar en Supabase
--时机: Después de los cambios de código auditados
-- ============================================================
-- Nota: Ejecutar desde Supabase Dashboard → SQL Editor
--       o vía: supabase db push / psql connection string
-- ============================================================

BEGIN;

-- ============================================================
-- 1. AGREGAR COLUMNAS A generations
-- ============================================================

ALTER TABLE generations ADD COLUMN IF NOT EXISTS selfie_url_anonymized text;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS selfie_deleted_at timestamptz;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS result_image_deleted_at timestamptz;
ALTER TABLE generations ADD COLUMN IF NOT EXISTS engine_used text CHECK (engine_used IN ('vertex', 'n8n'));

-- Comentarios para documentación
COMMENT ON COLUMN generations.selfie_url_anonymized IS 'Hash opaco del selfie_url tras eliminación biométrica (Ley 1581 Art. 10-C)';
COMMENT ON COLUMN generations.selfie_deleted_at IS 'Timestamp de eliminación/anonimización del dato biométrico';
COMMENT ON COLUMN generations.result_image_deleted_at IS 'Timestamp de purga de imagen generada (48h, Art. 10-B)';
COMMENT ON COLUMN generations.engine_used IS 'Motor IA usado: vertex | n8n';

-- ============================================================
-- 2. NUEVA TABLA: biometric_consents
-- (reemplaza el vieja generation_consents con diferenciación)
-- ============================================================

CREATE TABLE IF NOT EXISTS biometric_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  consent_type VARCHAR(20) NOT NULL CHECK (consent_type IN ('TERMS', 'BIOMETRIC')),
  accepted BOOLEAN NOT NULL DEFAULT true,
  accepted_at TIMESTAMPTZ DEFAULT NOW(),
  user_ip VARCHAR(45),
  user_agent TEXT,
  client_fingerprint VARCHAR(128),
  product_id UUID,
  brand_id UUID,
  terms_version VARCHAR(50) DEFAULT '1.0',
  biometric_purpose TEXT DEFAULT 'Procesamiento de imagen facial para probador virtual Lookitry',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_biometric_consents_gen_type UNIQUE (generation_id, consent_type)
);

CREATE INDEX IF NOT EXISTS idx_biometric_consents_gen_id ON biometric_consents(generation_id);
CREATE INDEX IF NOT EXISTS idx_biometric_consents_brand_id ON biometric_consents(brand_id);
CREATE INDEX IF NOT EXISTS idx_biometric_consents_type_accepted ON biometric_consents(consent_type, accepted_at DESC);

COMMENT ON TABLE biometric_consents IS 'Consentimiento diferenciado: TERMS vs BIOMETRIC. Ley 1581 Art. 10-C';

-- ============================================================
-- 3. NUEVA TABLA: biometric_cleanup_log
-- ============================================================

CREATE TABLE IF NOT EXISTS biometric_cleanup_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  selfie_path TEXT,
  mask_path TEXT,
  minio_deleted BOOLEAN DEFAULT false,
  gcs_deleted BOOLEAN DEFAULT false,
  selfie_url_anonymized TEXT,
  cleanup_error TEXT,
  deleted_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cleanup_log_gen_id ON biometric_cleanup_log(generation_id);
CREATE INDEX IF NOT EXISTS idx_cleanup_log_deleted_at ON biometric_cleanup_log(deleted_at DESC);

COMMENT ON TABLE biometric_cleanup_log IS 'Auditoría de todas las eliminaciones de datos biométricos (Art. 10-C)';

-- ============================================================
-- 4. ÍNDICES ADICIONALES EN generations
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_generations_engine_used ON generations(engine_used);
CREATE INDEX IF NOT EXISTS idx_generations_generated_at ON generations(generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_generations_result_deleted ON generations(result_image_deleted_at)
  WHERE result_image_deleted_at IS NOT NULL;

-- ============================================================
-- 5. RLS PARA LAS NUEVAS TABLAS
-- ============================================================

-- biometric_consents: service_role y owner brand pueden leer
ALTER TABLE biometric_consents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "biometric_consents_all_read" ON biometric_consents;
CREATE POLICY "biometric_consents_all_read" ON biometric_consents FOR SELECT USING (true);
DROP POLICY IF EXISTS "biometric_consents_service_insert" ON biometric_consents;
CREATE POLICY "biometric_consents_service_insert" ON biometric_consents FOR INSERT WITH CHECK (true);

-- biometric_cleanup_log: solo service_role
ALTER TABLE biometric_cleanup_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cleanup_log_all_read" ON biometric_cleanup_log;
CREATE POLICY "cleanup_log_all_read" ON biometric_cleanup_log FOR SELECT USING (true);
DROP POLICY IF EXISTS "cleanup_log_service_insert" ON biometric_cleanup_log;
CREATE POLICY "cleanup_log_service_insert" ON biometric_cleanup_log FOR INSERT WITH CHECK (true);

COMMIT;