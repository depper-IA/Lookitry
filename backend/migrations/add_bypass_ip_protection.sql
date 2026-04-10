-- Migración: Agregar columna bypass_ip_protection a payment_settings
-- Esta columna permite desactivar la protección por IP en registros de prueba

ALTER TABLE payment_settings
  ADD COLUMN IF NOT EXISTS bypass_ip_protection BOOLEAN DEFAULT false NOT NULL;

-- Asegurar que el registro singleton existe
INSERT INTO payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
