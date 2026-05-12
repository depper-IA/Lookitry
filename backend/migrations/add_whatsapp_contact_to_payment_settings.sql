-- Migration: add_whatsapp_contact_to_payment_settings
-- Date: 2026-04-28
-- Purpose: Agregar campo whatsapp_contact configurable para lead capture

ALTER TABLE payment_settings
ADD COLUMN IF NOT EXISTS whatsapp_contact TEXT DEFAULT '+573105436281';

-- Actualizar el registro existente con el valor por defecto
UPDATE payment_settings
SET whatsapp_contact = '+573105436281'
WHERE id = 1 AND whatsapp_contact IS NULL;