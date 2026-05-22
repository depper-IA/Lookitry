-- Migration: Add biometric_consents table for differentiated consent tracking
-- Purpose: Track BIOMETRIC vs TERMS consent separately for Ley 1581 Art. 10-C compliance
-- 
-- Consent types:
--   TERMS  — Aceptación de Términos y Condiciones generales del servicio
--   BIOMETRIC — Consentimiento expreso para procesamiento de datos biométricos (selfie)
--
-- Each generation can have up to 2 records: one TERMS, one BIOMETRIC
-- This replaces the old single-record `generation_consents` table

DROP TABLE IF EXISTS biometric_consents;

CREATE TABLE biometric_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID NOT NULL REFERENCES generations(id) ON DELETE CASCADE,
  consent_type VARCHAR(20) NOT NULL CHECK (consent_type IN ('TERMS', 'BIOMETRIC')),
  accepted BOOLEAN NOT NULL DEFAULT true,
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_ip VARCHAR(45),
  user_agent TEXT,
  client_fingerprint VARCHAR(128), -- hash of browser/session for identity verification
  product_id UUID, -- producto asociado a la generación
  brand_id UUID, -- marca que solicita la generación
  terms_version VARCHAR(50) DEFAULT '1.0',
  biometric_purpose TEXT DEFAULT 'Procesamiento de imagen facial para probador virtual Lookitry',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT uq_biometric_consents_generation_type UNIQUE (generation_id, consent_type)
);

-- Index for lookups by generation_id
CREATE INDEX IF NOT EXISTS idx_biometric_consents_generation_id
  ON biometric_consents(generation_id);

-- Index for lookups by brand_id (audit queries)
CREATE INDEX IF NOT EXISTS idx_biometric_consents_brand_id
  ON biometric_consents(brand_id);

-- Index for audit queries by accepted_at
CREATE INDEX IF NOT EXISTS idx_biometric_consents_accepted_at
  ON biometric_consents(accepted_at DESC);

-- Index for compliance reports (BIOMETRIC consent by date range)
CREATE INDEX IF NOT EXISTS idx_biometric_consents_type_accepted
  ON biometric_consents(consent_type, accepted_at DESC);

COMMENT ON TABLE biometric_consents IS 'Registro de consentimiento diferenciado: TERMS vs BIOMETRIC. Requerido para Ley 1581 Art. 10-C.';
COMMENT ON COLUMN biometric_consents.consent_type IS 'TERMS = aceptación de T&C generales. BIOMETRIC = consentimiento expreso para procesamiento de datos biométricos.';
COMMENT ON COLUMN biometric_consents.biometric_purpose IS 'Descripción del propósito del tratamiento biométrico, conforme Art. 10-C Ley 1581.';